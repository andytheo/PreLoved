# PreLoved Production Hardening

This branch prepares PreLoved for a real public deployment with stronger authentication, privacy, persistent infrastructure, a complete gifting workflow, abuse controls, global location support, and responsive marketplace browsing.

## Production URL

The intended public deployment is:

`https://preloved-eight.vercel.app`

Vercel Deployment Protection is a project setting, not application code. The production domain should remain public to anonymous visitors. Preview deployments may stay protected. In Vercel, use Standard Protection rather than protecting all deployments.

## Required services

Configure the variables documented in `.env.example` for:

- PostgreSQL (`DATABASE_URL`)
- NextAuth/application secrets
- Resend email verification and contact-form delivery
- Twilio SMS verification / optional SMS 2FA
- Cloudinary image storage

The Vercel production environment must contain the same required variables. Set `NEXTAUTH_URL=https://preloved-eight.vercel.app` in production.

## Database deployment

PreLoved now uses PostgreSQL. `npm run vercel-build` runs Prisma generation, `prisma migrate deploy`, and the Next.js production build, so production deployments apply committed migrations before starting the new application version.

You can also deploy migrations manually with:

```bash
npm run db:deploy
```

Do not point production at the old SQLite file.

## Authentication and global phone support

New accounts must verify both email and phone before NextAuth can issue a session. Verification codes are HMAC-hashed in the database, expire after 10 minutes, and are resend-throttled. Users can optionally enable email- or SMS-based 2FA from `/settings/security`.

Phone numbers use E.164 international format, so numbers such as Nigerian `+234...`, Canadian `+1...`, UK `+44...`, and other valid international numbers are accepted by the application. Actual SMS delivery still depends on the configured Twilio account, sender capabilities, destination-country support, and Messaging Geo Permissions. Enable only the countries PreLoved intends to serve.

Password recovery uses an email OTP and does not reveal whether a submitted email exists.

## Contact form

`/contact` sends messages through Resend and is protected by persistent rate limiting. Configure:

- `RESEND_API_KEY`
- `CONTACT_EMAIL_FROM` (or reuse `VERIFICATION_EMAIL_FROM`)
- `CONTACT_EMAIL_TO`

The submitted user email is set as the reply-to address so site operators can respond normally.

## Location-aware marketplace browsing

Listings can store an approximate map position in addition to a private pickup address. The post/edit forms let users place a pin manually or use browser geolocation.

Search supports:

- city/region text search anywhere in the world
- browser location search
- configurable 5/10/25/50/100 km radius
- a responsive OpenStreetMap/Leaflet marketplace map
- map/list views that work on mobile, tablet, and desktop

For privacy, public coordinates are rounded before being sent to the browser. The map is therefore approximate and should never be treated as the exact pickup point.

## Listing privacy and handoff

Public listing responses never include the exact pickup address. The exact pickup address is available only to the listing owner and the accepted/completed recipient.

The primary item workflow is:

1. requester submits request
2. giver accepts or declines
3. accepted request reserves the item and declines competing pending requests
4. accepted recipient sees the private pickup address
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
- approximate rather than precise public map locations

## Uploads

Uploads no longer write into `public/uploads`. Validated JPEG/PNG/WebP/GIF files are uploaded to Cloudinary and served from persistent storage.

## Automated checks

`.github/workflows/ci.yml` provisions PostgreSQL and runs:

```bash
npm ci
npx prisma validate
npx prisma generate
npx prisma migrate deploy
npm run lint
npm run build
```

The PR should not be merged until the current head commit has a successful CI run.

The existing `prisma/seed.ts` is development-only. Demo accounts created by the old seed do not automatically receive real email/phone verification; production does not depend on seed data.
