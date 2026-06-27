# Environment Variables Setup Guide

## File Roles

### `.env.example` (Template - COMMIT to git)
- **Purpose:** Shows all required environment variables
- **Committed to git?** YES - this is safe to commit
- **Contains secrets?** NO - only placeholder values
- **Use case:** Team members use this as reference to set up their local `.env.development.local`

### `.env.development.local` (Secrets - DO NOT commit)
- **Purpose:** Your actual secrets and configuration for local development
- **Committed to git?** NO - add to `.gitignore` (already configured)
- **Contains secrets?** YES - real API keys, database passwords, etc.
- **Use case:** Next.js automatically loads this for `npm run dev`

## Setup Steps

### 1. Create your local env file
```bash
cp .env.example .env.development.local
```

### 2. Generate AUTH_SECRET
```bash
openssl rand -base64 32
```
Copy the output and paste into `AUTH_SECRET=` in `.env.development.local`

### 3. Fill in Database Credentials
Get these from your Aurora DSQL cluster:
```
PGHOST=your-cluster.region.rds.amazonaws.com
PGUSER=your-username
PGDATABASE=your-database-name
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::ACCOUNT_ID:role/YOUR-ROLE
```

### 4. Optional: Add API Keys
If using Claude (AI features):
```
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

If using Stripe (payments):
```
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_PRICE_ID=price_xxxxx
```

### 5. Verify Setup
```bash
# .env.development.local should exist with all values filled
ls -la .env.development.local

# Start dev server
pnpm dev
```

## What NOT to Do

❌ Never commit `.env.development.local` (contains secrets)
❌ Never share your `.env.development.local` file
❌ Never put real secrets in `.env.example`
❌ Never hardcode API keys in your code

## How Next.js Loads Env Vars

1. **Build time:** Loads from `.env.development.local` (local dev)
2. **Build time:** Loads from `.env` (production fallback)
3. **Runtime:** Variables prefixed with `NEXT_PUBLIC_` available in browser
4. **Runtime:** Other variables only in Node.js (server-side code)

### Example:
```javascript
// ✅ Available everywhere (public)
const url = process.env.NEXT_PUBLIC_APP_URL

// ✅ Server-side only (API routes, server components)
const dbPassword = process.env.PGUSER

// ❌ NOT available in browser JS
// const secret = process.env.AUTH_SECRET // undefined
```

## Troubleshooting

### "Variable not found" error
- Make sure `.env.development.local` exists
- Restart dev server after creating/editing `.env.development.local`
- Check variable names match exactly (case-sensitive)

### Environment variables not loading
- Verify file path: should be in project root
- Check `.gitignore` includes `.env.development.local`
- Run `pnpm dev` instead of `npm dev`

## Authentication (Email/Password Only)

This app uses **email/password authentication** (NO Google OAuth).

**How it works:**
1. User signs up with email + password
2. Password hashed with bcryptjs (10 rounds)
3. JWT token created and stored in httpOnly cookie
4. Cookie sent with every request for session validation
5. JWT signed with AUTH_SECRET

**No env vars needed for auth setup** - just AUTH_SECRET!
