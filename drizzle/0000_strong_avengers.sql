CREATE TYPE "public"."bed_status" AS ENUM('VACANT', 'OCCUPIED', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('ACTIVE', 'EXTENDED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."enquiry_status" AS ENUM('UNREAD', 'CONTACTED', 'CONVERTED', 'NOT_INTERESTED');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('PENDING', 'PAID', 'OVERDUE');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('ACTIVE', 'QUALIFIED', 'DISQUALIFIED', 'REWARDED');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('2-Sharing', '3-Sharing');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"accountId" text NOT NULL,
	"providerId" text NOT NULL,
	"userId" text NOT NULL,
	"accessToken" text,
	"refreshToken" text,
	"idToken" text,
	"accessTokenExpiresAt" timestamp,
	"refreshTokenExpiresAt" timestamp,
	"scope" text,
	"password" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bed" (
	"id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"floor_id" text NOT NULL,
	"room_id" text NOT NULL,
	"bed_number" text NOT NULL,
	"status" "bed_status" DEFAULT 'VACANT' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_room_bed" UNIQUE("room_id","bed_number")
);
--> statement-breakpoint
CREATE TABLE "booking" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"property_id" text NOT NULL,
	"bed_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"agreed_monthly_rent" numeric(10, 2) NOT NULL,
	"deposit_amount_collected" numeric(10, 2),
	"deposit_amount_refunded" numeric(10, 2),
	"start_date" date NOT NULL,
	"end_date" date,
	"status" "booking_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "customer" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_no" text NOT NULL,
	"email" text NOT NULL,
	"id_proof_type" text,
	"id_proof_number" text,
	"emergency_contact" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "enquiry" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"property_id" text NOT NULL,
	"name" text NOT NULL,
	"contact_no" text NOT NULL,
	"email" text NOT NULL,
	"room_type" "room_type" DEFAULT '2-Sharing' NOT NULL,
	"message" text,
	"status" "enquiry_status" DEFAULT 'UNREAD' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "floor" (
	"id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"floor_number" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_property_floor" UNIQUE("property_id","floor_number")
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"billing_period_start" date NOT NULL,
	"billing_period_end" date NOT NULL,
	"service_period_start" date NOT NULL,
	"service_period_end" date NOT NULL,
	"billable_days" integer NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"is_prorated" boolean DEFAULT false NOT NULL,
	"status" "invoice_status" DEFAULT 'PENDING' NOT NULL,
	"due_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_booking_billing_period" UNIQUE("booking_id","billing_period_start","billing_period_end")
);
--> statement-breakpoint
CREATE TABLE "property" (
	"id" text PRIMARY KEY NOT NULL,
	"owner_id" text NOT NULL,
	"name" text NOT NULL,
	"address" text NOT NULL,
	"contact_no" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_lead" (
	"id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_name" text NOT NULL,
	"referee_email" text,
	"referee_contact_no" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral" (
	"id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"referral_lead_id" text NOT NULL,
	"referrer_id" text NOT NULL,
	"customer_id" text NOT NULL,
	"status" "referral_status" NOT NULL,
	"reward_points" integer,
	"activated_at" timestamp NOT NULL,
	"qualified_at" timestamp,
	"disqualified_at" timestamp,
	"rewarded_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_referral_lead_id_unique" UNIQUE("referral_lead_id"),
	CONSTRAINT "referral_customer_id_unique" UNIQUE("customer_id")
);
--> statement-breakpoint
CREATE TABLE "referrer" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text,
	"contact_no" text,
	"points" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" text PRIMARY KEY NOT NULL,
	"property_id" text NOT NULL,
	"floor_id" text NOT NULL,
	"room_number" text NOT NULL,
	"type" "room_type" DEFAULT '2-Sharing' NOT NULL,
	"capacity" integer DEFAULT 2 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_floor_room" UNIQUE("floor_id","room_number")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"token" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"ipAddress" text,
	"userAgent" text,
	"userId" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"emailVerified" boolean DEFAULT false NOT NULL,
	"image" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed" ADD CONSTRAINT "bed_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed" ADD CONSTRAINT "bed_floor_id_floor_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed" ADD CONSTRAINT "bed_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_bed_id_bed_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."bed"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry" ADD CONSTRAINT "enquiry_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry" ADD CONSTRAINT "enquiry_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor" ADD CONSTRAINT "floor_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property" ADD CONSTRAINT "property_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_lead" ADD CONSTRAINT "referral_lead_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_lead" ADD CONSTRAINT "referral_lead_referrer_id_referrer_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."referrer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referral_lead_id_referral_lead_id_fk" FOREIGN KEY ("referral_lead_id") REFERENCES "public"."referral_lead"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrer_id_referrer_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."referrer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_floor_id_floor_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;