CREATE TYPE "public"."customer_id_proof_type" AS ENUM('AADHAAR', 'PASSPORT', 'DRIVING_LICENSE', 'VOTER_ID', 'PAN_CARD');--> statement-breakpoint
ALTER TABLE "customer" ALTER COLUMN "id_proof_type" SET DATA TYPE "public"."customer_id_proof_type" USING "id_proof_type"::"public"."customer_id_proof_type";--> statement-breakpoint
ALTER TABLE "referral_lead" ALTER COLUMN "referee_contact_no" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "referrer" ALTER COLUMN "contact_no" SET NOT NULL;