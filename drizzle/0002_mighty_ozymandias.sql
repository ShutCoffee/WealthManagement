CREATE TABLE "dividends" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"ex_date" timestamp NOT NULL,
	"payment_date" timestamp,
	"amount" numeric(15, 4) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"type" varchar(10) DEFAULT 'cash' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "dividends" ADD CONSTRAINT "dividends_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;