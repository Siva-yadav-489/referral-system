import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { generateCollisionProofReferralCode } from "@/db/referral-utils";
import { processReferralMilestone } from "@/lib/referralService";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      points: {
        type: "number",
        defaultValue: 0,
        required: false,
      },
      referralCode: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData) => {
          // Generate unique collision-proof referral code for new user
          const referralCode = await generateCollisionProofReferralCode();
          return {
            data: {
              ...userData,
              referralCode,
              points: 0,
            },
          };
        },
        after: async (createdUser, context) => {
          if (!createdUser?.id) return;

          try {
            // Read referral code from HTTP cookies (or fallback to body parameters)
            const cookieStore = await cookies();
            const body = (context?.body || {}) as {
              ref?: string;
              referralCode?: string;
            };
            const referralCode =
              cookieStore.get("referral_code")?.value ||
              cookieStore.get("ref")?.value ||
              body.ref ||
              body.referralCode;

            if (!referralCode) return;

            const cleanCode = referralCode.trim().toUpperCase();

            // Find referrer by uniqueReferralCode
            const [referrer] = await db
              .select()
              .from(schema.user)
              .where(eq(schema.user.referralCode, cleanCode))
              .limit(1);

            // Prevent self-referral and ensure referrer exists
            if (referrer && referrer.id !== createdUser.id) {
              // Check if referral link mapping already exists
              const [existingReferral] = await db
                .select()
                .from(schema.referrals)
                .where(eq(schema.referrals.refereeId, createdUser.id))
                .limit(1);

              if (!existingReferral) {
                // Create initial referral mapping with status PENDING
                await db.insert(schema.referrals).values({
                  id: `ref_${crypto.randomUUID()}`,
                  referrerId: referrer.id,
                  refereeId: createdUser.id,
                  status: "PENDING",
                });
              }

              // Trigger Step 1: SIGNUP Milestone
              await processReferralMilestone(createdUser.id, "SIGNUP");
            }
          } catch (err) {
            console.error("Error in user creation referral hook:", err);
          }
        },
      },
    },
  },
});
