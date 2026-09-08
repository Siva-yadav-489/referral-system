import { invoices, bookings, customers, beds, properties } from "@/db/schema";
import { z } from "zod";

export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;

export type InvoiceWithDetails = Invoice & {
  booking: typeof bookings.$inferSelect & {
    customer: typeof customers.$inferSelect;
    bed?: typeof beds.$inferSelect;
    property?: typeof properties.$inferSelect;
  };
};

export const zodCreateInvoiceSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  billingPeriodStart: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid start date format"),
  billingPeriodEnd: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid end date format"),
  amount: z.number().positive("Invoice amount must be positive"),
  isProrated: z.boolean().default(false),
  dueDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid due date format"),
});

export const zodUpdateInvoiceStatusSchema = z.object({
  status: z.enum(["PENDING", "PAID", "OVERDUE"]),
});

export const zodGetInvoicesFilterSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).optional(),
  status: z.enum(["PENDING", "PAID", "OVERDUE"]).optional(),
  propertyId: z.string().optional(),
  customerId: z.string().optional(),
  bedId: z.string().optional(),
});

export type InvoiceResponse = {
  success: boolean;
  data?: Invoice;
  error?: string;
};

export type InvoicesResponse = {
  success: boolean;
  data?: Invoice[];
  error?: string;
};

export type InvoiceWithDetailsResponse = {
  success: boolean;
  data?: InvoiceWithDetails;
  error?: string;
};

export type InvoicesWithDetailsResponse = {
  success: boolean;
  data?: InvoiceWithDetails[];
  error?: string;
};

export type MonthlyBillingJobResponse = {
  success: boolean;
  count?: number;
  data?: Invoice[];
  error?: string;
};
