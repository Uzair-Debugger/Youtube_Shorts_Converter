-- AlterTable: add Stripe billing fields to Subscription
ALTER TABLE "Subscription"
  ADD COLUMN "stripePriceId"     TEXT,
  ADD COLUMN "currentPeriodEnd"  TIMESTAMP(3),
  ADD COLUMN "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false;
