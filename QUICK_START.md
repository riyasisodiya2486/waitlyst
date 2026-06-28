# Quick Start: Waitlyst Authentication & AI Features

## What Was Implemented

### ✅ Email/Password Authentication
- **Sign Up** (`/signup`) - Create account with name, email, password
- **Sign In** (`/login`) - Login with email and password  
- **Session Management** - JWT tokens in HTTP-only cookies
- **Dashboard Protection** - `/dashboard` requires authentication
- **Logout** - Sign out button in sidebar

### ✅ AI-Powered Features
- **Fraud Detection** - Claude analyzes signup patterns, IP addresses, referrals
- **Reward Tier Suggestions** - Claude recommends tiers based on campaign description
- **Event Logging** - DynamoDB stores all signup/referral events

### ✅ Stripe Integration
- **Checkout** - `/api/billing/checkout` creates Stripe sessions
- **Webhooks** - Automatic plan updates on subscription changes
- **Plan Management** - Free → Pro on successful payment

### ✅ Public API
- **Waitlist Signup** - `POST /api/waitlist/signup` for public campaigns
- **Leaderboard** - `GET /api/leaderboard/[campaignId]` for rankings

## Immediate Next Steps

### 1. Add Database Column
```sql
ALTER TABLE founders ADD COLUMN password_hash TEXT;
```

### 2. Set Environment Variables
Go to project Settings → Vars and add:
- `GROQ_API_KEY` - Get from [console.groq.com](https://console.console.groq.com)
- `STRIPE_SECRET_KEY` - Get from [stripe.com](https://dashboard.stripe.com)
- `STRIPE_WEBHOOK_SECRET` - From Stripe webhooks
- `NEXT_PUBLIC_APP_URL` - Your production URL

### 3. Test Locally
```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Test endpoints
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","password":"password123"}'
```

## Key URLs

### Public Pages
- `/` - Home page
- `/login` - Sign in
- `/signup` - Create account
- `/w/[slug]` - Public waitlist

### Protected Pages (requires login)
- `/dashboard` - Main dashboard
- `/dashboard/campaigns` - Manage campaigns
- `/dashboard/analytics` - View analytics
- `/dashboard/fraud` - Monitor fraud
- `/dashboard/billing` - Manage subscription

## API Examples

### Signup
```bash
POST /api/auth/signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "secure123"
}
```

### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "secure123"
}
```

### Public Waitlist Signup
```bash
POST /api/waitlist/signup
Content-Type: application/json

{
  "campaignSlug": "product-launch",
  "email": "user@example.com",
  "referralCode": "abc123xyz"  // optional
}
```

Response:
```json
{
  "rank": 247,
  "referralCode": "xyz789abc"
}
```

### Get Leaderboard
```bash
GET /api/leaderboard/campaign-id
```

### Analyze Fraud (requires session)
```bash
POST /api/fraud/analyze
Content-Type: application/json

{
  "campaignId": "campaign-uuid"
}
```

### Suggest Reward Tiers (requires session)
```bash
POST /api/campaigns/suggest-tiers
Content-Type: application/json

{
  "description": "AI email assistant for writing better emails"
}
```

Response:
```json
{
  "tiers": [
    { "minReferrals": 10, "rewardLabel": "Early Access" },
    { "minReferrals": 50, "rewardLabel": "6 Months Free" },
    { "minReferrals": 100, "rewardLabel": "Lifetime Free" }
  ]
}
```

### Create Checkout Session (requires session)
```bash
POST /api/billing/checkout
Content-Type: application/json

{}
```

Response:
```json
{
  "url": "https://checkout.stripe.com/pay/cs_test_..."
}
```

## Features by Component

### Authentication (`/lib/session.ts`)
- `createSession(founderId)` - Create JWT token
- `getSession()` - Verify & retrieve session
- `destroySession()` - Clear session

### Database (`/lib/db.ts`)
- Connects to Aurora DSQL with IAM auth
- Provides parameterized query execution
- Handles connection lifecycle

### AI (`/lib/ai.ts`)
- `analyzeFraud(events)` - Detect suspicious signups
- `suggestRewardTiers(description)` - Generate tier ideas

### Events (`/lib/dynamo.ts`)
- `logReferralEvent()` - Store signup/referral events
- `getRecentEvents()` - Retrieve events for analysis
- `putFraudSignal()` - Mark suspicious activity

## Security Notes

✅ Passwords hashed with bcryptjs  
✅ Sessions in HTTP-only cookies  
✅ Parameterized SQL queries  
✅ IAM authentication for database  
✅ Webhook signature verification  
✅ Server-side session validation  

## File Structure

```
app/
├── signup/page.tsx              # Signup form
├── login/page.tsx               # Login form
├── dashboard/
│   ├── layout.tsx               # Protected layout
│   ├── page.tsx                 # Main dashboard
│   └── [other pages]
├── api/
│   ├── auth/
│   │   ├── signup/route.ts
│   │   ├── login/route.ts
│   │   └── logout/route.ts
│   ├── campaigns/
│   │   ├── route.ts             # Create/list campaigns
│   │   └── suggest-tiers/route.ts
│   ├── waitlist/
│   │   └── signup/route.ts      # Public signup
│   ├── fraud/
│   │   └── analyze/route.ts
│   ├── billing/
│   │   └── checkout/route.ts
│   ├── leaderboard/
│   │   └── [campaignId]/route.ts
│   └── webhooks/
│       └── stripe/route.ts
lib/
├── session.ts                   # JWT session management
├── db.ts                        # Aurora DSQL connection
├── dynamo.ts                    # DynamoDB event logging
└── ai.ts                    # Groq AI integration
components/
├── dashboard-sidebar.tsx        # Nav with logout
└── [other components]
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Signup returns 500 | Check `PGHOST`, `PGUSER`, `PGDATABASE` env vars |
| Login fails | Verify `password_hash` column exists in `founders` table |
| Session not persisting | Check cookies are enabled and not blocked by SameSite |
| Fraud analysis fails | Set `GROQ_API_KEY` and ensure DynamoDB table exists |
| Stripe checkout 503 | Set `STRIPE_SECRET_KEY` environment variable |

## Next: Deploy to Vercel

```bash
# Push to GitHub
git push origin your-branch

# Create PR or merge to main
# Vercel auto-deploys on merge
```

After deployment:
1. Update `NEXT_PUBLIC_APP_URL` env var to production URL
2. Configure Stripe webhook URL to `https://your-domain.com/api/webhooks/stripe`
3. Test signup/login flow in production

