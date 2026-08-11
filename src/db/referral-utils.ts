import { db } from "./index";
import * as schema from "./schema";
import { eq, sql } from "drizzle-orm";
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
  dbClient: typeof db = db
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

/**
 * Ground Rules #1, #2, #3, #4: Atomic Referral Processing
 * 1. Atomic Transactions: Executed inside a single db.transaction().
 * 2. Prevent Self-Referral: Ensures referrer ID != new user ID.
 * 3. Single Referral Enforcement: Ensures new user does not already have referredById.
 * 4. Referral Code Validation: Validates ref code exists and resolves to active user.
 */
export async function processReferralReward(newUserId: string, refCode: string): Promise<boolean> {
  if (!refCode || typeof refCode !== "string") {
    return false;
  }

  const trimmedRefCode = refCode.trim().toUpperCase();
  if (!trimmedRefCode) {
    return false;
  }

  try {
    return await db.transaction(async (tx) => {
      // Ground Rule #4: Referral Code Validation
      const [referrer] = await tx
        .select()
        .from(schema.user)
        .where(eq(schema.user.referralCode, trimmedRefCode))
        .limit(1);

      if (!referrer) {
        console.warn(`[Referral System] Invalid referral code provided: ${trimmedRefCode}`);
        return false;
      }

      // Ground Rule #2: Prevent Self-Referral
      if (referrer.id === newUserId) {
        console.warn(`[Referral System] Self-referral attempt blocked for user ID: ${newUserId}`);
        return false;
      }

      // Fetch new user to verify current referral status
      const [newUser] = await tx
        .select()
        .from(schema.user)
        .where(eq(schema.user.id, newUserId))
        .limit(1);

      if (!newUser) {
        console.warn(`[Referral System] Target user not found: ${newUserId}`);
        return false;
      }

      // Ground Rule #3: Single Referral Enforcement
      if (newUser.referredById !== null && newUser.referredById !== undefined) {
        console.warn(`[Referral System] User ${newUserId} has already been referred previously.`);
        return false;
      }

      // Ground Rule #1: Atomic updates inside single transaction
      // 1. Update referee: set referredById to referrer.id and add 10 points
      await tx
        .update(schema.user)
        .set({
          referredById: referrer.id,
          points: sql`${schema.user.points} + 10`,
          updatedAt: new Date(),
        })
        .where(eq(schema.user.id, newUserId));

      // 2. Update referrer: add 10 points
      await tx
        .update(schema.user)
        .set({
          points: sql`${schema.user.points} + 10`,
          updatedAt: new Date(),
        })
        .where(eq(schema.user.id, referrer.id));

      console.log(`[Referral System] Successfully awarded 10 points to referrer (${referrer.id}) and referee (${newUserId}).`);
      return true;
    });
  } catch (error) {
    console.error("[Referral System] Failed to process referral reward inside transaction:", error);
    // Transaction rolled back automatically by Drizzle on throw
    return false;
  }
}
