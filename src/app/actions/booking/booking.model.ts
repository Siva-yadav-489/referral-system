import { db } from "@/db";
import { bookings, customers, beds } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import {
  Booking,
  NewBooking,
  Customer,
  NewCustomer,
  BookingWithDetails,
  BookingTransactionResult,
} from "./booking.types";
import { getBillingPeriodsBetween } from "../billing/billing.utils";
import { BillingModel } from "../billing/billing.model";

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
      email?: string;
      idProofType?: string;
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
          propertyId: params.propertyId,
          name: params.customerData.name,
          contactNo: params.customerData.contactNo,
          email: params.customerData.email || null,
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
