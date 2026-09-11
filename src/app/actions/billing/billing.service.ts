import { z } from "zod";
import {
  zodUpdateInvoiceStatusSchema,
  zodGetInvoicesFilterSchema,
  InvoiceResponse,
  InvoicesWithDetailsResponse,
  InvoiceWithDetailsResponse,
  MonthlyBillingJobResponse,
  Invoice,
} from "./billing.types";
import { BillingModel } from "./billing.model";
import { Booking } from "../booking/booking.types";
import {
  BillingPeriod,
  calculateBillingAmount,
  getInvoiceDueDate,
  getPreviousBillingPeriod,
} from "./billing.utils";

export class BillingService {
  /**
   * Retrieves all invoices for a PG owner with optional filters (month, year, status, propertyId, customerId)
   */
  static async getOwnerInvoices(
    ownerId: string,
    filterInput?: z.infer<typeof zodGetInvoicesFilterSchema>,
  ): Promise<InvoicesWithDetailsResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const validatedFilter = filterInput
        ? zodGetInvoicesFilterSchema.parse(filterInput)
        : undefined;

      const invoiceList = await BillingModel.getInvoicesByOwnerId(
        ownerId,
        validatedFilter,
      );

      return {
        success: true,
        data: invoiceList,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch invoices",
      };
    }
  }

  // /**
  //  * Retrieves invoices specifically filtered by a given year and month for the dashboard
  //  */
  // static async getInvoicesByMonth(
  //   ownerId: string,
  //   year: number,
  //   month: number,
  // ): Promise<InvoicesWithDetailsResponse> {
  //   try {
  //     if (!ownerId) {
  //       throw new Error("Unauthorized");
  //     }

  //     const validatedFilter = zodGetInvoicesFilterSchema.parse({ year, month });
  //     const invoiceList = await BillingModel.getInvoicesByOwnerId(
  //       ownerId,
  //       validatedFilter,
  //     );

  //     return {
  //       success: true,
  //       data: invoiceList,
  //     };
  //   } catch (error) {
  //     return {
  //       success: false,
  //       error:
  //         error instanceof Error
  //           ? error.message
  //           : "Failed to fetch monthly invoices",
  //     };
  //   }
  // }

  /**
   * Fetches a single invoice by ID with relations, ensuring ownership
   */
  static async getInvoiceById(
    ownerId: string,
    invoiceId: string,
  ): Promise<InvoiceWithDetailsResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const invoice = await BillingModel.getInvoiceWithDetailsById(invoiceId);
      if (!invoice) {
        throw new Error("Invoice not found");
      }
      if (invoice.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }

      return {
        success: true,
        data: invoice,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to fetch invoice",
      };
    }
  }

  /**
   * Updates an invoice status (e.g. from PENDING to PAID when PG owner confirms payment)
   */
  static async updateInvoiceStatus(
    ownerId: string,
    invoiceId: string,
    input: z.infer<typeof zodUpdateInvoiceStatusSchema>,
  ): Promise<InvoiceResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      const validated = zodUpdateInvoiceStatusSchema.parse(input);

      const existingInvoice = await BillingModel.getInvoiceById(invoiceId);
      if (!existingInvoice) {
        throw new Error("Invoice not found");
      }
      if (existingInvoice.ownerId !== ownerId) {
        throw new Error("Unauthorized");
      }

      const updatedInvoice = await BillingModel.updateInvoiceStatus(
        invoiceId,
        validated.status,
      );

      return {
        success: true,
        data: updatedInvoice,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update invoice status",
      };
    }
  }

  /**
   * Generates recurring monthly invoices for active bookings.
   * Billing period starts on the 1st of the month, ends on the last day, and payment is due on the 5th.
   * Idempotent: checks and skips any booking that already has an invoice for the target period.
   */

  static async generateMonthlyInvoices(
    ownerId?: string,
    targetDate: Date = new Date(),
  ): Promise<MonthlyBillingJobResponse> {
    try {
      /**
       * Cron runs on the 1st.
       *
       * Example:
       * September 1 -> generate August invoices.
       */
      const billingPeriod = getPreviousBillingPeriod(targetDate);

      const bookings = await BillingModel.getBookingsOverlappingBillingPeriod(
        billingPeriod.startString,
        billingPeriod.endString,
        ownerId,
      );

      const createdInvoices: Invoice[] = [];

      for (const booking of bookings) {
        const invoice = await this.generateInvoiceForBookingPeriod(
          booking,
          billingPeriod,
        );

        if (invoice) {
          createdInvoices.push(invoice);
        }
      }

      return {
        success: true,
        count: createdInvoices.length,
        data: createdInvoices,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to generate monthly invoices",
      };
    }
  }

  static async generateInvoiceForBookingPeriod(
    booking: Booking,
    billingPeriod: BillingPeriod,
  ): Promise<Invoice | null> {
    const calculation = calculateBillingAmount({
      monthlyRate: Number(booking.agreedMonthlyRent),
      bookingStartDate: new Date(booking.startDate),
      bookingEndDate: booking.endDate ? new Date(booking.endDate) : null,
      billingPeriod,
    });

    /**
     * Booking did not overlap this billing period.
     */
    if (!calculation) {
      return null;
    }

    const invoice = await BillingModel.createInvoiceIfNotExists({
      id: crypto.randomUUID(),

      bookingId: booking.id,
      ownerId: booking.ownerId,
      // propertyId: booking.propertyId,
      // bedId: booking.bedId,
      // customerId: booking.customerId,

      billingPeriodStart: calculation.billingPeriodStartString,

      billingPeriodEnd: calculation.billingPeriodEndString,

      servicePeriodStart: calculation.servicePeriodStartString,

      servicePeriodEnd: calculation.servicePeriodEndString,

      billableDays: calculation.billableDays,

      amount: calculation.amount.toString(),

      isProrated: calculation.isProrated,

      status: "PENDING",

      dueDate: getInvoiceDueDate(new Date()),
    });

    return invoice;
  }
}
