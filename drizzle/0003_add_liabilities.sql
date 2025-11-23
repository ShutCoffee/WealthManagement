CREATE TABLE "liabilities" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"balance" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"interest_rate" numeric(5, 2),
	"description" text,
	"last_payment_date" timestamp,
	"next_payment_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liability_payment_rules" (
	"id" serial PRIMARY KEY NOT NULL,
	"liability_id" integer NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"formula_type" varchar(20) DEFAULT 'custom' NOT NULL,
	"formula_expression" text NOT NULL,
	"enabled" boolean DEFAULT true NOT NULL,
	"next_execution_date" timestamp NOT NULL,
	"last_execution_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "liability_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"liability_id" integer NOT NULL,
	"date" timestamp NOT NULL,
	"amount" numeric(15, 2) NOT NULL,
	"principal_portion" numeric(15, 2),
	"interest_portion" numeric(15, 2),
	"notes" text,
	"type" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "liability_payment_rules" ADD CONSTRAINT "liability_payment_rules_liability_id_liabilities_id_fk" FOREIGN KEY ("liability_id") REFERENCES "public"."liabilities"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "liability_payments" ADD CONSTRAINT "liability_payments_liability_id_liabilities_id_fk" FOREIGN KEY ("liability_id") REFERENCES "public"."liabilities"("id") ON DELETE cascade ON UPDATE no action;

