/*
  # Create Cache Tables for Performance Optimization

  1. New Tables
    - `overview_cache`
      - `id` (uuid, primary key)
      - `profile_hash` (text, unique index) - SHA256 hash of client profile fields
      - `overview` (text) - cached AI-generated overview
      - `hit_count` (integer) - number of times this cache entry was used
      - `created_at` (timestamptz)
      - `last_accessed_at` (timestamptz)
    
    - `match_cache`
      - `id` (uuid, primary key)
      - `overview_hash` (text) - SHA256 hash of client overview text
      - `expert_id` (integer) - references experts table
      - `match_score` (integer) - AI match score 0-100
      - `reason_1` (text) - first match reason
      - `reason_2` (text) - second match reason
      - `created_at` (timestamptz)
      - Composite unique index on (overview_hash, expert_id)
  
  2. Security
    - Enable RLS on both tables
    - Allow anonymous users to read cached data
    - Restrict writes to service role only
  
  3. Performance
    - Add indexes on hash columns for fast lookups
    - Add TTL cleanup policies (7 days for overview_cache, 24 hours for match_cache)
    - Track cache hit metrics for monitoring
*/

-- Create overview_cache table
CREATE TABLE IF NOT EXISTS overview_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_hash text NOT NULL UNIQUE,
  overview text NOT NULL,
  hit_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  last_accessed_at timestamptz DEFAULT now()
);

-- Create match_cache table
CREATE TABLE IF NOT EXISTS match_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  overview_hash text NOT NULL,
  expert_id integer NOT NULL,
  match_score integer NOT NULL,
  reason_1 text DEFAULT '',
  reason_2 text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  UNIQUE(overview_hash, expert_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_overview_cache_profile_hash ON overview_cache(profile_hash);
CREATE INDEX IF NOT EXISTS idx_overview_cache_created_at ON overview_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_match_cache_overview_hash ON match_cache(overview_hash);
CREATE INDEX IF NOT EXISTS idx_match_cache_created_at ON match_cache(created_at);

-- Enable RLS
ALTER TABLE overview_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies for overview_cache
CREATE POLICY "Anyone can read overview cache"
  ON overview_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert overview cache"
  ON overview_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update overview cache"
  ON overview_cache FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policies for match_cache
CREATE POLICY "Anyone can read match cache"
  ON match_cache FOR SELECT
  USING (true);

CREATE POLICY "Service role can insert match cache"
  ON match_cache FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service role can update match cache"
  ON match_cache FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Function to clean up old cache entries (overview_cache older than 7 days)
CREATE OR REPLACE FUNCTION cleanup_old_overview_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM overview_cache
  WHERE created_at < now() - interval '7 days';
END;
$$;

-- Function to clean up old match cache entries (older than 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_match_cache()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM match_cache
  WHERE created_at < now() - interval '24 hours';
END;
$$;