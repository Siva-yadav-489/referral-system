import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  pgEnum,
  unique,
  numeric,
  date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["USER", "ADMIN"]);

export const referralStatusEnum = pgEnum("referral_status", [
  "ACTIVE",
  "QUALIFIED",
  "DISQUALIFIED",
  "REWARDED",
]);

export const roomTypeEnum = pgEnum("room_type", ["2-Sharing", "3-Sharing"]);

export const bedStatusEnum = pgEnum("bed_status", [
  "VACANT",
  "OCCUPIED",
  "MAINTENANCE",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "ACTIVE",
  "EXTENDED",
  "COMPLETED",
  "CANCELLED",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "PENDING",
  "PAID",
  "OVERDUE",
]);

export const enquiryStatusEnum = pgEnum("enquiry_status", [
  "UNREAD",
  "CONTACTED",
  "CONVERTED",
  "NOT_INTERESTED",
]);

// Users Table (With points, uniqueReferralCode, and role)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
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
export const referrers = pgTable("referrer", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email"),
  contactNo: text("contact_no"),
  points: integer("points").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const referralLeads = pgTable("referral_lead", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "restrict" }),
  referrerId: text("referrer_id")
    .notNull()
    .references(() => referrers.id, { onDelete: "restrict" }),
  refereeName: text("referee_name").notNull(),
  refereeEmail: text("referee_email"),
  refereeContactNo: text("referee_contact_no"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const referrals = pgTable("referral", {
  id: text("id").primaryKey(),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "restrict" }),
  referralLeadId: text("referral_lead_id")
    .notNull()
    .unique()
    .references(() => referralLeads.id, {
      onDelete: "restrict",
    }),
  referrerId: text("referrer_id")
    .notNull()
    .references(() => referrers.id, { onDelete: "restrict" }),
  customerId: text("customer_id")
    .notNull()
    .unique()
    .references(() => customers.id, { onDelete: "restrict" }),
  status: referralStatusEnum("status").notNull(), // for now we are setting status as ACTIVE upon creation. If we want it explicitly to get active from the bookingStartDate, we can another state "INACTIVE" then we need set a job to update the status from INACTIVE to ACTIVE on the bookingStartDate. Need to decide on this.
  rewardPoints: integer("reward_points"),
  activatedAt: timestamp("activated_at").notNull(),
  qualifiedAt: timestamp("qualified_at"),
  disqualifiedAt: timestamp("disqualified_at"),
  rewardedAt: timestamp("rewarded_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- PG Occupancy System Tables ---

// Properties Table
export const properties = pgTable("property", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  address: text("address").notNull(),
  contactNo: text("contact_no").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Floors Table
export const floors = pgTable(
  "floor",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    floorNumber: integer("floor_number").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("unique_property_floor").on(table.propertyId, table.floorNumber),
  ],
);

// Rooms Table
export const rooms = pgTable(
  "room",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    floorId: text("floor_id")
      .notNull()
      .references(() => floors.id, { onDelete: "cascade" }),
    roomNumber: text("room_number").notNull(),
    type: roomTypeEnum("type").notNull().default("2-Sharing"),
    capacity: integer("capacity").notNull().default(2),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique("unique_floor_room").on(table.floorId, table.roomNumber)],
);

// Beds Table
export const beds = pgTable(
  "bed",
  {
    id: text("id").primaryKey(),
    propertyId: text("property_id")
      .notNull()
      .references(() => properties.id, { onDelete: "cascade" }),
    floorId: text("floor_id")
      .notNull()
      .references(() => floors.id, { onDelete: "cascade" }),
    roomId: text("room_id")
      .notNull()
      .references(() => rooms.id, { onDelete: "cascade" }),
    bedNumber: text("bed_number").notNull(),
    status: bedStatusEnum("status").notNull().default("VACANT"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [unique("unique_room_bed").on(table.roomId, table.bedNumber)],
);

// --- Operations & Billing Tables ---

export const customers = pgTable("customer", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  contactNo: text("contact_no").notNull(),
  email: text("email").notNull(),
  idProofType: text("id_proof_type"),
  idProofNumber: text("id_proof_number"),
  emergencyContact: text("emergency_contact"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const bookings = pgTable("booking", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "restrict" }),
  bedId: text("bed_id")
    .notNull()
    .references(() => beds.id, { onDelete: "restrict" }),
  customerId: text("customer_id")
    .notNull()
    .references(() => customers.id, { onDelete: "restrict" }),
  agreedMonthlyRent: numeric("agreed_monthly_rent", {
    precision: 10,
    scale: 2,
  }).notNull(),
  depositAmountCollected: numeric("deposit_amount_collected", {
    precision: 10,
    scale: 2,
  }),
  depositAmountRefunded: numeric("deposit_amount_refunded", {
    precision: 10,
    scale: 2,
  }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  status: bookingStatusEnum("status").notNull().default("ACTIVE"), // for now we are considering booking gets active upon creation. If we want it explicitly to get active from the bookingStartDate, we can another state "UPCOMING" then the PG owner need to manually update on customer checkin or we can set a job to update the status from UPCOMING to ACTIVE on the bookingStartDate. Need to decide on this.
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const invoices = pgTable(
  "invoice",
  {
    id: text("id").primaryKey(),
    bookingId: text("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "restrict" }),
    ownerId: text("owner_id")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    // Calendar billing cycle
    billingPeriodStart: date("billing_period_start").notNull(),
    billingPeriodEnd: date("billing_period_end").notNull(),
    // Actual dates the tenant is being charged for
    servicePeriodStart: date("service_period_start").notNull(),
    servicePeriodEnd: date("service_period_end").notNull(),
    billableDays: integer("billable_days").notNull(), // Number of days actually charged
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    isProrated: boolean("is_prorated").notNull().default(false), // prorated if the move in date is not on the first day of the month or move out date is not on the last day of the month
    status: invoiceStatusEnum("status").notNull().default("PENDING"),
    dueDate: date("due_date").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    unique("unique_booking_billing_period").on(
      table.bookingId,
      table.billingPeriodStart,
      table.billingPeriodEnd,
    ),
  ],
);

export const enquiries = pgTable("enquiry", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  propertyId: text("property_id")
    .notNull()
    .references(() => properties.id, { onDelete: "restrict" }),
  name: text("name").notNull(),
  contactNo: text("contact_no").notNull(),
  email: text("email").notNull(),
  roomType: roomTypeEnum("room_type").notNull().default("2-Sharing"),
  message: text("message"),
  status: enquiryStatusEnum("status").notNull().default("UNREAD"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// --- Relations ---
export const usersRelations = relations(user, ({ many }) => ({
  properties: many(properties),
  customers: many(customers),
  bookings: many(bookings),
  enquiries: many(enquiries),
}));

export const referrersRelations = relations(referrers, ({ many }) => ({
  referralLeads: many(referralLeads),
  referrals: many(referrals),
}));

export const referralLeadsRelations = relations(referralLeads, ({ one }) => ({
  referrer: one(referrers, {
    fields: [referralLeads.referrerId],
    references: [referrers.id],
  }),

  referral: one(referrals, {
    fields: [referralLeads.id],
    references: [referrals.referralLeadId],
  }),

  property: one(properties, {
    fields: [referralLeads.propertyId],
    references: [properties.id],
  }),
}));

export const referralsRelations = relations(referrals, ({ one }) => ({
  referralLead: one(referralLeads, {
    fields: [referrals.referralLeadId],
    references: [referralLeads.id],
  }),

  referrer: one(referrers, {
    fields: [referrals.referrerId],
    references: [referrers.id],
  }),

  customer: one(customers, {
    fields: [referrals.customerId],
    references: [customers.id],
  }),

  property: one(properties, {
    fields: [referrals.propertyId],
    references: [properties.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  owner: one(user, { fields: [properties.ownerId], references: [user.id] }),
  floors: many(floors),
  rooms: many(rooms),
  beds: many(beds),
  bookings: many(bookings),
  invoices: many(invoices),
  enquiries: many(enquiries),
  referrals: many(referrals),
  referralLeads: many(referralLeads),
}));

export const floorsRelations = relations(floors, ({ one, many }) => ({
  property: one(properties, {
    fields: [floors.propertyId],
    references: [properties.id],
  }),
  rooms: many(rooms),
  beds: many(beds),
}));

export const roomsRelations = relations(rooms, ({ one, many }) => ({
  property: one(properties, {
    fields: [rooms.propertyId],
    references: [properties.id],
  }),
  floor: one(floors, { fields: [rooms.floorId], references: [floors.id] }),
  beds: many(beds),
}));

export const bedsRelations = relations(beds, ({ one, many }) => ({
  property: one(properties, {
    fields: [beds.propertyId],
    references: [properties.id],
  }),
  floor: one(floors, { fields: [beds.floorId], references: [floors.id] }),
  room: one(rooms, { fields: [beds.roomId], references: [rooms.id] }),
  bookings: many(bookings),
  invoices: many(invoices),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  owner: one(user, { fields: [customers.ownerId], references: [user.id] }),
  referral: one(referrals, {
    fields: [customers.id],
    references: [referrals.customerId],
  }),
  bookings: many(bookings),
  invoices: many(invoices),
}));

export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  owner: one(user, { fields: [bookings.ownerId], references: [user.id] }),
  property: one(properties, {
    fields: [bookings.propertyId],
    references: [properties.id],
  }),
  bed: one(beds, { fields: [bookings.bedId], references: [beds.id] }),
  customer: one(customers, {
    fields: [bookings.customerId],
    references: [customers.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  booking: one(bookings, {
    fields: [invoices.bookingId],
    references: [bookings.id],
  }),
  owner: one(user, { fields: [invoices.ownerId], references: [user.id] }),
}));

export const enquiriesRelations = relations(enquiries, ({ one }) => ({
  owner: one(user, { fields: [enquiries.ownerId], references: [user.id] }),
  property: one(properties, {
    fields: [enquiries.propertyId],
    references: [properties.id],
  }),
}));

// Types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Referral = typeof referrals.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Invoice = typeof invoices.$inferSelect;
export type Enquiry = typeof enquiries.$inferSelect;
export type NewEnquiry = typeof enquiries.$inferInsert;
