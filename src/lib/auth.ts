import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";
import {
  generateCollisionProofReferralCode,
  processReferralReward,
} from "@/db/referral-utils";

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
      referredById: {
        type: "string",
        required: false,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (userData, context) => {
          // Ground Rule #5: Generate unique collision-proof referral code for new user
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
          // Ground Rules #1, #2, #3, #4: Process referral reward atomically inside a transaction
          const body = (context?.body || {}) as {
            ref?: string;
            referralCode?: string;
          };
          const refCode = body.ref || body.referralCode;

          if (refCode && createdUser?.id) {
            await processReferralReward(createdUser.id, refCode);
          }
        },
      },
    },
  },
});
