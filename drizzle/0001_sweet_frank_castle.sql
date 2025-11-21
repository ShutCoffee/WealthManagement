CREATE TABLE "tickers" (
	"id" serial PRIMARY KEY NOT NULL,
	"symbol" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50),
	"last_updated" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tickers_symbol_unique" UNIQUE("symbol")
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"asset_id" integer NOT NULL,
	"type" varchar(10) NOT NULL,
	"date" timestamp NOT NULL,
	"quantity" numeric(15, 4) NOT NULL,
	"price_per_share" numeric(15, 4) NOT NULL,
	"total_value" numeric(15, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "symbol" varchar(20);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "quantity" numeric(15, 4);--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN "last_price_update" timestamp;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;