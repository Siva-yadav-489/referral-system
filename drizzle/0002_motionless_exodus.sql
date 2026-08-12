CREATE TYPE "public"."occupancy_status" AS ENUM('OCCUPIED', 'RESERVED');--> statement-breakpoint
CREATE TYPE "public"."room_type" AS ENUM('1-Sharing', '2-Sharing', '3-Sharing', '4-Sharing');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('USER', 'ADMIN');--> statement-breakpoint
CREATE TABLE "floor" (
	"id" text PRIMARY KEY NOT NULL,
	"floor_number" integer NOT NULL,
	"level" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "floor_floor_number_unique" UNIQUE("floor_number")
);
--> statement-breakpoint
CREATE TABLE "occupancy" (
	"id" text PRIMARY KEY NOT NULL,
	"room_id" text NOT NULL,
	"user_id" text,
	"occupant_name" text NOT NULL,
	"status" "occupancy_status" DEFAULT 'OCCUPIED' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "room" (
	"id" text PRIMARY KEY NOT NULL,
	"floor_id" text NOT NULL,
	"room_number" text NOT NULL,
	"type" "room_type" DEFAULT '1-Sharing' NOT NULL,
	"capacity" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "room_room_number_unique" UNIQUE("room_number")
);
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" "user_role" DEFAULT 'USER' NOT NULL;--> statement-breakpoint
ALTER TABLE "occupancy" ADD CONSTRAINT "occupancy_room_id_room_id_fk" FOREIGN KEY ("room_id") REFERENCES "public"."room"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "occupancy" ADD CONSTRAINT "occupancy_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "room" ADD CONSTRAINT "room_floor_id_floor_id_fk" FOREIGN KEY ("floor_id") REFERENCES "public"."floor"("id") ON DELETE cascade ON UPDATE no action;