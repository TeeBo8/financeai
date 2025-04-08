CREATE TABLE "finance-ai_bank_account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "finance-ai_verificationToken" (
	"identifier" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "finance-ai_verificationToken_identifier_token_pk" PRIMARY KEY("identifier","token"),
	CONSTRAINT "finance-ai_verificationToken_token_unique" UNIQUE("token")
);
--> statement-breakpoint
-- ALTER TABLE "finance-ai_post" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- ALTER TABLE "finance-ai_verification_token" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
-- DROP TABLE "finance-ai_post" CASCADE;--> statement-breakpoint
-- DROP TABLE "finance-ai_verification_token" CASCADE;--> statement-breakpoint
ALTER TABLE "finance-ai_budget" RENAME COLUMN "startDate" TO "start_date";--> statement-breakpoint
ALTER TABLE "finance-ai_budget" RENAME COLUMN "endDate" TO "end_date";--> statement-breakpoint
ALTER TABLE "finance-ai_budget" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "finance-ai_budget" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "finance-ai_category" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "finance-ai_category" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" RENAME COLUMN "createdAt" TO "created_at";--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" RENAME COLUMN "updatedAt" TO "updated_at";--> statement-breakpoint
ALTER TABLE "finance-ai_account" DROP CONSTRAINT "finance-ai_account_userId_finance-ai_user_id_fk";
--> statement-breakpoint
ALTER TABLE "finance-ai_budget" DROP CONSTRAINT "finance-ai_budget_categoryId_finance-ai_category_id_fk";
--> statement-breakpoint
ALTER TABLE "finance-ai_session" DROP CONSTRAINT "finance-ai_session_userId_finance-ai_user_id_fk";
--> statement-breakpoint
DROP INDEX "account_user_id_idx";--> statement-breakpoint
DROP INDEX "budget_user_id_idx";--> statement-breakpoint
DROP INDEX "budget_category_id_idx";--> statement-breakpoint
DROP INDEX "category_user_id_idx";--> statement-breakpoint
DROP INDEX "category_name_idx";--> statement-breakpoint
DROP INDEX "t_user_id_idx";--> statement-breakpoint
DROP INDEX "transaction_user_id_idx";--> statement-breakpoint
DROP INDEX "transaction_category_id_idx";--> statement-breakpoint
ALTER TABLE "finance-ai_account" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_budget" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_budget" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "finance-ai_budget" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "finance-ai_budget" ALTER COLUMN "categoryId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_budget" ALTER COLUMN "categoryId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "finance-ai_budget" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_category" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_category" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "finance-ai_category" ALTER COLUMN "name" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "finance-ai_category" ALTER COLUMN "color" SET DEFAULT '#ffffff';--> statement-breakpoint
ALTER TABLE "finance-ai_category" ALTER COLUMN "icon" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "finance-ai_category" ALTER COLUMN "icon" SET DEFAULT '💡';--> statement-breakpoint
ALTER TABLE "finance-ai_category" ALTER COLUMN "icon" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "finance-ai_category" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_session" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_session" ALTER COLUMN "expires" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ALTER COLUMN "description" SET DATA TYPE varchar(256);--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ALTER COLUMN "date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ALTER COLUMN "userId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ALTER COLUMN "categoryId" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_user" ALTER COLUMN "id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "finance-ai_user" ALTER COLUMN "emailVerified" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "finance-ai_user" ALTER COLUMN "emailVerified" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ADD COLUMN "bankAccountId" text NOT NULL;--> statement-breakpoint
ALTER TABLE "finance-ai_user" ADD COLUMN "created_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "finance-ai_user" ADD COLUMN "updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "finance-ai_bank_account" ADD CONSTRAINT "finance-ai_bank_account_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bank_account_userId_idx" ON "finance-ai_bank_account" USING btree ("userId");--> statement-breakpoint
ALTER TABLE "finance-ai_account" ADD CONSTRAINT "finance-ai_account_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_budget" ADD CONSTRAINT "finance-ai_budget_categoryId_finance-ai_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."finance-ai_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_session" ADD CONSTRAINT "finance-ai_session_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ADD CONSTRAINT "finance-ai_transaction_bankAccountId_finance-ai_bank_account_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."finance-ai_bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "finance-ai_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "budget_userId_idx" ON "finance-ai_budget" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "budget_categoryId_idx" ON "finance-ai_budget" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "category_userId_idx" ON "finance-ai_category" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "finance-ai_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "transaction_userId_idx" ON "finance-ai_transaction" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "transaction_categoryId_idx" ON "finance-ai_transaction" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "transaction_bankAccountId_idx" ON "finance-ai_transaction" USING btree ("bankAccountId");--> statement-breakpoint
-- ALTER TABLE "finance-ai_budget" DROP COLUMN "name";--> statement-breakpoint
-- ALTER TABLE "finance-ai_budget" DROP COLUMN "period";--> statement-breakpoint
-- ALTER TABLE "finance-ai_transaction" DROP COLUMN "isRecurring";