ALTER TABLE "finance-ai_transaction" ADD COLUMN "transfer_id" text;--> statement-breakpoint
CREATE INDEX "transaction_transferId_idx" ON "finance-ai_transaction" USING btree ("transfer_id");