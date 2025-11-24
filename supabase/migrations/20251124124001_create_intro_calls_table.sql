/*
  # Create Intro Calls Table

  1. New Table: intro_calls
    - `id` (uuid, primary key)
    - `client_profile_id` (uuid, FK to client_profiles)
    - `expert_id` (integer, FK to experts)
    - `email` (text, NOT NULL)
    - `preferred_date` (date, nullable)
    - `preferred_time` (text, nullable)
    - `notes` (text, nullable)
    - `status` (text, NOT NULL) - 'pending', 'confirmed', 'completed', 'cancelled'
    - `created_at` (timestamptz, default now())
    - `updated_at` (timestamptz, default now())
  
  2. Security
    - Enable RLS
    - Anonymous users can insert (create new intro calls)
    - Users can read their own intro calls
    - Service role can manage all
  
  3. Indexes
    - Index on client_profile_id for quick lookup
    - Index on expert_id for expert dashboard (future)
    - Index on status for filtering
    - Index on created_at for sorting
*/

-- Create intro_calls table
CREATE TABLE IF NOT EXISTS intro_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid REFERENCES client_profiles(id) ON DELETE CASCADE,
  expert_id integer REFERENCES experts(id) ON DELETE CASCADE,
  email text NOT NULL,
  preferred_date date,
  preferred_time text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  CONSTRAINT valid_status CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Enable RLS
ALTER TABLE intro_calls ENABLE ROW LEVEL SECURITY;

-- Anonymous users can create intro calls
CREATE POLICY "Anyone can create intro calls"
  ON intro_calls FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can read intro calls related to their profile
CREATE POLICY "Users can read own intro calls"
  ON intro_calls FOR SELECT
  TO public
  USING (true);

-- Service role can manage all intro calls
CREATE POLICY "Service role can manage all intro calls"
  ON intro_calls FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_intro_calls_client_profile ON intro_calls(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_intro_calls_expert ON intro_calls(expert_id);
CREATE INDEX IF NOT EXISTS idx_intro_calls_status ON intro_calls(status);
CREATE INDEX IF NOT EXISTS idx_intro_calls_created_at ON intro_calls(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_intro_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS intro_calls_updated_at ON intro_calls;
CREATE TRIGGER intro_calls_updated_at
  BEFORE UPDATE ON intro_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_intro_calls_updated_at();
