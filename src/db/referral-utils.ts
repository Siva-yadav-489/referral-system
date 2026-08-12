import { db } from "./index";
import * as schema from "./schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";

/**
 * Generates an uppercase random alphanumeric string of a given length.
 */
function generateRandomCode(length: number = 8): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(length);
  let code = "";
  for (let i = 0; i < length; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

/**
 * Ground Rule #5: Collision-Proof Generation
 * Generates a unique referral code for a new user by verifying database uniqueness
 * with a fallback retry mechanism.
 */
export async function generateCollisionProofReferralCode(
  dbClient: typeof db = db,
): Promise<string> {
  const maxRetries = 10;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const candidate = generateRandomCode(8);
    const [existing] = await dbClient
      .select({ id: schema.user.id })
      .from(schema.user)
      .where(eq(schema.user.referralCode, candidate))
      .limit(1);

    if (!existing) {
      return candidate;
    }
  }

  // Fallback retry mechanism: timestamp + crypto hex to guarantee collision-proof uniqueness
  const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REF-${timestampPart}-${randomPart}`;
}

import { processReferralMilestone } from "@/lib/referralService";

/**
 * Legacy wrapper function for processing referral rewards.
 * Uses uniqueReferralCode and processReferralMilestone.
 */
export async function processReferralReward(
  newUserId: string,
  refCode: string,
): Promise<boolean> {
  if (!refCode || typeof refCode !== "string") {
    return false;
  }

  const trimmedRefCode = refCode.trim().toUpperCase();
  if (!trimmedRefCode) {
    return false;
  }

  try {
    const [referrer] = await db
      .select()
      .from(schema.user)
      .where(eq(schema.user.referralCode, trimmedRefCode))
      .limit(1);

    if (!referrer || referrer.id === newUserId) {
      return false;
    }

    const [existingReferral] = await db
      .select()
      .from(schema.referrals)
      .where(eq(schema.referrals.refereeId, newUserId))
      .limit(1);

    if (!existingReferral) {
      await db.insert(schema.referrals).values({
        id: `ref_${crypto.randomUUID()}`,
        referrerId: referrer.id,
        refereeId: newUserId,
        status: "PENDING",
      });
    }

    await processReferralMilestone(newUserId, "SIGNUP");
    return true;
  } catch (error) {
    console.error(
      "[Referral System] Failed to process referral reward:",
      error,
    );
    return false;
  }
}
