import { db } from "@/db";
import { invoices, bookings } from "@/db/schema";
import { eq, and, gte, lte, or, isNull } from "drizzle-orm";
import { Invoice, NewInvoice, InvoiceWithDetails } from "./billing.types";
import { Booking } from "../booking/booking.types";
import { BillingPeriod, calculateBillingAmount } from "./billing.utils";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class BillingModel {
  static async createInvoice(data: NewInvoice): Promise<Invoice> {
    const [invoice] = await db.insert(invoices).values(data).returning();
    return invoice;
  }

  static async createInvoiceIfNotExists(
    data: NewInvoice,
  ): Promise<Invoice | null> {
    const [invoice] = await db
      .insert(invoices)
      .values(data)
      .onConflictDoNothing({
        target: [
          invoices.bookingId,
          invoices.billingPeriodStart,
          invoices.billingPeriodEnd,
        ],
      })
      .returning();

    return invoice ?? null;
  }

  static async createInvoicesBatch(records: NewInvoice[]): Promise<Invoice[]> {
    if (records.length === 0) return [];

    const createdInvoices: Invoice[] = [];

    for (const record of records) {
      const invoice = await this.createInvoiceIfNotExists(record);
      if (invoice) {
        createdInvoices.push(invoice);
      }
    }

    return createdInvoices;
  }

  // used for early checkout only which is manually done by PG owner, so due date is same day and status is PAID
  static async createCheckoutInvoiceForBookingPeriod(
    tx: DbTransaction,
    booking: Booking,
    billingPeriod: BillingPeriod,
  ): Promise<Invoice | null> {
    const calculation = calculateBillingAmount({
      monthlyRate: Number(booking.agreedMonthlyRent),
      bookingStartDate: new Date(booking.startDate),
      bookingEndDate: booking.endDate ? new Date(booking.endDate) : null,
      billingPeriod,
    });

    if (!calculation) {
      return null;
    }

    const [invoice] = await tx
      .insert(invoices)
      .values({
        id: crypto.randomUUID(),

        bookingId: booking.id,
        ownerId: booking.ownerId,
        propertyId: booking.propertyId,
        bedId: booking.bedId,
        customerId: booking.customerId,

        billingPeriodStart: calculation.billingPeriodStartString,

        billingPeriodEnd: calculation.billingPeriodEndString,

        servicePeriodStart: calculation.servicePeriodStartString,

        servicePeriodEnd: calculation.servicePeriodEndString,

        billableDays: calculation.billableDays,

        amount: calculation.amount.toString(),

        isProrated: calculation.isProrated,

        status: "PAID",

        dueDate: calculation.servicePeriodEndString,
      })
      .onConflictDoNothing({
        target: [
          invoices.bookingId,
          invoices.billingPeriodStart,
          invoices.billingPeriodEnd,
        ],
      })
      .returning();

    return invoice ?? null;
  }

  static async getInvoiceById(id: string): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, id));
    return invoice;
  }

  static async getInvoiceWithDetailsById(
    id: string,
  ): Promise<InvoiceWithDetails | undefined> {
    const invoice = await db.query.invoices.findFirst({
      where: eq(invoices.id, id),
      with: {
        booking: {
          with: {
            customer: true,
            bed: true,
            property: true,
          },
        },
      },
    });
    return invoice as InvoiceWithDetails | undefined;
  }

  static async getInvoicesByOwnerId(
    ownerId: string,
    filter?: {
      month?: number;
      year?: number;
      status?: "PENDING" | "PAID" | "OVERDUE";
      propertyId?: string;
      customerId?: string;
      bedId?: string;
    },
  ): Promise<InvoiceWithDetails[]> {
    const conditions = [eq(invoices.ownerId, ownerId)];

    if (filter?.status) {
      conditions.push(eq(invoices.status, filter.status));
    }

    if (filter?.year && filter?.month) {
      const monthStr = String(filter.month).padStart(2, "0");
      const startDateStr = `${filter.year}-${monthStr}-01`;
      const lastDay = new Date(filter.year, filter.month, 0).getDate();
      const endDateStr = `${filter.year}-${monthStr}-${String(lastDay).padStart(2, "0")}`;

      conditions.push(
        gte(invoices.billingPeriodStart, startDateStr),
        lte(invoices.billingPeriodStart, endDateStr),
      );
    } else if (filter?.year) {
      conditions.push(
        gte(invoices.billingPeriodStart, `${filter.year}-01-01`),
        lte(invoices.billingPeriodStart, `${filter.year}-12-31`),
      );
    }

    const rawInvoices = await db.query.invoices.findMany({
      where: and(...conditions),
      with: {
        booking: {
          with: {
            customer: true,
            bed: true,
            property: true,
          },
        },
      },
      orderBy: (invoices, { desc }) => [desc(invoices.createdAt)],
    });

    let results = rawInvoices as InvoiceWithDetails[];

    if (filter?.propertyId) {
      results = results.filter(
        (inv) => inv.booking?.propertyId === filter.propertyId,
      );
    }

    if (filter?.customerId) {
      results = results.filter(
        (inv) => inv.booking?.customerId === filter.customerId,
      );
    }

    if (filter?.bedId) {
      results = results.filter((inv) => inv.booking?.bedId === filter.bedId);
    }

    return results;
  }

  static async updateInvoice(
    id: string,
    data: Partial<Invoice>,
  ): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  static async updateInvoiceStatus(
    id: string,
    status: "PENDING" | "PAID" | "OVERDUE",
  ): Promise<Invoice> {
    const [updated] = await db
      .update(invoices)
      .set({ status, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return updated;
  }

  static async getActiveBookingsForBilling(ownerId?: string) {
    const conditions = [eq(bookings.status, "ACTIVE")];
    if (ownerId) {
      conditions.push(eq(bookings.ownerId, ownerId));
    }

    return db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        bed: true,
      },
    });
  }

  static async getBookingsOverlappingBillingPeriod(
    billingPeriodStart: string,
    billingPeriodEnd: string,
    ownerId?: string,
  ) {
    const conditions = [
      // Booking started before billing period ended
      lte(bookings.startDate, billingPeriodEnd),

      // Booking has no end date OR ended after billing period started
      or(isNull(bookings.endDate), gte(bookings.endDate, billingPeriodStart)),
    ];

    if (ownerId) {
      conditions.push(eq(bookings.ownerId, ownerId));
    }

    return db.query.bookings.findMany({
      where: and(...conditions),
      with: {
        customer: true,
        bed: true,
        property: true,
      },
    });
  }

  static async findExistingInvoiceForBookingPeriod(
    bookingId: string,
    billingPeriodStart: string,
  ): Promise<Invoice | undefined> {
    const [invoice] = await db
      .select()
      .from(invoices)
      .where(
        and(
          eq(invoices.bookingId, bookingId),
          eq(invoices.billingPeriodStart, billingPeriodStart),
        ),
      );
    return invoice;
  }
}
