-- Suppression des contraintes de clé étrangère
ALTER TABLE IF EXISTS "finance-ai_account" DROP CONSTRAINT IF EXISTS "finance-ai_account_userId_finance-ai_user_id_fk";
ALTER TABLE IF EXISTS "finance-ai_budget" DROP CONSTRAINT IF EXISTS "finance-ai_budget_categoryId_finance-ai_category_id_fk";
ALTER TABLE IF EXISTS "finance-ai_budget" DROP CONSTRAINT IF EXISTS "finance-ai_budget_userId_finance-ai_user_id_fk";
ALTER TABLE IF EXISTS "finance-ai_category" DROP CONSTRAINT IF EXISTS "finance-ai_category_userId_finance-ai_user_id_fk";
ALTER TABLE IF EXISTS "finance-ai_post" DROP CONSTRAINT IF EXISTS "finance-ai_post_createdById_finance-ai_user_id_fk";
ALTER TABLE IF EXISTS "finance-ai_session" DROP CONSTRAINT IF EXISTS "finance-ai_session_userId_finance-ai_user_id_fk";
ALTER TABLE IF EXISTS "finance-ai_transaction" DROP CONSTRAINT IF EXISTS "finance-ai_transaction_userId_finance-ai_user_id_fk";
ALTER TABLE IF EXISTS "finance-ai_transaction" DROP CONSTRAINT IF EXISTS "finance-ai_transaction_categoryId_finance-ai_category_id_fk";
ALTER TABLE IF EXISTS "finance-ai_transaction" DROP CONSTRAINT IF EXISTS "finance-ai_transaction_bankAccountId_finance-ai_bank_account_id_fk";
ALTER TABLE IF EXISTS "finance-ai_bank_account" DROP CONSTRAINT IF EXISTS "finance-ai_bank_account_userId_finance-ai_user_id_fk";

-- Suppression des tables
DROP TABLE IF EXISTS "finance-ai_account";
DROP TABLE IF EXISTS "finance-ai_budget";
DROP TABLE IF EXISTS "finance-ai_category";
DROP TABLE IF EXISTS "finance-ai_post";
DROP TABLE IF EXISTS "finance-ai_session";
DROP TABLE IF EXISTS "finance-ai_transaction";
DROP TABLE IF EXISTS "finance-ai_user";
DROP TABLE IF EXISTS "finance-ai_verification_token";
DROP TABLE IF EXISTS "finance-ai_verificationToken";
DROP TABLE IF EXISTS "finance-ai_bank_account"; 