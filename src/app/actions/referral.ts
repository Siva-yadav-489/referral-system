"use server";

import { auth } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";

export interface RefereeInfo {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}

export interface ReferralDashboardData {
  points: number;
  referralCode: string;
  referees: RefereeInfo[];
}

/**
 * Secure Server Action to fetch the current authenticated user's referral dashboard data.
 * Returns only the necessary data: user points, unique referralCode, and list of referees (name, email, signup date).
 */
export async function getReferralDashboardData(): Promise<ReferralDashboardData> {
  const reqHeaders = await headers();
  const session = await auth.api.getSession({
    headers: reqHeaders,
  });

  if (!session || !session.user) {
    throw new Error("Unauthorized: Please sign in to access your referral dashboard.");
  }

  const userId = session.user.id;

  // 1. Fetch user's current points and referral code
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

  // 2. Fetch referees list (selective projection: only name, email, createdAt)
  const referees = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
    })
    .from(user)
    .where(eq(user.referredById, userId))
    .orderBy(desc(user.createdAt));

  return {
    points: currentUser.points,
    referralCode: currentUser.referralCode,
    referees,
  };
}

/**
 * Server Action to validate if a referral code exists in the database.
 * Returns true if valid, false otherwise.
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

