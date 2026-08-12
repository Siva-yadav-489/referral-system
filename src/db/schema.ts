import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const referralStatusEnum = pgEnum("referral_status", [
  "PENDING",
  "PARTIALLY_REWARDED",
  "COMPLETED",
]);

export const milestoneEnum = pgEnum("referral_milestone", [
  "SIGNUP",
  "PURCHASE",
]);

// Users Table (With points & uniqueReferralCode stored directly here)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),

  // Extended Referral System fields
  points: integer("points").notNull().default(0),
  referralCode: text("referralCode").notNull().unique(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

// Referrals Table to track the connection state
export const referrals = pgTable("referral", {
  id: text("id").primaryKey(),
  referrerId: text("referrer_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  refereeId: text("referee_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  status: referralStatusEnum("status").default("PENDING").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// History table to verify milestones and stop double-claiming points
export const referralHistories = pgTable(
  "referral_history",
  {
    id: text("id").primaryKey(),
    referralId: text("referral_id")
      .notNull()
      .references(() => referrals.id, { onDelete: "cascade" }),
    milestone: milestoneEnum("milestone").notNull(),
    pointsAwarded: integer("points_awarded").notNull(),
    rewardedAt: timestamp("rewarded_at").defaultNow().notNull(),
  },
  (table) => [
    // 🛡️ Guarantees that a single referral link can only claim "PURCHASE" or "SIGNUP" points once
    unique("unique_referral_milestone").on(table.referralId, table.milestone),
  ],
);

// --- Relations ---
export const usersRelations = relations(user, ({ many }) => ({
  referralsMade: many(referrals, { relationName: "referrer" }),
  referralReceived: many(referrals, { relationName: "referee" }),
}));

export const referralsRelations = relations(referrals, ({ one, many }) => ({
  referrer: one(user, {
    fields: [referrals.referrerId],
    references: [user.id],
    relationName: "referrer",
  }),
  referee: one(user, {
    fields: [referrals.refereeId],
    references: [user.id],
    relationName: "referee",
  }),
  history: many(referralHistories),
}));

export const referralHistoriesRelations = relations(
  referralHistories,
  ({ one }) => ({
    referral: one(referrals, {
      fields: [referralHistories.referralId],
      references: [referrals.id],
    }),
  }),
);

export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type ReferralHistory = typeof referralHistories.$inferSelect;
