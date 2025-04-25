CREATE TABLE "finance-ai_savings_goal" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" varchar(256) NOT NULL,
	"target_amount" numeric(12, 2) NOT NULL,
	"target_date" timestamp,
	"current_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"icon" varchar(50) DEFAULT '🎯',
	"color" varchar(7) DEFAULT '#A855F7',
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "finance-ai_bank_account" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "finance-ai_bank_account" ADD COLUMN "color" varchar(7);--> statement-breakpoint
ALTER TABLE "finance-ai_savings_goal" ADD CONSTRAINT "finance-ai_savings_goal_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "savings_goal_userId_idx" ON "finance-ai_savings_goal" USING btree ("userId");