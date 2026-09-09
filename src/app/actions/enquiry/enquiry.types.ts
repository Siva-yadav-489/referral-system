import { enquiries, properties } from "@/db/schema";
import { z } from "zod";

export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;

export type EnquiryWithDetails = Enquiry & {
  property?: typeof properties.$inferSelect | null;
};

export const zodCreateEnquirySchema = z.object({
  propertyId: z.string().min(1, "Property is required"),
  name: z.string().min(1, "Name is required"),
  contactNo: z.string().min(10, "Contact no. is required"),
  email: z.string().email({ message: "Email is required" }),
  roomType: z.enum(["2-Sharing", "3-Sharing"]).default("2-Sharing"),
  message: z.string().optional(),
  status: z
    .enum(["UNREAD", "CONTACTED", "CONVERTED", "NOT_INTERESTED"])
    .default("UNREAD")
    .optional(),
});

export const zodGetEnquiriesFilterSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).optional(),
  status: z
    .enum(["UNREAD", "CONTACTED", "CONVERTED", "NOT_INTERESTED"])
    .optional(),
  propertyId: z.string().optional(),
});

export const zodUpdateEnquiryStatusSchema = z.object({
  status: z.enum(["UNREAD", "CONTACTED", "CONVERTED", "NOT_INTERESTED"]),
});

export type EnquiryResponse = {
  success: boolean;
  data?: Enquiry;
  error?: string;
};

export type EnquiriesResponse = {
  success: boolean;
  data?: EnquiryWithDetails[];
  error?: string;
};
