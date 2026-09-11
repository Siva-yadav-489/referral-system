import { db } from "@/db";
import {
  bookings,
  customers,
  beds,
  referralLeads,
  referrals,
} from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import {
  Booking,
  NewBooking,
  Customer,
  NewCustomer,
  BookingWithDetails,
  BookingTransactionResult,
  CustomerIdProofType,
} from "./booking.types";
import { getBillingPeriodsBetween } from "../billing/billing.utils";
import { BillingModel } from "../billing/billing.model";
import { addMonths, isAfter } from "date-fns";

export class BookingModel {
  static async createCustomer(data: NewCustomer): Promise<Customer> {
    const [newCustomer] = await db.insert(customers).values(data).returning();
    return newCustomer;
  }

  static async findCustomerById(id: string): Promise<Customer | undefined> {
    const [customer] = await db
      .select()
      .from(customers)
      .where(eq(customers.id, id));
    return customer;
  }

  static async createBooking(data: NewBooking): Promise<Booking> {
    const [newBooking] = await db.insert(bookings).values(data).returning();
    return newBooking;
  }

  static async getBookingById(id: string): Promise<Booking | undefined> {
    const [booking] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, id));
    return booking;
  }

  static async getBookingWithDetailsById(
    id: string,
  ): Promise<BookingWithDetails | undefined> {
    const booking = await db.query.bookings.findFirst({
      where: eq(bookings.id, id),
      with: {
        customer: true,
        bed: {
          with: {
            room: true,
          },
        },
      },
    });
    return booking as BookingWithDetails | undefined;
  }

  static async getAllBookingsByOwnerId(
    ownerId: string,
    propertyId?: string,
  ): Promise<BookingWithDetails[]> {
    const conditions = [eq(bookings.ownerId, ownerId)];
    if (propertyId) {
      conditions.push(eq(bookings.propertyId, propertyId));
    }

    const allBookings = await db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        bed: {
          with: {
            room: true,
          },
        },
        property: true,
      },
    });
    return allBookings as BookingWithDetails[];
  }

  static async getActiveBookingsByOwnerId(
    ownerId: string,
    propertyId?: string,
  ): Promise<BookingWithDetails[]> {
    const conditions = [
      eq(bookings.ownerId, ownerId),
      eq(bookings.status, "ACTIVE"),
    ];
    if (propertyId) {
      conditions.push(eq(bookings.propertyId, propertyId));
    }

    const activeBookings = await db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        bed: {
          with: {
            room: true,
          },
        },
        property: true,
      },
    });
    return activeBookings as BookingWithDetails[];
  }

  static async updateBooking(
    id: string,
    data: Partial<Booking>,
  ): Promise<Booking> {
    const [updatedBooking] = await db
      .update(bookings)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(bookings.id, id))
      .returning();
    return updatedBooking;
  }

  static async createBookingTransaction(params: {
    ownerId: string;
    propertyId: string;
    bedId: string;
    customerData: {
      name: string;
      contactNo: string;
      email: string;
      idProofType?: CustomerIdProofType;
      idProofNumber?: string;
      emergencyContact?: string;
    };
    agreedMonthlyRent: number;
    startDate: string;
    endDate?: string;
    depositAmountCollected: number;
  }): Promise<BookingTransactionResult> {
    return await db.transaction(async (tx) => {
      // 1. Create or register customer profile
      const [customer] = await tx
        .insert(customers)
        .values({
          id: crypto.randomUUID(),
          ownerId: params.ownerId,
          // propertyId: params.propertyId,
          name: params.customerData.name,
          contactNo: params.customerData.contactNo,
          email: params.customerData.email,
          idProofType: params.customerData.idProofType || null,
          idProofNumber: params.customerData.idProofNumber || null,
          emergencyContact: params.customerData.emergencyContact || null,
        })
        .returning();

      // 2. Create active booking record
      const [booking] = await tx
        .insert(bookings)
        .values({
          id: crypto.randomUUID(),
          ownerId: params.ownerId,
          propertyId: params.propertyId,
          bedId: params.bedId,
          customerId: customer.id,
          agreedMonthlyRent: params.agreedMonthlyRent.toFixed(2),
          depositAmountCollected: params.depositAmountCollected.toFixed(2),
          startDate: params.startDate,
          endDate: params.endDate || null,
          status: "ACTIVE",
        })
        .returning();

      // 3. Update Bed status to OCCUPIED
      await tx
        .update(beds)
        .set({ status: "OCCUPIED", updatedAt: new Date() })
        .where(eq(beds.id, params.bedId));

      // 4. Check if the customer was referred by anyone
      const [referredCustomer] = await tx
        .select()
        .from(referralLeads)
        .where(
          and(
            eq(referralLeads.refereeEmail, params.customerData.email),
            eq(referralLeads.refereeContactNo, params.customerData.contactNo),
          ),
        )
        .orderBy(asc(referralLeads.createdAt))
        .limit(1);

      // if referred customer is found, then create a referral record
      if (referredCustomer) {
        await tx.insert(referrals).values({
          id: crypto.randomUUID(),
          propertyId: params.propertyId,
          referralLeadId: referredCustomer.id,
          referrerId: referredCustomer.referrerId,
          customerId: customer.id,
          status: "ACTIVE",
          rewardPoints: 2000,
          activatedAt: new Date(),
        });
      }

      // 5. TODO: Need to create a job scheduled to run after exactly 3months from the bookingStartDate.
      // the job should check if the booking is still active or not. if active then update the referrer's points by adding the reward points mentioned in referrals table to the referrer, upadate the refrral status to QUALIFIED.
      // and if the booking is not active then update  the referral status to DISQUALIFIED.
      // (optional) also when tenant checksout or cancels booking, check if there is an active referral and booking period is less than 3 months, if yes then cancel that job update referral status to DISQUALIFIED.
      return {
        booking,
        customer,
      };
    });
  }

  static async checkoutTenantTransaction(
    bookingId: string,
    bedId: string,
  ): Promise<Booking> {
    return await db.transaction(async (tx) => {
      /**
       * Get booking
       */
      const [booking] = await tx
        .select()
        .from(bookings)
        .where(eq(bookings.id, bookingId));

      if (!booking) {
        throw new Error("Booking not found");
      }

      if (booking.status !== "ACTIVE" && booking.status !== "EXTENDED") {
        throw new Error("Booking is already closed");
      }

      /**
       * Checkout date - the day when calling checkout
       */
      const checkoutDate = new Date().toISOString().split("T")[0];

      /**
       * Make sure checkout isn't before move-in
       */
      if (checkoutDate < booking.startDate) {
        throw new Error("Checkout date cannot be before booking start date");
      }

      /**
       * Close booking
       */
      const [closedBooking] = await tx
        .update(bookings)
        .set({
          status: "COMPLETED",
          endDate: checkoutDate,
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      /**
       * Generate any missing invoices
       *
       * This is idempotent because of the
       * unique database constraint.
       */
      const billingPeriods = getBillingPeriodsBetween(
        new Date(closedBooking.startDate),
        new Date(closedBooking.endDate!),
      );

      for (const billingPeriod of billingPeriods) {
        await BillingModel.createCheckoutInvoiceForBookingPeriod(
          tx,
          closedBooking,
          billingPeriod,
        );
      }

      /**
       * Vacate bed
       */
      await tx
        .update(beds)
        .set({
          status: "VACANT",
          updatedAt: new Date(),
        })
        .where(eq(beds.id, bedId));

      /*** Check if there is an active referral for the customer of this booking,
       * if yes then check if booking end date is before 3 months from the booking start date, if yes then cancel that job and update referral status to DISQUALIFIED.
       */

      const [activeReferral] = await tx
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.customerId, booking.customerId),
            eq(referrals.status, "ACTIVE"),
          ),
        );

      if (activeReferral?.id) {
        const threeMonthsAfterBookingStart = addMonths(
          new Date(booking.startDate),
          3,
        );
        const isBookingAfterThreeMonths = isAfter(
          new Date(booking.endDate!),
          threeMonthsAfterBookingStart,
        );

        if (!isBookingAfterThreeMonths) {
          // TODO: when job implementation is done add logic to cancel that job here.
          await tx
            .update(referrals)
            .set({
              status: "DISQUALIFIED",
              updatedAt: new Date(),
            })
            .where(eq(referrals.id, activeReferral.id));
        }
      }
      return closedBooking;
    });
  }

  static async cancelBookingTransaction(
    bookingId: string,
    bedId: string,
  ): Promise<Booking> {
    return await db.transaction(async (tx) => {
      const [cancelledBooking] = await tx
        .update(bookings)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(bookings.id, bookingId))
        .returning();

      await tx
        .update(beds)
        .set({ status: "VACANT", updatedAt: new Date() })
        .where(eq(beds.id, bedId));

      /*** Check if there is an active referral for the customer of this booking,
       * if yes then check if booking end date is before 3 months from the booking start date, if yes then cancel that job and update referral status to DISQUALIFIED.
       */

      const [activeReferral] = await tx
        .select()
        .from(referrals)
        .where(
          and(
            eq(referrals.customerId, cancelledBooking.customerId),
            eq(referrals.status, "ACTIVE"),
          ),
        );

      if (activeReferral?.id) {
        const threeMonthsAfterBookingStart = addMonths(
          new Date(cancelledBooking.startDate),
          3,
        );
        const isBookingAfterThreeMonths = isAfter(
          new Date(cancelledBooking.endDate!),
          threeMonthsAfterBookingStart,
        );

        if (!isBookingAfterThreeMonths) {
          // TODO: when job implementation is done add logic to cancel that job here.
          await tx
            .update(referrals)
            .set({
              status: "DISQUALIFIED",
              updatedAt: new Date(),
            })
            .where(eq(referrals.id, activeReferral.id));
        }
      }

      return cancelledBooking;
    });
  }

  static async getAvailableBeds(ownerId: string, propertyId?: string) {
    const conditions = [eq(beds.status, "VACANT")];
    if (propertyId) {
      conditions.push(eq(beds.propertyId, propertyId));
    }
    const results = await db.query.beds.findMany({
      where: and(...conditions),
      with: {
        room: true,
        property: true,
      },
      orderBy: (beds, { asc }) => [asc(beds.bedNumber)],
    });
    return results.filter((b) => b.property?.ownerId === ownerId);
  }
}
