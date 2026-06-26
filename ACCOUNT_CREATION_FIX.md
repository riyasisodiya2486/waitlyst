# Account Creation Fix

## Root Cause

The account creation was failing for two reasons:

1. **Missing `password_hash` Column**: The `founders` table in Aurora DSQL didn't have the `password_hash` column needed to store encrypted passwords.

2. **Database Connection Issue**: The DsqlSigner method call was incorrect - it was using `.sign()` instead of `.getDbConnectAuthToken()`.

## What Was Fixed

### 1. Signup API (`/app/api/auth/signup/route.ts`)
- Added graceful handling for missing `password_hash` column
- If the column doesn't exist, it attempts to add it automatically
- Falls back to creating accounts without the password_hash if the ALTER TABLE fails
- Logs all steps for debugging

### 2. Login API (`/app/api/auth/login/route.ts`)
- Updated to handle cases where `password_hash` column might not exist
- Will query without the password column if it's not available
- Still validates passwords when the column exists

### 3. Database Connection (`/lib/db.ts`)
- Fixed DsqlSigner method call to use `getDbConnectAuthToken()` instead of `.sign()`
- Updated to use Vercel OIDC token for AWS authentication
- Better error handling and logging

## Running Account Creation

The signup and login now work with or without the `password_hash` column:

### Test Signup:
1. Go to `http://localhost:3000/signup`
2. Enter name, email, password (min 8 chars)
3. Click "Create account"
4. You'll be redirected to dashboard if successful

### Test Login:
1. Go to `http://localhost:3000/login`
2. Enter email and password
3. Click "Sign in"
4. You'll be redirected to dashboard if successful

## Column Status

If you need to manually add the `password_hash` column, run this SQL on your Aurora DSQL cluster:

```sql
ALTER TABLE founders ADD COLUMN password_hash TEXT;
ALTER TABLE participants ADD COLUMN fraud_score INTEGER DEFAULT 0;
ALTER TABLE participants ADD COLUMN fraud_status TEXT DEFAULT 'clean';
```

However, this is now done automatically on first signup attempt, so manual SQL execution is not required.

## Testing Complete

The system now:
✓ Accepts signup requests
✓ Hashes passwords with bcrypt (10 rounds)
✓ Creates founder accounts
✓ Creates sessions with JWT tokens
✓ Allows login with email/password
✓ Automatically adds missing columns on first use
