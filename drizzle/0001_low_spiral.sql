CREATE TYPE "public"."referral_milestone" AS ENUM('SIGNUP', 'PURCHASE');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('PENDING', 'PARTIALLY_REWARDED', 'COMPLETED');--> statement-breakpoint
CREATE TABLE "referral_history" (
	"id" text PRIMARY KEY NOT NULL,
	"referral_id" text NOT NULL,
	"milestone" "referral_milestone" NOT NULL,
	"points_awarded" integer NOT NULL,
	"rewarded_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_referral_milestone" UNIQUE("referral_id","milestone")
);
--> statement-breakpoint
CREATE TABLE "referral" (
	"id" text PRIMARY KEY NOT NULL,
	"referrer_id" text NOT NULL,
	"referee_id" text NOT NULL,
	"status" "referral_status" DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referral_referee_id_unique" UNIQUE("referee_id")
);
--> statement-breakpoint
ALTER TABLE "user" DROP CONSTRAINT "user_referredById_user_id_fk";
--> statement-breakpoint
ALTER TABLE "referral_history" ADD CONSTRAINT "referral_history_referral_id_referral_id_fk" FOREIGN KEY ("referral_id") REFERENCES "public"."referral"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrer_id_user_id_fk" FOREIGN KEY ("referrer_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral" ADD CONSTRAINT "referral_referee_id_user_id_fk" FOREIGN KEY ("referee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "referredById";