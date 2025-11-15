/*
  # MatchFit Initial Schema

  1. New Tables
    - `users`
      - `id` (uuid, primary key)
      - `email` (text, unique)
      - `password_hash` (text)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `experts`
      - `id` (serial, primary key)
      - `specialization` (text)
      - `certificates` (text)
      - `years_of_experience` (integer)
      - `client_reviews` (integer)
      - `client_ratings` (integer)
      - `monthly_budget` (text)
      - `availability` (text)
      - `cooperation` (text)
      - `overview` (text)
    
    - `client_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable FK to users)
      - High-priority fields:
        - `training_experience` (text)
        - `goals` (text[])
        - `sessions_per_week` (integer)
        - `chronic_diseases` (text[])
        - `injuries` (text[])
        - `weight_goal` (text)
      - Secondary fields:
        - `age` (integer)
        - `gender` (text)
        - `living_area` (text)
        - `monthly_budget` (text)
        - `availability` (text)
        - `cooperation` (text)
      - `overview` (text) - AI-generated and user-edited summary
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `match_results`
      - `id` (uuid, primary key)
      - `client_profile_id` (uuid, FK to client_profiles)
      - `expert_id` (integer, FK to experts)
      - `match_score` (numeric)
      - `reason1` (text)
      - `reason2` (text)
      - `created_at` (timestamptz)
    
    - `selected_trainers`
      - `id` (uuid, primary key)
      - `client_profile_id` (uuid, unique FK to client_profiles)
      - `expert_id` (integer, FK to experts)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `messages`
      - `id` (uuid, primary key)
      - `client_profile_id` (uuid, FK to client_profiles)
      - `expert_id` (integer, FK to experts)
      - `sender` (text) - 'client' or 'expert'
      - `content` (text)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to access their own data
    - Add policies for clients to view expert data
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Experts table
CREATE TABLE IF NOT EXISTS experts (
  id serial PRIMARY KEY,
  specialization text NOT NULL,
  certificates text,
  years_of_experience integer,
  client_reviews integer,
  client_ratings integer,
  monthly_budget text,
  availability text,
  cooperation text,
  overview text
);

ALTER TABLE experts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view experts"
  ON experts FOR SELECT
  TO public
  USING (true);

-- Client profiles table
CREATE TABLE IF NOT EXISTS client_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  training_experience text,
  goals text[],
  sessions_per_week integer,
  chronic_diseases text[],
  injuries text[],
  weight_goal text,
  age integer,
  gender text,
  living_area text,
  monthly_budget text,
  availability text,
  cooperation text,
  overview text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON client_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert own profile"
  ON client_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update own profile"
  ON client_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Anonymous users can create profiles"
  ON client_profiles FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can read their profiles"
  ON client_profiles FOR SELECT
  TO anon
  USING (true);

-- Match results table
CREATE TABLE IF NOT EXISTS match_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid REFERENCES client_profiles(id) ON DELETE CASCADE,
  expert_id integer REFERENCES experts(id),
  match_score numeric NOT NULL,
  reason1 text,
  reason2 text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own match results"
  ON match_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE client_profiles.id = match_results.client_profile_id
      AND client_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Anonymous users can read match results"
  ON match_results FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "System can insert match results"
  ON match_results FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Selected trainers table
CREATE TABLE IF NOT EXISTS selected_trainers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid UNIQUE REFERENCES client_profiles(id) ON DELETE CASCADE,
  expert_id integer REFERENCES experts(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE selected_trainers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own selected trainer"
  ON selected_trainers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE client_profiles.id = selected_trainers.client_profile_id
      AND client_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own selected trainer"
  ON selected_trainers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE client_profiles.id = selected_trainers.client_profile_id
      AND client_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own selected trainer"
  ON selected_trainers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE client_profiles.id = selected_trainers.client_profile_id
      AND client_profiles.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE client_profiles.id = selected_trainers.client_profile_id
      AND client_profiles.user_id = auth.uid()
    )
  );

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_profile_id uuid REFERENCES client_profiles(id) ON DELETE CASCADE,
  expert_id integer REFERENCES experts(id),
  sender text NOT NULL CHECK (sender IN ('client', 'expert')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE client_profiles.id = messages.client_profile_id
      AND client_profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    sender = 'client' AND
    EXISTS (
      SELECT 1 FROM client_profiles
      WHERE client_profiles.id = messages.client_profile_id
      AND client_profiles.user_id = auth.uid()
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON client_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_match_results_client_profile_id ON match_results(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_match_results_expert_id ON match_results(expert_id);
CREATE INDEX IF NOT EXISTS idx_selected_trainers_client_profile_id ON selected_trainers(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_client_profile_id ON messages(client_profile_id);
CREATE INDEX IF NOT EXISTS idx_messages_expert_id ON messages(expert_id);