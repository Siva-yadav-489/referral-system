import { db } from "@/db";
import { bookings, referralLeads, referrals, referrers } from "@/db/schema";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { format, subMonths } from "date-fns";
import { Booking } from "../booking/booking.types";
import {
  NewReferral,
  NewReferralLead,
  NewReferrer,
  Referral,
  ReferralLead,
  ReferralLeadWithDetails,
  ReferralWithDetails,
  Referrer,
} from "./referral.types";

export class ReferralModel {
  static async findReferrerByEmail(
    email: string,
  ): Promise<Referrer | undefined> {
    const [referrer] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.email, email))
      .limit(1);
    return referrer;
  }

  static async findReferrerByContactNo(
    contactNo: string,
  ): Promise<Referrer | undefined> {
    const [referrer] = await db
      .select()
      .from(referrers)
      .where(eq(referrers.contactNo, contactNo))
      .limit(1);
    return referrer;
  }

  static async createReferrer(data: NewReferrer): Promise<Referrer> {
    const [referrer] = await db.insert(referrers).values(data).returning();
    return referrer;
  }

  static async createReferralLead(
    data: NewReferralLead,
  ): Promise<ReferralLead> {
    const [lead] = await db.insert(referralLeads).values(data).returning();
    return lead;
  }

  static async getReferralByCustomerId(
    customerId: string,
  ): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.customerId, customerId))
      .limit(1);
    return referral;
  }

  static async getReferralByLeadId(
    leadId: string,
  ): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.referralLeadId, leadId))
      .limit(1);
    return referral;
  }

  static async findMatchingLead(
    propertyId: string,
    refereeEmail: string | null,
    refereeContactNo: string | null,
  ): Promise<ReferralLead | undefined> {
    if (refereeEmail) {
      const [leadByEmail] = await db
        .select()
        .from(referralLeads)
        .where(
          and(
            eq(referralLeads.propertyId, propertyId),
            eq(referralLeads.refereeEmail, refereeEmail),
          ),
        )
        .orderBy(asc(referralLeads.createdAt))
        .limit(1);

      if (leadByEmail) {
        return leadByEmail;
      }
    }

    if (refereeContactNo) {
      const [leadByContact] = await db
        .select()
        .from(referralLeads)
        .where(
          and(
            eq(referralLeads.propertyId, propertyId),
            eq(referralLeads.refereeContactNo, refereeContactNo),
          ),
        )
        .orderBy(asc(referralLeads.createdAt))
        .limit(1);

      return leadByContact;
    }

    return undefined;
  }

  static async createReferral(data: NewReferral): Promise<Referral> {
    const [referral] = await db.insert(referrals).values(data).returning();
    return referral;
  }

  static async getReferralById(
    referralId: string,
  ): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.id, referralId))
      .limit(1);
    return referral;
  }

  static async updateReferral(
    referralId: string,
    data: Partial<Referral>,
  ): Promise<Referral> {
    const [updated] = await db
      .update(referrals)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(referrals.id, referralId))
      .returning();
    return updated;
  }

  static async addReferrerPoints(
    referrerId: string,
    points: number,
  ): Promise<void> {
    await db
      .update(referrers)
      .set({
        points: sql`${referrers.points} + ${points}`,
        updatedAt: new Date(),
      })
      .where(eq(referrers.id, referrerId));
  }

  static async getActiveReferralByCustomerId(
    customerId: string,
  ): Promise<Referral | undefined> {
    const [referral] = await db
      .select()
      .from(referrals)
      .where(
        and(
          eq(referrals.customerId, customerId),
          eq(referrals.status, "ACTIVE"),
        ),
      )
      .limit(1);
    return referral;
  }

  static async getStayBookingForReferral(
    customerId: string,
    propertyId: string,
  ): Promise<Booking | undefined> {
    const stayBookings = await db
      .select()
      .from(bookings)
      .where(
        and(
          eq(bookings.customerId, customerId),
          eq(bookings.propertyId, propertyId),
        ),
      )
      .orderBy(asc(bookings.startDate));

    return (
      stayBookings.find(
        (booking) =>
          booking.status === "ACTIVE" || booking.status === "EXTENDED",
      ) ?? stayBookings[0]
    );
  }

  static async getActiveReferralsDueForProcessing(): Promise<
    Array<{ referral: Referral; booking: Booking }>
  > {
    const stayCutoffDate = format(subMonths(new Date(), 3), "yyyy-MM-dd");

    const rows = await db
      .select({
        referral: referrals,
        booking: bookings,
      })
      .from(referrals)
      .innerJoin(
        bookings,
        and(
          eq(bookings.customerId, referrals.customerId),
          eq(bookings.propertyId, referrals.propertyId),
        ),
      )
      .where(
        and(
          eq(referrals.status, "ACTIVE"),
          lte(bookings.startDate, stayCutoffDate),
        ),
      )
      .orderBy(asc(bookings.startDate));

    const dueByReferralId = new Map<
      string,
      { referral: Referral; booking: Booking }
    >();

    for (const row of rows) {
      const existing = dueByReferralId.get(row.referral.id);
      if (!existing) {
        dueByReferralId.set(row.referral.id, row);
        continue;
      }

      const existingIsOngoing =
        existing.booking.status === "ACTIVE" ||
        existing.booking.status === "EXTENDED";
      const nextIsOngoing =
        row.booking.status === "ACTIVE" || row.booking.status === "EXTENDED";

      if (!existingIsOngoing && nextIsOngoing) {
        dueByReferralId.set(row.referral.id, row);
      }
    }

    return Array.from(dueByReferralId.values());
  }

  static async getReferralLeadsByOwnerId(
    ownerId: string,
    filter?: {
      month?: number;
      year?: number;
      status?: "PENDING" | "ACTIVE" | "QUALIFIED" | "REWARDED" | "DISQUALIFIED";
      propertyId?: string;
    },
  ): Promise<ReferralLeadWithDetails[]> {
    const results = await db.query.referralLeads.findMany({
      with: {
        referrer: true,
        property: true,
        referral: true,
      },
      orderBy: (leads, { desc }) => [desc(leads.createdAt)],
    });

    let filtered = results.filter((lead) => lead.property?.ownerId === ownerId);

    if (filter?.propertyId && filter.propertyId !== "ALL") {
      filtered = filtered.filter(
        (lead) => lead.propertyId === filter.propertyId,
      );
    }

    if (filter?.status) {
      filtered = filtered.filter((lead) => {
        if (filter.status === "PENDING") {
          return !lead.referral;
        }
        return lead.referral?.status === filter.status;
      });
    }

    if (filter?.year && filter?.month) {
      const startDate = new Date(filter.year, filter.month - 1, 1, 0, 0, 0);
      const lastDay = new Date(filter.year, filter.month, 0).getDate();
      const endDate = new Date(
        filter.year,
        filter.month - 1,
        lastDay,
        23,
        59,
        59,
        999,
      );
      filtered = filtered.filter(
        (lead) => lead.createdAt >= startDate && lead.createdAt <= endDate,
      );
    } else if (filter?.year) {
      const startDate = new Date(filter.year, 0, 1, 0, 0, 0);
      const endDate = new Date(filter.year, 11, 31, 23, 59, 59, 999);
      filtered = filtered.filter(
        (lead) => lead.createdAt >= startDate && lead.createdAt <= endDate,
      );
    }

    return filtered as ReferralLeadWithDetails[];
  }

  static async getReferralsByOwnerId(
    ownerId: string,
    filter?: {
      month?: number;
      year?: number;
      status?: "ACTIVE" | "QUALIFIED" | "REWARDED" | "DISQUALIFIED";
      propertyId?: string;
    },
  ): Promise<ReferralWithDetails[]> {
    const results = await db.query.referrals.findMany({
      with: {
        referrer: true,
        property: true,
        customer: true,
        referralLead: true,
      },
      orderBy: (items, { desc }) => [desc(items.createdAt)],
    });

    let filtered = results.filter((item) => item.property?.ownerId === ownerId);

    if (filter?.propertyId && filter.propertyId !== "ALL") {
      filtered = filtered.filter(
        (item) => item.propertyId === filter.propertyId,
      );
    }

    if (filter?.status) {
      filtered = filtered.filter((item) => item.status === filter.status);
    }

    if (filter?.year && filter?.month) {
      const startDate = new Date(filter.year, filter.month - 1, 1, 0, 0, 0);
      const lastDay = new Date(filter.year, filter.month, 0).getDate();
      const endDate = new Date(
        filter.year,
        filter.month - 1,
        lastDay,
        23,
        59,
        59,
        999,
      );
      filtered = filtered.filter(
        (item) => item.createdAt >= startDate && item.createdAt <= endDate,
      );
    } else if (filter?.year) {
      const startDate = new Date(filter.year, 0, 1, 0, 0, 0);
      const endDate = new Date(filter.year, 11, 31, 23, 59, 59, 999);
      filtered = filtered.filter(
        (item) => item.createdAt >= startDate && item.createdAt <= endDate,
      );
    }

    return filtered as ReferralWithDetails[];
  }
}
