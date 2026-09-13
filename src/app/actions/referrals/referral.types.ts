import {
  customers,
  properties,
  referralLeads,
  referrals,
  referrers,
} from "@/db/schema";
import { z } from "zod";

export type Referrer = typeof referrers.$inferSelect;
export type NewReferrer = typeof referrers.$inferInsert;
export type ReferralLead = typeof referralLeads.$inferSelect;
export type NewReferralLead = typeof referralLeads.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type NewReferral = typeof referrals.$inferInsert;

export type ReferralLeadWithDetails = ReferralLead & {
  referrer?: Referrer | null;
  property?: typeof properties.$inferSelect | null;
  referral?: Referral | null;
};

export type ReferralWithDetails = Referral & {
  referrer?: Referrer | null;
  property?: typeof properties.$inferSelect | null;
  customer?: typeof customers.$inferSelect | null;
  referralLead?: ReferralLead | null;
};

export const zodCreateReferralLeadSchema = z.object({
  referrerName: z.string().trim().min(2, "Referrer name is required."),
  referrerEmail: z.email("Invalid referrer email."),
  referrerContactNo: z
    .string()
    .trim()
    .min(10, "Invalid referrer contact number.")
    .max(10, "Invalid referrer contact number."),
  propertyId: z.string().trim().min(1, "Property is required."),
  refereeName: z.string().trim().min(2, "Referee name is required."),
  refereeEmail: z.email("Invalid referee email."),
  refereeContactNo: z
    .string()
    .trim()
    .min(10, "Invalid referee contact number.")
    .max(10, "Invalid referee contact number."),
});

export const zodGetReferralsFilterSchema = z.object({
  month: z.number().int().min(1).max(12).optional(),
  year: z.number().int().min(2020).optional(),
  status: z
    .enum(["PENDING", "ACTIVE", "QUALIFIED", "REWARDED", "DISQUALIFIED"])
    .optional(),
  propertyId: z.string().optional(),
});

export type CreateReferralLeadInput = z.infer<
  typeof zodCreateReferralLeadSchema
>;

export type ReferralLeadResult = {
  success: boolean;
  data?: ReferralLead;
  referralLeadId?: string;
  message?: string;
  error?: string;
};

export type ReferralResult = {
  success: boolean;
  referralId?: string;
  message?: string;
  error?: string;
};

export type ReferralStatusResult = {
  success: boolean;
  status?: "ACTIVE" | "QUALIFIED" | "DISQUALIFIED" | "REWARDED";
  message?: string;
  error?: string;
};

export type ReferralLeadsResponse = {
  success: boolean;
  data?: ReferralLeadWithDetails[];
  error?: string;
};

export type ReferralsResponse = {
  success: boolean;
  data?: ReferralWithDetails[];
  error?: string;
};
