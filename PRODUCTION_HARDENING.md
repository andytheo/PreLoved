# PreLoved Production Hardening

This branch introduces the production-hardening work for authentication, privacy, storage, database durability, gifting workflow, abuse controls, and account safety.

## Required services

Configure the variables documented in `.env.example` for:

- PostgreSQL (`DATABASE_URL`)
- NextAuth/application secrets
- Resend email delivery
- Twilio SMS delivery
- Cloudinary image storage

## Database deployment

Run:

```bash
npm run db:deploy
```

The Prisma provider and migration history in this branch are PostgreSQL-specific. Do not point the production deployment at the old SQLite file.

## Authentication flow

New accounts must verify both email and phone before NextAuth can issue a session. Verification codes are HMAC-hashed in the database, expire after 10 minutes, and are resend-throttled. Users can optionally enable email- or SMS-based 2FA from `/settings/security`.

Password recovery uses an email OTP and does not reveal whether a submitted email exists.

## Listing privacy and handoff

Public listing responses never include exact pickup address or precise coordinates. Pickup details are available only to the listing owner and the accepted/completed recipient.

The primary item workflow is:

1. requester submits request
2. giver accepts or declines
3. accepted request reserves the item and declines competing pending requests
4. accepted recipient sees pickup details
5. giver marks handoff complete
6. listing becomes `GIVEN`

New listings expire after 30 days unless refreshed by editing availability.

## User safety

The branch adds:

- reports for listings/users
- member blocking
- account deletion with password + explicit `DELETE` confirmation
- persistent hashed database-backed rate limiting
- notification storage and inbox

## Uploads

Uploads no longer write into `public/uploads`. Validated JPEG/PNG/WebP files are uploaded to Cloudinary and served using Cloudinary automatic optimization parameters.

## Verification before merge

A full local `npm ci && npm run build && npm run lint` could not be executed from the implementation environment because outbound package-registry DNS was unavailable. CI or a normal developer workstation must run those checks before this branch is merged.

The existing `prisma/seed.ts` also needs a follow-up update if demo accounts are expected to sign in under mandatory email/phone verification; the production database path does not depend on the seed script.
