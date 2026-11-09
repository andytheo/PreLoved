This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# PreLoved

## Email verification

Registration is open. Users must verify their email before posting, changing listings, saving items, uploading images, or contacting a seller.

Configure `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `RESEND_API_KEY`, `VERIFICATION_EMAIL_FROM`, and `CONTACT_EMAIL_FROM` for the deployment. Do not run the demo seed against a database containing real data: it deletes listings and favorites. Admin accounts must be provisioned securely and have a verified email.

If verification email delivery fails after registration, the account still exists. Sign in and use the resend option on `/verify`. Existing accounts retain their current verification status; review historical accounts before allowing them into the beta.

## Messaging

Buyers contact sellers through in-app conversations instead of exposing seller email addresses. Starting a conversation from a listing (`POST /api/conversations`) and sending messages (`POST /api/conversations/[id]/messages`) require a verified email. Only the buyer and seller can read or post in a conversation. Messages are 1 to 2000 characters. Conversations are limited to one per listing per buyer, and they can't be started on unavailable or your own listings.

Users can send at most 30 messages per minute. Registration is limited to 10 attempts per IP address per hour. These limits are kept in memory per server instance, so use a shared store (for example Redis) before running multiple instances.
