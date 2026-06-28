# Waitlyst Authentication & AI Features Implementation Guide

This guide explains the complete implementation of email/password authentication, AI-powered features, and Stripe integration in Waitlyst.

## Overview of Changes

### 1. **Authentication System**
- Implemented session-based authentication using JWT tokens stored in HTTP-only cookies
- Created signup (`/app/signup`) and login (`/app/login`) pages with client-side validation
- Password hashing with bcryptjs
- Session management with jose library
- Dashboard protected with server-side session checks

### 2. **Database Integration**
- Connected to Aurora DSQL with IAM authentication
- Created client connection utility in `/lib/db.ts`
- All queries use parameterized statements to prevent SQL injection

### 3. **AI Features (Claude)**
- **Fraud Detection**: Analyzes signup patterns, IP addresses, and referral behavior
- **Reward Tier Suggestions**: Generates personalized tier recommendations based on campaign descriptions
- Uses Llama 3.3 70B via Groq SDK

### 4. **Real-time Event Logging**
- DynamoDB integration for storing signup and referral events
- TTL-based automatic cleanup (30-day retention)
- Events used for fraud pattern analysis and analytics

### 5. **Payment Processing**
- Stripe checkout integration for subscription management
- Webhook handling for subscription events
- Automatic plan upgrades/downgrades based on payment status

## Database Schema Updates

You need to add a `password_hash` column to the `founders` table:

```sql
ALTER TABLE founders ADD COLUMN password_hash TEXT;
```

If this column already exists, no action is needed.

## Environment Variables Required

Add these to your project settings (Vars section):

```
GROQ_API_KEY=your_GROQ_API_KEY
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
STRIPE_PRICE_ID=price_xxxxx  (optional, for checkout)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

Optional for development:
```
AUTH_SECRET=generated_32_char_random_string
```

Generate AUTH_SECRET with:
```bash
openssl rand -base64 32
```

## Setup Instructions

### 1. Install Dependencies
Dependencies are already installed. To verify:
```bash
pnpm install
```

### 2. Setup DynamoDB Table (if using DynamoDB)
```bash
pnpm setup:dynamo
```

### 3. Update Database Schema
```sql
ALTER TABLE founders ADD COLUMN password_hash TEXT;
```

### 4. Set Environment Variables
Configure these in your Vercel project settings (Vars):
- `GROQ_API_KEY` - From Groq console
- `STRIPE_SECRET_KEY` - From Stripe dashboard
- `STRIPE_WEBHOOK_SECRET` - From Stripe webhooks
- `NEXT_PUBLIC_APP_URL` - Your production URL

### 5. Verify the Build
```bash
pnpm build
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new account (email, name, password)
- `POST /api/auth/login` - Sign in (email, password)
- `POST /api/auth/logout` - Sign out

### Campaigns
- `POST /api/campaigns` - Create campaign (requires session)
- `GET /api/campaigns` - List user's campaigns (requires session)
- `POST /api/campaigns/suggest-tiers` - Get AI-suggested reward tiers

### Waitlist
- `POST /api/waitlist/signup` - Public signup endpoint (campaignSlug, email, referralCode optional)
- `GET /api/leaderboard/[campaignId]` - Get leaderboard for campaign

### Fraud Detection
- `POST /api/fraud/analyze` - Analyze recent signups for fraud patterns

### Billing
- `POST /api/billing/checkout` - Create Stripe checkout session
- `POST /api/webhooks/stripe` - Webhook for subscription events

## Key Files & Components

### Authentication
- `/lib/session.ts` - Session management (JWT)
- `/app/api/auth/signup/route.ts` - Signup endpoint
- `/app/api/auth/login/route.ts` - Login endpoint

### Database
- `/lib/db.ts` - Aurora DSQL connection manager

### AI Features
- `/lib/ai.ts` - Groq integration (fraud analysis, tier suggestions)
- `/app/api/fraud/analyze/route.ts` - Fraud analysis API
- `/app/api/campaigns/suggest-tiers/route.ts` - Reward tier API

### Events & Logging
- `/lib/dynamo.ts` - DynamoDB event logging
- `/app/api/waitlist/signup/route.ts` - Public waitlist signup with event logging

### Payments
- `/app/api/billing/checkout/route.ts` - Stripe checkout
- `/app/api/webhooks/stripe/route.ts` - Stripe webhook handler

### UI Components
- `/app/signup/page.tsx` - Signup form
- `/app/login/page.tsx` - Login form
- `/components/dashboard-sidebar.tsx` - Dashboard nav with logout

## Security Best Practices

1. **Session Security**
   - JWT tokens stored in HTTP-only cookies
   - Automatic expiration (7 days)
   - Secure flag enabled in production

2. **Password Security**
   - Minimum 8 characters
   - Hashed with bcryptjs (10 rounds)
   - Never stored in plain text

3. **Database Security**
   - All queries use parameterized statements
   - AWS IAM authentication for Aurora DSQL
   - No SQL injection vulnerabilities

4. **API Security**
   - Session validation on protected endpoints
   - Founder ownership verification for campaigns
   - Webhook signature verification for Stripe

## Testing

### Test Signup Flow
1. Navigate to `/signup`
2. Enter valid credentials (min 8 char password)
3. Should redirect to dashboard after signup

### Test Login Flow
1. Navigate to `/login`
2. Enter existing credentials
3. Should redirect to dashboard after login

### Test Public Waitlist
1. Navigate to `/w/[campaign-slug]`
2. Enter email and click Join
3. Should show rank and referral code

### Test Fraud Detection
1. Create campaigns with many signups
2. Call `POST /api/fraud/analyze` with campaignId
3. Claude will analyze patterns and flag suspicious activity

## Development vs Production

### Development
- `AUTH_SECRET` auto-generated if missing
- Stripe optional
- Claude optional (uses mock data if API key missing)

### Production
- Requires all environment variables set
- Stripe webhook configured at https://your-domain.com/api/webhooks/stripe
- Enable email in payment notifications

## Troubleshooting

### Build Fails
- Ensure all dependencies installed: `pnpm install`
- Check Node version (18+ required)

### Login/Signup Returns 500
- Verify Aurora DSQL connection via env vars
- Check `password_hash` column exists in founders table
- Review server logs for detailed error

### No Stripe Events Received
- Verify webhook URL in Stripe dashboard
- Check webhook secret matches environment variable
- Ensure webhook is in "enabled" state

### Fraud Analysis Not Working
- Verify `GROQ_API_KEY` is set
- Check DynamoDB table exists (run `pnpm setup:dynamo`)
- Events must exist for last 24 hours in DynamoDB

## Support

For issues or questions:
1. Check server logs: `/api/` routes log with `[v0]` prefix
2. Review this guide's troubleshooting section
3. Verify all environment variables are set correctly
4. Ensure database tables exist with correct schema

