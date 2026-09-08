ALTER TABLE "booking" RENAME COLUMN "agreed_monthly_cost" TO "agreed_monthly_rent";--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "status" SET DEFAULT 'PENDING'::text;--> statement-breakpoint
DROP TYPE "public"."invoice_status";--> statement-breakpoint
CREATE TYPE "public"."invoice_status" AS ENUM('PENDING', 'PAID', 'OVERDUE');--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "status" SET DEFAULT 'PENDING'::"public"."invoice_status";--> statement-breakpoint
ALTER TABLE "invoice" ALTER COLUMN "status" SET DATA TYPE "public"."invoice_status" USING "status"::"public"."invoice_status";--> statement-breakpoint
ALTER TABLE "room" ALTER COLUMN "capacity" SET DEFAULT 2;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "deposit_amount_collected" numeric(10, 2) NOT NULL;--> statement-breakpoint
ALTER TABLE "booking" ADD COLUMN "deposit_amount_refunded" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "property_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD COLUMN "id_proof_type" text;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "property_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "bed_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "customer_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "customer" ADD CONSTRAINT "customer_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_property_id_property_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."property"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_bed_id_bed_id_fk" FOREIGN KEY ("bed_id") REFERENCES "public"."bed"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_customer_id_customer_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customer"("id") ON DELETE restrict ON UPDATE no action;