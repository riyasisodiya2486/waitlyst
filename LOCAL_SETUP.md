# Local Development Setup Guide

## Fixed Issues

✅ **MissingSecret Error** - Added `AUTH_SECRET` to auth configuration
✅ **Cursor Animation Lag** - Removed all CustomCursor components and cursor animations
✅ **Smooth Scroll Lag** - Removed scroll-smooth behavior for instant page transitions
✅ **Performance** - All page transitions now run smoothly without jank

## Environment Setup

### 1. Copy the environment template:
```bash
cp .env.example .env.local
```

### 2. Set up required environment variables in `.env.local`:

#### Authentication (Required)
```
AUTH_SECRET=generate-a-random-32-char-string-here
AUTH_GOOGLE_ID=your-google-oauth-client-id
AUTH_GOOGLE_SECRET=your-google-oauth-client-secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-another-32-char-string
```

To generate secure random strings:
```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

#### Database Configuration (Required for production, optional for testing)
```
PGHOST=your-aurora-dsql-endpoint
PGUSER=admin
PGDATABASE=waitlyst
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::YOUR_ACCOUNT:role/YOUR_ROLE
```

#### Optional Services
- **Stripe**: For payment processing
- **Claude/Anthropic**: For AI features (fraud detection, reward tier suggestions)
- **DynamoDB**: For event logging

## Local Development

### Start the development server:
```bash
pnpm dev
```

Server will run at `http://localhost:3000`

### Test Account Creation

The account creation endpoint is at `/api/auth/signup` (POST)

Example request:
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "password": "password123"
  }'
```

### Test Login

Login endpoint is at `/api/auth/login` (POST)

Example request:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Performance Improvements Made

1. **Removed Cursor Animation** - CustomCursor component deleted, cursor reverted to default
2. **Disabled Smooth Scroll** - Instant page scrolling for better responsiveness
3. **Removed Animation on Page Changes** - Faster navigation without smooth transitions
4. **Optimized Transitions** - Kept essential animations, removed redundant ones

## Troubleshooting

### Error: "MissingSecret: Please define a `secret`"
- Ensure `AUTH_SECRET` is set in `.env.local`
- Restart the dev server after updating env vars

### Error: "Database connection refused"
- For local testing, you can skip database setup and use mock data
- Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local` to use mock data

### Pages Loading Slowly
- Clear `.next` cache: `rm -rf .next`
- Reinstall dependencies: `pnpm install`
- Restart dev server: `pnpm dev`

## Project Structure

```
waitlyst/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Protected dashboard pages
│   ├── login/            # Login page
│   ├── signup/           # Signup page
│   └── page.tsx          # Homepage
├── lib/
│   ├── auth.ts           # NextAuth configuration
│   ├── session.ts        # Session management
│   ├── db.ts             # Database connection
│   └── claude.ts         # Claude AI integration
├── components/           # React components
└── public/              # Static assets
```

## Next Steps

1. Configure Google OAuth credentials
2. Set up Aurora DSQL database (or use demo mode)
3. Add Stripe keys for payment features
4. Add Anthropic API key for AI features
5. Deploy to Vercel when ready

## Support

For issues or questions, refer to:
- Next.js Documentation: https://nextjs.org/docs
- NextAuth.js: https://next-auth.js.org
- Vercel: https://vercel.com/docs
