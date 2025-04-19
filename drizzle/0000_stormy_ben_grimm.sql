CREATE TABLE "finance-ai_account" (
	"userId" text NOT NULL,
	"type" varchar(255) NOT NULL,
	"provider" varchar(255) NOT NULL,
	"providerAccountId" varchar(255) NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" varchar(255),
	"scope" varchar(255),
	"id_token" text,
	"session_state" varchar(255),
	CONSTRAINT "finance-ai_account_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "finance-ai_bank_account" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" varchar(256) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "finance-ai_budget" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" varchar(256) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"period" varchar(50) DEFAULT 'MONTHLY' NOT NULL,
	"start_date" timestamp,
	"end_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "finance-ai_budgets_to_categories" (
	"budget_id" text NOT NULL,
	"category_id" text NOT NULL,
	CONSTRAINT "finance-ai_budgets_to_categories_budget_id_category_id_pk" PRIMARY KEY("budget_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "finance-ai_category" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"name" varchar(256) NOT NULL,
	"icon" varchar(50) DEFAULT '💡' NOT NULL,
	"color" varchar(7) DEFAULT '#ffffff' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "finance-ai_session" (
	"sessionToken" varchar(255) PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "finance-ai_transaction" (
	"id" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"description" varchar(256) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	"categoryId" text,
	"bankAccountId" text NOT NULL,
	"transfer_id" text
);
--> statement-breakpoint
CREATE TABLE "finance-ai_user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" varchar(255),
	"email" varchar(255) NOT NULL,
	"emailVerified" timestamp,
	"image" varchar(255),
	"subscriptionTier" varchar(50) DEFAULT 'free' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp,
	CONSTRAINT "finance-ai_user_email_unique" UNIQUE("email")
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
ALTER TABLE "finance-ai_account" ADD CONSTRAINT "finance-ai_account_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_bank_account" ADD CONSTRAINT "finance-ai_bank_account_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_budget" ADD CONSTRAINT "finance-ai_budget_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_budgets_to_categories" ADD CONSTRAINT "finance-ai_budgets_to_categories_budget_id_finance-ai_budget_id_fk" FOREIGN KEY ("budget_id") REFERENCES "public"."finance-ai_budget"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_budgets_to_categories" ADD CONSTRAINT "finance-ai_budgets_to_categories_category_id_finance-ai_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."finance-ai_category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_category" ADD CONSTRAINT "finance-ai_category_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_session" ADD CONSTRAINT "finance-ai_session_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ADD CONSTRAINT "finance-ai_transaction_userId_finance-ai_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."finance-ai_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ADD CONSTRAINT "finance-ai_transaction_categoryId_finance-ai_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."finance-ai_category"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "finance-ai_transaction" ADD CONSTRAINT "finance-ai_transaction_bankAccountId_finance-ai_bank_account_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."finance-ai_bank_account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "finance-ai_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "bank_account_userId_idx" ON "finance-ai_bank_account" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "budget_userId_idx" ON "finance-ai_budget" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "category_userId_idx" ON "finance-ai_category" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "finance-ai_session" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "transaction_userId_idx" ON "finance-ai_transaction" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "transaction_categoryId_idx" ON "finance-ai_transaction" USING btree ("categoryId");--> statement-breakpoint
CREATE INDEX "transaction_bankAccountId_idx" ON "finance-ai_transaction" USING btree ("bankAccountId");--> statement-breakpoint
CREATE INDEX "transaction_date_idx" ON "finance-ai_transaction" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transaction_transferId_idx" ON "finance-ai_transaction" USING btree ("transfer_id");