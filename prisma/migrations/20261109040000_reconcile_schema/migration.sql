-- Reconciles the database with schema.prisma. Idempotent so it works on both
-- Neon (which already has some of these columns) and a fresh database.

-- Columns the current schema needs
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationToken" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerificationTokenExpires" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'USER';
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorPhoneVerified" BOOLEAN NOT NULL DEFAULT false;

-- Carry verification timestamps over to the boolean flags before dropping them
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'emailVerifiedAt') THEN
    UPDATE "User" SET "emailVerified" = true WHERE "emailVerifiedAt" IS NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'phoneVerifiedAt') THEN
    UPDATE "User" SET "phoneVerified" = true WHERE "phoneVerifiedAt" IS NOT NULL;
  END IF;
END $$;

-- Legacy columns and indexes no longer used by the code
ALTER TABLE "User" DROP COLUMN IF EXISTS "emailVerifiedAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "phoneVerifiedAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "twoFactorMethod";
DROP INDEX IF EXISTS "User_phone_key";

ALTER TABLE "Listing" DROP COLUMN IF EXISTS "status";
ALTER TABLE "Listing" DROP COLUMN IF EXISTS "expiresAt";
DROP INDEX IF EXISTS "Listing_city_status_idx";
DROP INDEX IF EXISTS "Listing_status_isAvailable_createdAt_idx";

-- Tables with no code path in the current app
DROP TABLE IF EXISTS "Block";
DROP TABLE IF EXISTS "Notification";
DROP TABLE IF EXISTS "Report";
DROP TABLE IF EXISTS "Request";
DROP TABLE IF EXISTS "VerificationCode";
DROP TABLE IF EXISTS "RateLimitBucket";
