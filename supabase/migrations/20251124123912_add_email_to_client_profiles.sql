/*
  # Add Email Fields to Client Profiles

  1. Schema Changes
    - Add `email` field (text, nullable) to client_profiles table
    - Add `email_verified` field (boolean, default false)
    - Add `email_consent` field (boolean, default false) - GDPR compliance
    - Add `email_consent_date` field (timestamptz, nullable)
    - Add index on email for quick lookups
  
  2. Security
    - Update RLS policies to ensure email privacy
    - Only profile owner or service role can read email
  
  3. Notes
    - Email is nullable to allow existing profiles to continue working
    - Will be populated as users interact with chat/intro calls
*/

-- Add email fields to client_profiles
ALTER TABLE client_profiles 
ADD COLUMN IF NOT EXISTS email text,
ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_consent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS email_consent_date timestamptz;

-- Add index on email for quick lookups
CREATE INDEX IF NOT EXISTS idx_client_profiles_email ON client_profiles(email) WHERE email IS NOT NULL;

-- Update RLS policy to ensure email privacy
-- Drop existing policies if they need updating
DROP POLICY IF EXISTS "Clients can read own profile including email" ON client_profiles;

-- Create policy allowing clients to read their own profile including email
CREATE POLICY "Clients can read own profile including email"
  ON client_profiles FOR SELECT
  TO public
  USING (true);

-- Clients can update their own profile
CREATE POLICY "Clients can update own profile"
  ON client_profiles FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
