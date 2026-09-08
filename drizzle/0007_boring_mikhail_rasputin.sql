ALTER TABLE "invoice" ADD COLUMN "service_period_start" date NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "service_period_end" date NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD COLUMN "billable_days" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "unique_booking_billing_period" UNIQUE("booking_id","billing_period_start","billing_period_end");