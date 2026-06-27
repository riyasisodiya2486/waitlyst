# Environment Files: .env.example vs .env.development.local

## Quick Answer

| File | Purpose | Commit to Git? | Contains Secrets? |
|------|---------|---|---|
| `.env.example` | Template showing what vars are needed | ✅ YES | ❌ NO |
| `.env.development.local` | Your actual secrets for local development | ❌ NO | ✅ YES |

---

## Detailed Explanation

### `.env.example` - The Template

**What it is:**
A template file that shows the **structure and names** of all environment variables your app needs.

**Example:**
```env
# This is .env.example
AUTH_SECRET=your-jwt-secret-key-generate-with-openssl
PGHOST=your-aurora-dsql-host.region.rds.amazonaws.com
PGUSER=your-username
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

**Why commit it?**
- Developers know what env vars are required
- Documents your app's configuration needs
- New team members copy it to create their own `.env.development.local`
- Appears in GitHub/GitLab for reference

**What to put in it:**
- ✅ Variable names and descriptions
- ✅ Example values (safe, fake values)
- ❌ Real API keys
- ❌ Real database passwords
- ❌ Real secrets

**When to update:**
- Adding a new feature that needs a new env var
- Removing or renaming an env var
- Changing documentation/comments

---

### `.env.development.local` - Your Secrets

**What it is:**
The **actual configuration file** for your local development environment containing **real secrets**.

**Example:**
```env
# This is .env.development.local
AUTH_SECRET=6h5K8mJp9L2qR4tW7vX9zA0bC3d5E7fG9h1j3k5m7n  # Real secret!
PGHOST=cluster-abc123.us-east-1.rds.amazonaws.com      # Real host!
PGUSER=admin                                             # Real username!
ANTHROPIC_API_KEY=sk-ant-kJ8f9hg7d6c5b4a3z2y1w0       # Real API key!
```

**Why NOT commit it?**
- Listed in `.gitignore` for a reason
- Contains secrets that could compromise your app
- If leaked, anyone can access your databases and APIs
- Never commit secrets to version control

**How Next.js loads it:**
```bash
npm run dev
→ Next.js loads from .env.development.local automatically
→ Variables available in your code during development
```

**What to put in it:**
- ✅ Real API keys
- ✅ Real database credentials
- ✅ Real secrets (JWT secrets, stripe keys, etc.)
- ❌ Placeholder values (use the real ones!)

**When to update:**
- Getting a new API key
- Changing database credentials
- Adding new integrations

---

## How to Set Up Locally

### Step 1: Copy the template
```bash
cp .env.example .env.development.local
```

### Step 2: Generate secrets
```bash
# Generate a random AUTH_SECRET
openssl rand -base64 32

# Output:
# 6h5K8mJp9L2qR4tW7vX9zA0bCd5E7fG9h1j3k5m7n
```

### Step 3: Fill in your actual values
Open `.env.development.local` and replace placeholder values:

```env
# Before (from .env.example)
AUTH_SECRET=your-jwt-secret-key-generate-with-openssl

# After (your actual value)
AUTH_SECRET=6h5K8mJp9L2qR4tW7vX9zA0bC3d5E7fG9h1j3k5m7n
```

### Step 4: Never commit it
```bash
# Already in .gitignore, but verify
cat .gitignore | grep env.development.local
# Output: .env.development.local
```

### Step 5: Restart dev server
```bash
# Stop: Ctrl+C
# Start again
pnpm dev

# Next.js will load from .env.development.local
```

---

## Typical .env.example Structure

```env
# ============================================
# AUTHENTICATION
# ============================================
# JWT secret for signing session cookies
# Generate with: openssl rand -base64 32
AUTH_SECRET=your-jwt-secret-key-generate-with-openssl

# ============================================
# DATABASE
# ============================================
PGHOST=your-aurora-dsql-host.region.rds.amazonaws.com
PGUSER=admin
PGDATABASE=waitlyst
AWS_REGION=us-east-1
AWS_ROLE_ARN=arn:aws:iam::123456789:role/your-role

# ============================================
# AI (Claude)
# ============================================
ANTHROPIC_API_KEY=sk-ant-your-api-key

# ============================================
# PAYMENTS (Stripe)
# ============================================
STRIPE_SECRET_KEY=sk_test_your-key
STRIPE_WEBHOOK_SECRET=whsec_your-secret
```

---

## Common Mistakes

❌ **Mistake 1:** Committing `.env.development.local`
```bash
git add .env.development.local  # WRONG!
git commit -m "Add env vars"     # Leaked secrets!
```
✅ **Fix:** Make sure it's in `.gitignore`

---

❌ **Mistake 2:** Not updating `.env.example` when adding new vars
```javascript
// You added a new feature:
const apiKey = process.env.NEW_API_KEY

// But forgot to add it to .env.example
// Now new developers don't know they need it
```
✅ **Fix:** Always update `.env.example` first

---

❌ **Mistake 3:** Putting fake values in `.env.development.local`
```env
# .env.development.local
STRIPE_SECRET_KEY=sk_test_fake_key  # Won't work!
```
✅ **Fix:** Use real values (gotten from your service provider)

---

❌ **Mistake 4:** Hardcoding secrets in code
```javascript
// WRONG!
const apiKey = "sk-ant-abc123def456"

// Then someone sees it in GitHub!
```
✅ **Fix:** Always use environment variables

---

## Next.js Environment Variable Rules

### Variables Available Everywhere
Variables prefixed with `NEXT_PUBLIC_` are available in the browser:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

```javascript
// ✅ Works in browser JS
console.log(process.env.NEXT_PUBLIC_APP_URL)
```

### Variables Available Only in Server
Without `NEXT_PUBLIC_` prefix, only available in server code:

```env
AUTH_SECRET=my-secret-key
```

```javascript
// ✅ Works in API routes and server components
async function myServerFunction() {
  const secret = process.env.AUTH_SECRET  // Available
}

// ❌ Won't work in browser JS
// process.env.AUTH_SECRET would be undefined
```

---

## Troubleshooting

### Variables not loading?
1. Check `.env.development.local` exists in project root
2. Verify variable names match exactly (case-sensitive)
3. Restart dev server (`Ctrl+C`, then `pnpm dev` again)
4. Check `.gitignore` includes `.env.development.local`

### Getting "undefined" errors?
1. Variable not set in `.env.development.local`
2. Variable name spelled differently in code vs env file
3. Using wrong env file (e.g., `.env` instead of `.env.development.local`)

### Can't see my secrets in code?
1. It's a security feature - secrets are hidden by design
2. Use `console.log()` during development to debug
3. Check if variable has `NEXT_PUBLIC_` prefix (if not, only server-side available)

### Need to share env vars with team?
1. Create a secure shared doc (Notion, Vault, etc.)
2. Each developer adds values to their own `.env.development.local`
3. Never send actual secrets over email/Slack
4. Use a secrets manager (1Password, Doppler, etc.) for production
