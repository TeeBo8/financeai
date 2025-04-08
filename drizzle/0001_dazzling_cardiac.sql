ALTER TABLE "finance-ai_budget" ADD COLUMN "period" varchar(10) DEFAULT 'monthly' NOT NULL;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ADD COLUMN "transfer_id" text;--> statement-breakpoint
CREATE INDEX "transaction_transferId_idx" ON "finance-ai_transaction" USING btree ("transfer_id");