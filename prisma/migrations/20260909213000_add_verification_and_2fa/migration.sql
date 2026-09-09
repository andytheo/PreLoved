-- Add account verification and 2FA fields.
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "twoFactorMethod" TEXT DEFAULT 'email';

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

CREATE TABLE "VerificationCode" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "purpose" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" DATETIME NOT NULL,
  "consumedAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,
  CONSTRAINT "VerificationCode_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User" ("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "VerificationCode_userId_purpose_channel_createdAt_idx"
  ON "VerificationCode"("userId", "purpose", "channel", "createdAt");
