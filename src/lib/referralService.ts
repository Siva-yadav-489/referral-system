import { db } from "@/db";
import { referrals, referralHistories, user } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidateTag } from "next/cache";
import crypto from "crypto";

// Points configuration
export const MILESTONE_POINTS = {
  SIGNUP: 10,
  PURCHASE: 25, // Give 25 points for making a purchase
} as const;

export type MilestoneType = keyof typeof MILESTONE_POINTS;

export async function processReferralMilestone(
  refereeId: string,
  milestone: MilestoneType,
) {
  try {
    // 1. Check if this referee was invited by someone
    const [referralRecord] = await db
      .select()
      .from(referrals)
      .where(eq(referrals.refereeId, refereeId))
      .limit(1);

    if (!referralRecord) return; // Not a referred user

    // 2. Double-check if this specific step has already been rewarded
    const [alreadyRewarded] = await db
      .select()
      .from(referralHistories)
      .where(
        and(
          eq(referralHistories.referralId, referralRecord.id),
          eq(referralHistories.milestone, milestone),
        ),
      )
      .limit(1);

    if (alreadyRewarded) return; // Prevent duplicate execution

    const pointsToGive = MILESTONE_POINTS[milestone];
    const isFinalStep = milestone === "PURCHASE";

    // 3. Atomically update database within a transaction
    await db.transaction(async (tx) => {
      // Log the completed history token
      await tx.insert(referralHistories).values({
        id: `rh_${crypto.randomUUID()}`,
        referralId: referralRecord.id,
        milestone: milestone,
        pointsAwarded: pointsToGive,
      });

      // Update Referrer points
      await tx
        .update(user)
        .set({ points: sql`${user.points} + ${pointsToGive}` })
        .where(eq(user.id, referralRecord.referrerId));

      // Update Referee points
      await tx
        .update(user)
        .set({ points: sql`${user.points} + ${pointsToGive}` })
        .where(eq(user.id, refereeId));

      // Advance systemic workflow state
      await tx
        .update(referrals)
        .set({ status: isFinalStep ? "COMPLETED" : "PARTIALLY_REWARDED" })
        .where(eq(referrals.id, referralRecord.id));
    });

    revalidateTag(`points:${referralRecord.referrerId}`, "max");
    revalidateTag(`points:${refereeId}`, "max");
    revalidateTag(`referrals:${referralRecord.referrerId}`, "max");
    revalidateTag(`referrals:${refereeId}`, "max");
  } catch (error) {
    console.error(`Failed to handle referral milestone [${milestone}]:`, error);
  }
}
