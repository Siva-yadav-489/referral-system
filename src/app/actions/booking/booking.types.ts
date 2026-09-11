import { bookings, customers, beds, invoices } from "@/db/schema";
import { z } from "zod";
import { Property } from "../property/property.types";

export type Booking = typeof bookings.$inferSelect;
export type NewBooking = typeof bookings.$inferInsert;
export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;

export type BookingWithDetails = Booking & {
  customer: Customer;
  bed: typeof beds.$inferSelect & {
    room?: {
      id: string;
      roomNumber: string;
      floorId: string;
    };
  };
  property: Property;
};

export const zodCreateBookingSchema = z.object({
  propertyId: z.string().min(1, "Property ID is required"),
  bedId: z.string().min(1, "Bed allocation is required"),
  customerName: z.string().min(2, "Customer name is required"),
  contactNo: z
    .string()
    .min(10, "Valid contact number required")
    .max(10, "Invalid contact number"),
  email: z
    .string()
    .refine(
      (val) => {
        if (!val) return true;
        return z.email().safeParse(val).success;
      },
      { message: "Invalid email" },
    )
    .optional(),
  idProofType: z
    .enum(["AADHAAR", "PASSPORT", "DRIVING_LICENSE", "VOTER_ID", "PAN_CARD"])
    .optional(),
  idProofNumber: z.string().optional().or(z.literal("")),
  emergencyContact: z.string().optional().or(z.literal("")),
  agreedMonthlyRent: z
    .number()
    .positive("Monthly rent must be a positive number"),
  depositAmountCollected: z
    .number()
    .positive("Deposit amount must be a positive number"),
  startDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid start date format"),
  endDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid end date format")
    .optional(),
});

export const zodExtendBookingSchema = z.object({
  newEndDate: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), "Invalid end date format"),
});

export const zodUpdateBookingStatusSchema = z.object({
  status: z.enum(["ACTIVE", "EXTENDED", "COMPLETED", "CANCELLED"]),
  depositAmountRefunded: z
    .number()
    .positive("Deposit amount refunded must be a positive number")
    .optional(),
});

export type CustomerIdProofType =
  | "AADHAAR"
  | "PASSPORT"
  | "DRIVING_LICENSE"
  | "VOTER_ID"
  | "PAN_CARD";

export type BookingResponse = {
  success: boolean;
  data?: Booking;
  error?: string;
};

export type BookingsResponse = {
  success: boolean;
  data?: Booking[];
  error?: string;
};

export type BookingWithDetailsResponse = {
  success: boolean;
  data?: BookingWithDetails;
  error?: string;
};

export type BookingsWithDetailsResponse = {
  success: boolean;
  data?: BookingWithDetails[];
  error?: string;
};

export type BookingTransactionResult = {
  booking: Booking;
  customer: Customer;
};

export type BookingTransactionResponse = {
  success: boolean;
  data?: BookingTransactionResult;
  error?: string;
};
