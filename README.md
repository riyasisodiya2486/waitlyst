# Waitlyst

AI-assisted viral waitlist SaaS for founders, built to launch referral campaigns fast, track growth, and surface suspicious signup behavior without extra ops overhead.

## Built for H0

This project was built for the **H0: Hack the Zero Stack** hackathon using **Vercel v0 + AWS Databases**, for **Track 2: Monetizable B2B App**.

## Demo

- Live app: https://waitlyst-one.vercel.app/
- Demo video: [ADD LINK HERE]

## What Waitlyst Does

Waitlyst helps a founder create a branded pre-launch campaign, publish a public waitlist page, and let new signups climb a referral leaderboard. Every participant gets a unique referral code, ranks update as referrals come in, reward tiers can be suggested with AI, and suspicious signup patterns can be reviewed from a fraud dashboard.

In plain terms: it is a lightweight growth funnel for early-stage launches. A founder can create a campaign, share the waitlist, reward the people who bring in others, and keep an eye on whether the leaderboard activity looks legitimate.

## Why This Architecture

The app uses **Aurora DSQL** as its primary transactional database because the product needs relational queries for founders, campaigns, participants, ranks, billing state, and reward tiers. That keeps the core waitlist product in a familiar SQL shape while still fitting the AWS database story required by the hackathon.

It also uses **DynamoDB** for referral event logging and fraud-analysis inputs. That separation is intentional: PostgreSQL-style tables handle product state, while DynamoDB-style event storage handles append-heavy activity data. The fraud and reward suggestion features sit on top of that data using **Groq** with **Llama 3.3 70B Versatile**.

For local resilience, the app currently includes honest fallbacks:

- If Aurora DSQL authentication or connectivity fails, the app falls back to local PostgreSQL and logs a loud warning in the terminal.
- If DynamoDB is unavailable, event logging falls back to a local `waitlyst-events.json` file.

That means the product can still be demoed locally, but the intended production path is Aurora DSQL + DynamoDB on AWS.

## Tech Stack

### Runtime and App Framework

- Next.js `16.2.6`
- React `19`
- React DOM `19`
- TypeScript `5.7.3`

### Styling and UI

- Tailwind CSS `4.2.0`
- `@tailwindcss/postcss` `4.2.0`
- `@base-ui/react` `1.5.0`
- `class-variance-authority` `0.7.1`
- `clsx` `2.1.1`
- `tailwind-merge` `3.3.1`
- `tw-animate-css` `1.4.0`
- `framer-motion` `12.40.0`
- `lucide-react` `1.16.0`
- `shadcn` `4.8.0`

### Data, Auth, and Backend Services

- `pg` `8.21.0`
- `jose` `6.2.3`
- `bcryptjs` `3.0.3`
- `stripe` `22.2.1`
- `groq-sdk` `1.3.0`
- `@vercel/analytics` `1.6.1`

### AWS SDK Packages

- `@aws-sdk/client-dynamodb` `3.1070.0`
- `@aws-sdk/client-sts` `3.1075.0`
- `@aws-sdk/credential-providers` `3.1075.0`
- `@aws-sdk/dsql-signer` `3.1070.0`
- `@aws-sdk/lib-dynamodb` `3.1070.0`

### Utility Packages

- `nanoid` `5.1.16`
- `uuid` `14.0.0`
- `tsx` `4.22.4`

## Architecture Diagram

![Architecture Diagram](./docs/architecture.svg)

[ADD DIAGRAM IMAGE HERE]

## Core Features

- Founder authentication with signed cookie sessions
- Campaign creation and per-campaign public waitlist pages
- Referral codes and leaderboard ranking
- Reward tier management with AI-assisted suggestions
- Fraud monitor with AI-assisted review of suspicious signup activity
- Stripe-powered upgrade flow for paid plans
- Seed script for realistic demo data
- Server-rendered dashboard and leaderboard pages to avoid client-side empty-state flashes

### Honest Current State

- The main dashboard, campaign detail, public waitlist, and fraud pages now load with server-provided data instead of flashing empty content first.
- There is an SSE leaderboard stream route in the codebase, but the app should currently be described as using standard page loads and refresh-driven updates rather than polished real-time streaming.
- The Aurora DSQL path is the primary database path, but local PostgreSQL fallback still exists intentionally for development safety.

## Local Setup

### 1. Install dependencies

```bash
pnpm install
```

### 2. Create local environment variables

Create a `.env.development.local` file with the variables the app currently expects:

```env
AUTH_SECRET=your-jwt-secret-key

PGHOST=your-aurora-dsql-host.us-east-1.rds.amazonaws.com
PGUSER=admin
PGDATABASE=waitlyst

AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/ROLE_NAME
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_SESSION_TOKEN=
VERCEL_OIDC_TOKEN=

GROQ_API_KEY=gsk_your_groq_api_key

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
STRIPE_PRICE_ID=price_your_stripe_price_id

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_DEMO_MODE=false
```

Notes:

- For local Aurora DSQL access via Vercel-issued OIDC, pull fresh env values with `vercel env pull .env.development.local`.
- If you are not using OIDC locally, the code can also use direct AWS credentials.
- `AUTH_SECRET` is still used by [`lib/session.ts`](./lib/session.ts) for signing login sessions.
- `STRIPE_PRICE_ID` is still required by [`app/api/billing/checkout/route.ts`](./app/api/billing/checkout/route.ts) for the paid upgrade flow.

### 3. Set up the database

If Aurora DSQL is configured and reachable, the app will use it as the primary relational store.

If you want the local PostgreSQL fallback ready as well:

```bash
psql -U postgres -d waitlyst -f scripts/schema.sql
pnpm migrate
```

### 4. Set up DynamoDB event storage

```bash
pnpm setup:dynamo
```

If DynamoDB is unavailable, the app will fall back to a local `waitlyst-events.json` file for event logging during development.

### 5. Seed realistic demo data

```bash
pnpm seed
```

This creates:

- Founder account: `founder@waitlyst.app`
- Founder name: `Alex Founder`
- Plan: `pro`
- Campaign: `Acme Launch`
- `25` realistic participants
- Fraud-flagged participants for the fraud dashboard
- `3` reward tiers for leaderboard incentives

### 6. Start the dev server

```bash
pnpm dev
```

Open `http://localhost:3000`.

## Available Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm migrate
pnpm setup:dynamo
pnpm seed
```

## Project Structure

```text
app/
  api/                    # Auth, billing, campaigns, fraud, leaderboard, signup, webhooks
  dashboard/              # Founder dashboard pages
  login/ signup/          # Auth pages
  w/[slug]/               # Public waitlist page

components/
  navigation.tsx          # Public nav with session-aware state
  dashboard-*.tsx         # Dashboard UI shells and client wrappers
  campaign-detail-client.tsx
  fraud-monitor-client.tsx
  waitlist-page-client.tsx
  ui/                     # Shared UI primitives

lib/
  ai.ts                   # Groq-powered fraud analysis and reward suggestions
  db.ts                   # Aurora DSQL connection + local Postgres fallback
  dsql.ts                 # SQL helpers and leaderboard queries
  dynamo.ts               # DynamoDB event logging + local JSON fallback
  session.ts              # Cookie session creation and verification
  stripe.ts               # Stripe helpers

scripts/
  schema.sql              # Local PostgreSQL schema bootstrap
  migrate-add-password-hash.ts
  setup-dynamodb.ts
  seed-demo.ts
```

## License

Built by Riya Sisodiya.
