"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user, referrals, referralHistories } from "@/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { headers, cookies } from "next/headers";
import { unstable_cache } from "next/cache";

export interface RefereeInfo {
  id: string;
  name: string;
  email: string;
  status: "PENDING" | "PARTIALLY_REWARDED" | "COMPLETED";
  createdAt: Date;
  milestonesCompleted: string[];
}

export interface PointHistoryItem {
  id: string;
  reason: string;
  milestone: "SIGNUP" | "PURCHASE";
  points: number;
  rewardedAt: Date;
  refereeName: string;
  refereeEmail: string;
}

export interface ReferralDashboardData {
  points: number;
  referralCode: string;
  referees: RefereeInfo[];
  history: PointHistoryItem[];
  referredBy?: {
    name: string;
    email: string;
  } | null;
}

/**
 * Internal function to fetch referral data from DB. Wrapped with unstable_cache below.
 */
async function fetchUserDashboardDataRaw(
  userId: string,
): Promise<ReferralDashboardData> {
  // 1. Fetch user's current points and unique referral code
  const [currentUser] = await db
    .select({
      points: user.points,
      referralCode: user.referralCode,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!currentUser) {
    throw new Error("User record not found.");
  }

  // 2. Fetch referrals where referrerId is current user
  const userReferrals = await db
    .select({
      referralId: referrals.id,
      refereeId: referrals.refereeId,
      status: referrals.status,
      refereeName: user.name,
      refereeEmail: user.email,
      refereeCreatedAt: user.createdAt,
    })
    .from(referrals)
    .innerJoin(user, eq(referrals.refereeId, user.id))
    .where(eq(referrals.referrerId, userId))
    .orderBy(desc(referrals.createdAt));

  // 3. Fetch milestone histories for these referrals
  const referralIds = userReferrals.map((r) => r.referralId);
  const histories =
    referralIds.length > 0
      ? await db
          .select()
          .from(referralHistories)
          .where(inArray(referralHistories.referralId, referralIds))
          .orderBy(desc(referralHistories.rewardedAt))
      : [];

  // Group milestones by referralId
  const milestonesByReferralId: Record<string, string[]> = {};
  histories.forEach((h) => {
    if (!milestonesByReferralId[h.referralId]) {
      milestonesByReferralId[h.referralId] = [];
    }
    milestonesByReferralId[h.referralId].push(h.milestone);
  });

  const referees: RefereeInfo[] = userReferrals.map((r) => ({
    id: r.refereeId,
    name: r.refereeName,
    email: r.refereeEmail,
    status: r.status,
    createdAt: r.refereeCreatedAt,
    milestonesCompleted: milestonesByReferralId[r.referralId] || [],
  }));

  const refereeLookup: Record<string, { name: string; email: string }> = {};
  userReferrals.forEach((r) => {
    refereeLookup[r.referralId] = {
      name: r.refereeName,
      email: r.refereeEmail,
    };
  });

  const history: PointHistoryItem[] = histories.map((h) => {
    const refInfo = refereeLookup[h.referralId];
    const refereeName = refInfo?.name || "Friend";
    const reason =
      h.milestone === "SIGNUP"
        ? `Referral Signup (${refereeName})`
        : `First Purchase (${refereeName})`;

    return {
      id: h.id,
      reason,
      milestone: h.milestone as "SIGNUP" | "PURCHASE",
      points: h.pointsAwarded,
      rewardedAt: h.rewardedAt,
      refereeName,
      refereeEmail: refInfo?.email || "",
    };
  });

  // 4. Check if current user was referred by someone
  const [incomingReferral] = await db
    .select({
      referralId: referrals.id,
      referrerId: referrals.referrerId,
      referrerName: user.name,
      referrerEmail: user.email,
      status: referrals.status,
      createdAt: referrals.createdAt,
    })
    .from(referrals)
    .innerJoin(user, eq(referrals.referrerId, user.id))
    .where(eq(referrals.refereeId, userId))
    .limit(1);

  let incomingHistory: PointHistoryItem[] = [];

  if (incomingReferral) {
    const incomingHistories = await db
      .select()
      .from(referralHistories)
      .where(eq(referralHistories.referralId, incomingReferral.referralId))
      .orderBy(desc(referralHistories.rewardedAt));

    if (incomingHistories.length > 0) {
      incomingHistory = incomingHistories.map((h) => {
        const referrerName = incomingReferral.referrerName || "a friend";
        const reason =
          h.milestone === "SIGNUP"
            ? `Welcome Bonus (Referred by ${referrerName})`
            : `Purchase Reward (Referred by ${referrerName})`;

        return {
          id: `inc_${h.id}`,
          reason,
          milestone: h.milestone as "SIGNUP" | "PURCHASE",
          points: h.pointsAwarded,
          rewardedAt: h.rewardedAt,
          refereeName: referrerName,
          refereeEmail: incomingReferral.referrerEmail,
        };
      });
    } else {
      incomingHistory = [
        {
          id: `inc_signup_${incomingReferral.referralId}`,
          reason: `Welcome Bonus (Referred by ${incomingReferral.referrerName || "a friend"})`,
          milestone: "SIGNUP" as const,
          points: 10,
          rewardedAt: incomingReferral.createdAt,
          refereeName: incomingReferral.referrerName || "a friend",
          refereeEmail: incomingReferral.referrerEmail,
        },
      ];
    }
  }

  const combinedHistory = [...history, ...incomingHistory].sort(
    (a, b) =>
      new Date(b.rewardedAt).getTime() - new Date(a.rewardedAt).getTime(),
  );

  return {
    points: currentUser.points,
    referralCode: currentUser.referralCode,
    referees,
    history: combinedHistory,
    referredBy: incomingReferral
      ? {
          name: incomingReferral.referrerName,
          email: incomingReferral.referrerEmail,
        }
      : null,
  };
}

/**
 * Secure cached Server Action to fetch referral dashboard data using unstable_cache and revalidateTag
 */
export async function getReferralDashboardData(): Promise<ReferralDashboardData> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || !session.user) {
    throw new Error(
      "Unauthorized: Please sign in to access your referral dashboard.",
    );
  }

  const userId = session.user.id;

  const getCachedData = unstable_cache(
    async (uId: string) => fetchUserDashboardDataRaw(uId),
    [`dashboard-data-${userId}`],
    {
      tags: [`points:${userId}`, `referrals:${userId}`],
      revalidate: 60,
    },
  );

  return getCachedData(userId);
}

/**
 * Server Action to validate if a referral code exists in the database.
 */
export async function validateReferralCode(code: string): Promise<boolean> {
  if (!code || typeof code !== "string") return false;
  const trimmed = code.trim().toUpperCase();
  if (!trimmed) return false;

  try {
    const [existingUser] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.referralCode, trimmed))
      .limit(1);

    return !!existingUser;
  } catch (err) {
    console.error("Error validating referral code:", err);
    return false;
  }
}

/**
 * Server Action to store referral code in HTTP cookies
 */
export async function setReferralCookie(code: string): Promise<boolean> {
  if (!code) return false;
  const cleanCode = code.trim().toUpperCase();
  const isValid = await validateReferralCode(cleanCode);
  if (isValid) {
    const cookieStore = await cookies();
    cookieStore.set("referral_code", cleanCode, {
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      httpOnly: true,
      sameSite: "lax",
    });
    return true;
  }
  return false;
}

/**
 * Server Action to clear referral code from HTTP cookies
 */
export async function clearReferralCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("referral_code");
  cookieStore.delete("ref");
}

