/*
  # Create Error Logging Table

  1. New Table
    - `error_logs`
      - `id` (uuid, primary key)
      - `error_id` (text, unique) - Unique error identifier
      - `error_code` (text, indexed) - Error code (e.g., NET-001, AI-001)
      - `error_message` (text) - Technical error message
      - `user_message` (text) - User-friendly message
      - `severity` (text) - info, warning, error, critical
      - `source` (text) - client, server, openai, database, network
      - `user_action` (text) - What the user was doing
      - `page_url` (text) - URL where error occurred
      - `user_agent` (text) - Browser user agent
      - `session_id` (text) - Session identifier
      - `client_profile_id` (uuid, nullable) - Associated profile if any
      - `request_data` (jsonb) - Request context
      - `response_data` (jsonb) - Response data if available
      - `stack_trace` (text) - Error stack trace
      - `metadata` (jsonb) - Additional error metadata
      - `retry_count` (integer) - Number of retry attempts
      - `resolved` (boolean) - Whether error was resolved
      - `created_at` (timestamptz) - When error occurred
  
  2. Indexes
    - Index on error_code for filtering
    - Index on severity for monitoring
    - Index on created_at for time-based queries
    - Index on client_profile_id for user-specific errors
  
  3. Security
    - Enable RLS
    - Allow public insert (for error logging)
    - Restrict read to authenticated users only
*/

CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  error_id text UNIQUE,
  error_code text NOT NULL,
  error_message text,
  user_message text,
  severity text NOT NULL CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  source text NOT NULL CHECK (source IN ('client', 'server', 'openai', 'database', 'network')),
  user_action text,
  page_url text,
  user_agent text,
  session_id text,
  client_profile_id uuid,
  request_data jsonb,
  response_data jsonb,
  stack_trace text,
  metadata jsonb,
  retry_count integer DEFAULT 0,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_error_logs_code ON error_logs(error_code);
CREATE INDEX IF NOT EXISTS idx_error_logs_severity ON error_logs(severity);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_profile_id ON error_logs(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_session_id ON error_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_source ON error_logs(source);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public to insert error logs"
  ON error_logs FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to read error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (true);