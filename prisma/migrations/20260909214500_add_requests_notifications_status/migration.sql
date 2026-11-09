ALTER TABLE "Listing" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'AVAILABLE';
ALTER TABLE "Listing" ADD COLUMN "expiresAt" TIMESTAMP(3);

CREATE TABLE "Request" (
  "id" TEXT NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "requesterId" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,

  CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Request_requesterId_listingId_key" ON "Request"("requesterId", "listingId");
CREATE INDEX "Request_listingId_status_createdAt_idx" ON "Request"("listingId", "status", "createdAt");

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "href" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "userId" TEXT NOT NULL,

  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");
CREATE INDEX "Listing_status_isAvailable_createdAt_idx" ON "Listing"("status", "isAvailable", "createdAt");
CREATE INDEX "Listing_city_status_idx" ON "Listing"("city", "status");

ALTER TABLE "Request" ADD CONSTRAINT "Request_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Request" ADD CONSTRAINT "Request_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
