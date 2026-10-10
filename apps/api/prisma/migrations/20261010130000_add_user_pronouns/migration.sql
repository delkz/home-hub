-- AlterTable
ALTER TABLE "users" ADD COLUMN "pronouns" VARCHAR(3) NOT NULL DEFAULT 'he';
ALTER TABLE "users" ADD CONSTRAINT "users_pronouns_check" CHECK ("pronouns" IN ('he', 'she'));
