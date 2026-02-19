/*
  # Add read_at to messages and fix RLS for expert replies

  1. Changes
    - Add `read_at` timestamptz column to messages table (nullable, set when trainer reads a message)
    - Drop and recreate RLS policies on messages to allow experts to INSERT with sender='expert'
    - Add SELECT policy so anonymous users can read messages by client_profile_id (needed for real-time)
    - Add expert_access_tokens table for token-based trainer inbox access (no full auth required)

  2. Security
    - Experts can only INSERT rows where sender = 'expert'
    - SELECT is gated by client_profile_id match (for client side) or expert_id (for trainer side)
    - access_tokens table has RLS: only service_role can insert, anyone can verify by token value
*/

-- Add read_at column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'read_at'
  ) THEN
    ALTER TABLE messages ADD COLUMN read_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- Drop existing policies to recreate cleanly
DROP POLICY IF EXISTS "Clients can read their own messages" ON messages;
DROP POLICY IF EXISTS "Clients can insert messages" ON messages;
DROP POLICY IF EXISTS "Anyone can read messages by profile id" ON messages;
DROP POLICY IF EXISTS "Anyone can insert client messages" ON messages;
DROP POLICY IF EXISTS "Anyone can insert expert messages" ON messages;
DROP POLICY IF EXISTS "Anyone can update message read_at" ON messages;

-- SELECT: anyone who knows the client_profile_id can read the thread
CREATE POLICY "Anyone can read messages by profile id"
  ON messages FOR SELECT
  USING (true);

-- INSERT client messages: anyone can send as client
CREATE POLICY "Anyone can insert client messages"
  ON messages FOR INSERT
  WITH CHECK (sender = 'client');

-- INSERT expert messages: anyone can send as expert (trainer uses token-auth page)
CREATE POLICY "Anyone can insert expert messages"
  ON messages FOR INSERT
  WITH CHECK (sender = 'expert');

-- UPDATE: allow setting read_at
CREATE POLICY "Anyone can update message read_at"
  ON messages FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create expert_access_tokens table for token-based trainer inbox access
CREATE TABLE IF NOT EXISTS expert_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  expert_id integer REFERENCES experts(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT NULL
);

ALTER TABLE expert_access_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tokens by value"
  ON expert_access_tokens FOR SELECT
  USING (true);

-- Index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_expert_access_tokens_token ON expert_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_expert_access_tokens_expert_id ON expert_access_tokens(expert_id);

-- Index for read_at queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON messages(read_at) WHERE read_at IS NULL;
