/*
  # Update Cache Tables for OpenAI Integration

  1. Changes to overview_cache
    - Add `client_data` column to store original intake data
    - Rename `profile_hash` to `cache_key` for consistency
    - Remove `hit_count` and `last_accessed_at` (not needed for now)
  
  2. Changes to match_cache
    - Change `match_score` from integer to numeric for decimal precision
    - Add UNIQUE constraint on (overview_hash, expert_id)
    - Add indexes for performance
  
  3. Important Notes
    - Uses IF NOT EXISTS and DO blocks to safely add columns
    - Drops old columns only if new ones exist
    - Safe for existing data
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'overview_cache' AND column_name = 'client_data'
  ) THEN
    ALTER TABLE overview_cache ADD COLUMN client_data jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'overview_cache' AND column_name = 'cache_key'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'overview_cache' AND column_name = 'profile_hash'
    ) THEN
      ALTER TABLE overview_cache RENAME COLUMN profile_hash TO cache_key;
    ELSE
      ALTER TABLE overview_cache ADD COLUMN cache_key text UNIQUE NOT NULL;
    END IF;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'overview_cache' AND column_name = 'overview_text'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'overview_cache' AND column_name = 'overview'
    ) THEN
      ALTER TABLE overview_cache RENAME COLUMN overview TO overview_text;
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'match_cache' 
    AND column_name = 'match_score' 
    AND data_type = 'integer'
  ) THEN
    ALTER TABLE match_cache ALTER COLUMN match_score TYPE numeric USING match_score::numeric;
  END IF;
END $$;

ALTER TABLE match_cache 
  DROP CONSTRAINT IF EXISTS match_cache_score_check,
  ADD CONSTRAINT match_cache_score_check CHECK (match_score >= 0 AND match_score <= 100);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'match_cache_overview_expert_unique'
  ) THEN
    ALTER TABLE match_cache ADD CONSTRAINT match_cache_overview_expert_unique UNIQUE (overview_hash, expert_id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_overview_cache_key ON overview_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_overview_cache_created_at ON overview_cache(created_at);
CREATE INDEX IF NOT EXISTS idx_match_cache_overview_hash ON match_cache(overview_hash);
CREATE INDEX IF NOT EXISTS idx_match_cache_composite ON match_cache(overview_hash, expert_id);
CREATE INDEX IF NOT EXISTS idx_match_cache_created_at ON match_cache(created_at);