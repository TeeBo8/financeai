CREATE TABLE "finance-ai_recurring_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"description" varchar(256) NOT NULL,
	"notes" text,
	"amount" numeric(12, 2) NOT NULL,
	"frequency" varchar(50) NOT NULL,
	"interval" integer DEFAULT 1 NOT NULL,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp,
	"next_occurrence_date" timestamp NOT NULL,
	"bankAccountId" text NOT NULL,
	"categoryId" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "finance-ai_recurring_transaction" ADD CONSTRAINT "finance-ai_recurring_transaction_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_recurring_transaction" ADD CONSTRAINT "finance-ai_recurring_transaction_bankAccountId_finance-ai_bank_account_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."finance-ai_bank_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_recurring_transaction" ADD CONSTRAINT "finance-ai_recurring_transaction_categoryId_finance-ai_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."finance-ai_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "recurring_transaction_userId_idx" ON "finance-ai_recurring_transaction" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "recurring_transaction_bankAccountId_idx" ON "finance-ai_recurring_transaction" USING btree ("bankAccountId");--> statement-breakpoint
CREATE INDEX "recurring_transaction_nextOccurrenceDate_idx" ON "finance-ai_recurring_transaction" USING btree ("next_occurrence_date");