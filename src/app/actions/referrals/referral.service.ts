import { addMonths, isAfter, parseISO } from "date-fns";
import { z } from "zod";
import { BookingModel } from "../booking/booking.model";
import { PropertyModel } from "../property/property.model";
import { ReferralModel } from "./referral.model";
import {
  CreateReferralLeadInput,
  ReferralLeadResult,
  ReferralLeadsResponse,
  ReferralResult,
  ReferralStatusResult,
  ReferralsResponse,
  zodCreateReferralLeadSchema,
  zodGetReferralsFilterSchema,
} from "./referral.types";

const REFERRAL_REWARD_POINTS = 2000;
const QUALIFICATION_MONTHS = 3;

export function normalizeEmail(
  email: string | null | undefined,
): string | null {
  if (!email) return null;

  const normalized = email.trim().toLowerCase();

  return normalized || null;
}

export function normalizeContactNo(
  contactNo: string | null | undefined,
): string | null {
  if (!contactNo) return null;

  const normalized = contactNo.replace(/\s+/g, "").trim();

  return normalized || null;
}

function parseBookingDate(date: string): Date {
  return parseISO(date);
}

export function hasStayedMoreThanThreeMonths(
  startDate: string,
  endDate: string | null,
): boolean {
  const stayEnd = endDate ? parseBookingDate(endDate) : new Date();
  return isAfter(stayEnd, addMonths(parseBookingDate(startDate), QUALIFICATION_MONTHS));
}

function isOngoingBooking(status: string): boolean {
  return status === "ACTIVE" || status === "EXTENDED";
}

export class ReferralService {
  static async createReferralLead(
    input: CreateReferralLeadInput,
  ): Promise<ReferralLeadResult> {
    try {
      const validated = zodCreateReferralLeadSchema.parse(input);

      const property = await PropertyModel.getPropertyById(
        validated.propertyId,
      );

      if (!property) {
        throw new Error("Property not found");
      }

      const referrerEmail = normalizeEmail(validated.referrerEmail);
      const referrerContactNo = normalizeContactNo(validated.referrerContactNo);
      const refereeEmail = normalizeEmail(validated.refereeEmail);
      const refereeContactNo = normalizeContactNo(validated.refereeContactNo);

      if (!referrerContactNo || !refereeContactNo) {
        throw new Error("Valid contact numbers are required");
      }

      let existingReferrer = referrerEmail
        ? await ReferralModel.findReferrerByEmail(referrerEmail)
        : undefined;

      if (!existingReferrer && referrerContactNo) {
        existingReferrer =
          await ReferralModel.findReferrerByContactNo(referrerContactNo);
      }

      const referrerId =
        existingReferrer?.id ??
        (
          await ReferralModel.createReferrer({
            id: crypto.randomUUID(),
            name: validated.referrerName.trim(),
            email: referrerEmail,
            contactNo: referrerContactNo,
          })
        ).id;

      const lead = await ReferralModel.createReferralLead({
        id: crypto.randomUUID(),
        referrerId,
        propertyId: validated.propertyId,
        refereeName: validated.refereeName.trim(),
        refereeEmail,
        refereeContactNo,
      });

      return {
        success: true,
        data: lead,
        referralLeadId: lead.id,
        message: "Referral submitted successfully.",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to create referral",
      };
    }
  }

  static async matchReferralLeadToCustomer(
    customerId: string,
    propertyId: string,
  ): Promise<ReferralResult> {
    try {
      const existingReferral =
        await ReferralModel.getReferralByCustomerId(customerId);

      if (existingReferral) {
        return {
          success: true,
          referralId: existingReferral.id,
          message: "Customer already has a referral.",
        };
      }

      const customerRecord = await BookingModel.findCustomerById(customerId);

      if (!customerRecord) {
        throw new Error("Customer not found");
      }

      const property = await PropertyModel.getPropertyById(propertyId);

      if (!property) {
        throw new Error("Property not found");
      }

      if (customerRecord.ownerId !== property.ownerId) {
        throw new Error("Customer does not belong to this property owner");
      }

      const normalizedEmail = normalizeEmail(customerRecord.email);
      const normalizedContactNo = normalizeContactNo(customerRecord.contactNo);

      const lead = await ReferralModel.findMatchingLead(
        propertyId,
        normalizedEmail,
        normalizedContactNo,
      );

      if (!lead) {
        return {
          success: false,
          error: "No matching referral lead found.",
        };
      }

      const existingLeadReferral = await ReferralModel.getReferralByLeadId(
        lead.id,
      );

      if (existingLeadReferral) {
        return {
          success: true,
          referralId: existingLeadReferral.id,
          message: "Referral already matched.",
        };
      }

      const referral = await ReferralModel.createReferral({
        id: crypto.randomUUID(),
        referralLeadId: lead.id,
        referrerId: lead.referrerId,
        customerId,
        propertyId,
        status: "ACTIVE",
        rewardedPoints: 0,
        activatedAt: new Date(),
      });

      return {
        success: true,
        referralId: referral.id,
        message: "Referral matched successfully.",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to match referral",
      };
    }
  }

  static async qualifyReferral(
    referralId: string,
  ): Promise<ReferralStatusResult> {
    try {
      const referral = await ReferralModel.getReferralById(referralId);

      if (!referral) {
        throw new Error("Referral not found");
      }

      if (referral.status !== "ACTIVE") {
        throw new Error(
          `Referral cannot be qualified from ${referral.status} status.`,
        );
      }

      const booking = await ReferralModel.getStayBookingForReferral(
        referral.customerId,
        referral.propertyId,
      );

      if (!booking) {
        throw new Error("No booking found for this referral.");
      }

      const stayEndDate = isOngoingBooking(booking.status)
        ? null
        : booking.endDate;

      if (!hasStayedMoreThanThreeMonths(booking.startDate, stayEndDate)) {
        throw new Error(
          "Booking duration from start date to end date is not more than 3 months.",
        );
      }

      await ReferralModel.updateReferral(referralId, {
        status: "QUALIFIED",
        qualifiedAt: new Date(),
      });

      return {
        success: true,
        status: "QUALIFIED",
        message: "Referral qualified successfully.",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to qualify referral",
      };
    }
  }

  static async disqualifyReferral(
    referralId: string,
  ): Promise<ReferralStatusResult> {
    try {
      const referral = await ReferralModel.getReferralById(referralId);

      if (!referral) {
        throw new Error("Referral not found");
      }

      if (referral.status !== "ACTIVE") {
        throw new Error(
          `Referral cannot be disqualified from ${referral.status} status.`,
        );
      }

      await ReferralModel.updateReferral(referralId, {
        status: "DISQUALIFIED",
        disqualifiedAt: new Date(),
      });

      return {
        success: true,
        status: "DISQUALIFIED",
        message: "Referral disqualified.",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to disqualify referral",
      };
    }
  }

  static async rewardReferral(
    referralId: string,
  ): Promise<ReferralStatusResult> {
    try {
      const referral = await ReferralModel.getReferralById(referralId);

      if (!referral) {
        throw new Error("Referral not found");
      }

      if (referral.status !== "QUALIFIED") {
        throw new Error("Only qualified referrals can be rewarded.");
      }

      await ReferralModel.addReferrerPoints(
        referral.referrerId,
        REFERRAL_REWARD_POINTS,
      );

      await ReferralModel.updateReferral(referralId, {
        status: "REWARDED",
        rewardedAt: new Date(),
        rewardedPoints: REFERRAL_REWARD_POINTS,
      });

      return {
        success: true,
        status: "REWARDED",
        message: `${REFERRAL_REWARD_POINTS} points awarded successfully.`,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to reward referral",
      };
    }
  }

  static async handleBookingEnded(
    customerId: string,
    startDate: string,
    endDate: string | null,
  ): Promise<void> {
    const activeReferral =
      await ReferralModel.getActiveReferralByCustomerId(customerId);

    if (!activeReferral) {
      return;
    }

    if (hasStayedMoreThanThreeMonths(startDate, endDate)) {
      const qualifyResult = await this.qualifyReferral(activeReferral.id);
      if (qualifyResult.success) {
        await this.rewardReferral(activeReferral.id);
      }
      return;
    }

    await this.disqualifyReferral(activeReferral.id);
  }

  static async processDueReferrals(): Promise<{
    processed: number;
    rewarded: number;
    disqualified: number;
    errors: string[];
  }> {
    const dueReferrals =
      await ReferralModel.getActiveReferralsDueForProcessing();
    let rewarded = 0;
    let disqualified = 0;
    const errors: string[] = [];

    for (const { referral, booking } of dueReferrals) {
      const stayEndDate = isOngoingBooking(booking.status)
        ? null
        : booking.endDate;

      if (hasStayedMoreThanThreeMonths(booking.startDate, stayEndDate)) {
        const qualifyResult = await this.qualifyReferral(referral.id);
        if (!qualifyResult.success) {
          errors.push(`${referral.id}: ${qualifyResult.error}`);
          continue;
        }

        const rewardResult = await this.rewardReferral(referral.id);
        if (rewardResult.success) {
          rewarded += 1;
        } else {
          errors.push(`${referral.id}: ${rewardResult.error}`);
        }
        continue;
      }

      if (isOngoingBooking(booking.status)) {
        continue;
      }

      const disqualifyResult = await this.disqualifyReferral(referral.id);
      if (disqualifyResult.success) {
        disqualified += 1;
      } else {
        errors.push(`${referral.id}: ${disqualifyResult.error}`);
      }
    }

    return {
      processed: dueReferrals.length,
      rewarded,
      disqualified,
      errors,
    };
  }

  static async getOwnerReferralLeads(
    ownerId: string,
    filter?: z.infer<typeof zodGetReferralsFilterSchema>,
  ): Promise<ReferralLeadsResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      if (filter?.propertyId && filter.propertyId !== "ALL") {
        const property = await PropertyModel.getPropertyById(filter.propertyId);
        if (!property || property.ownerId !== ownerId) {
          throw new Error("Unauthorized: You do not own this property");
        }
      }

      const data = await ReferralModel.getReferralLeadsByOwnerId(
        ownerId,
        filter,
      );
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load referrals",
      };
    }
  }

  static async getOwnerReferrals(
    ownerId: string,
    filter?: z.infer<typeof zodGetReferralsFilterSchema>,
  ): Promise<ReferralsResponse> {
    try {
      if (!ownerId) {
        throw new Error("Unauthorized");
      }

      if (filter?.propertyId && filter.propertyId !== "ALL") {
        const property = await PropertyModel.getPropertyById(filter.propertyId);
        if (!property || property.ownerId !== ownerId) {
          throw new Error("Unauthorized: You do not own this property");
        }
      }

      const referralFilter =
        filter?.status && filter.status !== "PENDING"
          ? {
              month: filter.month,
              year: filter.year,
              propertyId: filter.propertyId,
              status: filter.status,
            }
          : {
              month: filter?.month,
              year: filter?.year,
              propertyId: filter?.propertyId,
            };

      const data = await ReferralModel.getReferralsByOwnerId(
        ownerId,
        referralFilter,
      );
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Failed to load referrals",
      };
    }
  }
}
