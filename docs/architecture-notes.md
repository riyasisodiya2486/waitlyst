# Waitlyst Architecture Notes

This diagram is based on the current code paths in the repository.

## Main flow

1. Founders and participants both access the Next.js app through browser clients.
2. Server-rendered App Router pages load initial data directly from the relational database using `getSession()` and `getDbClient()`.
3. Mutations run through API routes for campaign creation, waitlist signup, fraud analysis, reward tier suggestions, and billing.
4. Aurora DSQL is the primary relational store for founders, campaigns, participants, and reward tiers.
5. DynamoDB stores referral and fraud-related events used by the fraud analysis flow.
6. Groq powers two AI features: fraud analysis and reward tier suggestions.
7. Stripe handles paid checkout, and the Stripe webhook updates founder plan status in the relational database.

## Important implementation details

- `lib/db.ts` uses Vercel OIDC plus AWS STS and `@aws-sdk/dsql-signer` to authenticate against Aurora DSQL.
- If Aurora DSQL fails locally, the app falls back to local PostgreSQL with a terminal warning.
- If DynamoDB is unavailable, event logging falls back to `waitlyst-events.json`.
- The public waitlist signup route writes participant records to SQL first, then logs an event for fraud analysis.
- Fraud analysis can use recent DynamoDB events or fall back to participant snapshots if event data is unavailable.

## Files represented in the diagram

- `app/layout.tsx`
- `app/dashboard/page.tsx`
- `app/dashboard/campaigns/[slug]/page.tsx`
- `app/dashboard/fraud/page.tsx`
- `app/dashboard/billing/page.tsx`
- `app/w/[slug]/page.tsx`
- `app/api/auth/*`
- `app/api/campaigns/*`
- `app/api/waitlist/signup/route.ts`
- `app/api/fraud/analyze/route.ts`
- `app/api/billing/checkout/route.ts`
- `app/api/webhooks/stripe/route.ts`
- `lib/session.ts`
- `lib/db.ts`
- `lib/dynamo.ts`
- `lib/ai.ts`
