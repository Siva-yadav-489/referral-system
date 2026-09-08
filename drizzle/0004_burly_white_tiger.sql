CREATE TYPE "public"."bed_status" AS ENUM('VACANT', 'OCCUPIED', 'MAINTENANCE');--> statement-breakpoint
CREATE TYPE "public"."booking_status" AS ENUM('ACTIVE', 'EXTENDED', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('PENDING', 'PAID', 'OVERDUE', 'CANCELLED');--> statement-breakpoint
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
	"agreed_monthly_cost" numeric(10, 2) NOT NULL,
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
	"email" text,
	"id_proof_number" text,
	"emergency_contact" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoice" (
	"id" text PRIMARY KEY NOT NULL,
	"booking_id" text NOT NULL,
	"owner_id" text NOT NULL,
	"billing_period_start" date NOT NULL,
	"billing_period_end" date NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"is_prorated" boolean DEFAULT false NOT NULL,
	"status" "invoice_status" DEFAULT 'PENDING' NOT NULL,
	"due_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
ALTER TABLE "occupancy" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "occupancy" CASCADE;--> statement-breakpoint
ALTER TABLE "floor" DROP CONSTRAINT "floor_floor_number_unique";--> statement-breakpoint
ALTER TABLE "room" DROP CONSTRAINT "room_room_number_unique";--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "type" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "type" SET DEFAULT '2-Sharing'::text;--> statement-breakpoint
DROP TYPE "public"."room_type";--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('2-Sharing', '3-Sharing');--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "type" SET DEFAULT '2-Sharing'::"public"."room_type";--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "type" SET DATA TYPE "public"."room_type" USING "type"::"public"."room_type";--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'ADMIN';--> statement-breakpoint
ALTER TABLE "floor" ADD COLUMN "property_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "room" ADD COLUMN "property_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bed" ADD CONSTRAINT "bed_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed" ADD CONSTRAINT "bed_floor_id_floor_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floor"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bed" ADD CONSTRAINT "bed_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_bed_id_bed_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."bed"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking" ADD CONSTRAINT "booking_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_booking_id_booking_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."booking"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property" ADD CONSTRAINT "property_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor" ADD CONSTRAINT "floor_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "floor" ADD CONSTRAINT "unique_property_floor" UNIQUE("property_id","floor_number");--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "unique_floor_room" UNIQUE("floor_id","room_number");--> statement-breakpoint
DROP TYPE "public"."occupancy_status";