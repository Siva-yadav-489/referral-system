CREATE TYPE "public"."enquiry_status" AS ENUM('UNREAD', 'CONTACTED', 'CONVERTED', 'NOT_INTERESTED');--> statement-breakpoint
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
ALTER TABLE "enquiry" ADD CONSTRAINT "enquiry_owner_id_user_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "enquiry" ADD CONSTRAINT "enquiry_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;