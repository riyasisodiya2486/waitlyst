-- Waitlyst full schema for local PostgreSQL
-- Creates all tables needed by the application

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Founders table
CREATE TABLE IF NOT EXISTS founders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  founder_id UUID NOT NULL REFERENCES founders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reward tiers table
CREATE TABLE IF NOT EXISTS reward_tiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  min_referrals INTEGER NOT NULL DEFAULT 1,
  reward_label TEXT NOT NULL,
  tier_order INTEGER NOT NULL DEFAULT 0
);

-- Participants table (waitlist signups)
CREATE TABLE IF NOT EXISTS participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  rank INTEGER NOT NULL,
  referral_code TEXT NOT NULL UNIQUE,
  referral_count INTEGER NOT NULL DEFAULT 0,
  referred_by TEXT,
  ip_address TEXT DEFAULT 'unknown',
  fraud_score INTEGER DEFAULT 0,
  fraud_status TEXT DEFAULT 'clean',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(campaign_id, email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_founder_id ON campaigns(founder_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);
CREATE INDEX IF NOT EXISTS idx_participants_campaign_id ON participants(campaign_id);
CREATE INDEX IF NOT EXISTS idx_participants_referral_code ON participants(referral_code);
CREATE INDEX IF NOT EXISTS idx_participants_email ON participants(email);

SELECT 'Schema created successfully' AS status;
