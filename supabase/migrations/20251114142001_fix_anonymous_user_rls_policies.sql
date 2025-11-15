/*
  # Fix RLS Policies for Anonymous Users

  ## Overview
  This migration adds comprehensive RLS policies for anonymous users across all tables
  to support the MVP functionality. The application is designed to work with anonymous
  users who have broad access to features.

  ## Changes Made

  ### 1. Match Results Table
  - **Added**: INSERT policy for anonymous users to allow match results creation
  - Existing SELECT policy already allows anonymous users to read all match results

  ### 2. Selected Trainers Table
  - **Added**: SELECT policy for anonymous users to view all selected trainers
  - **Added**: INSERT policy for anonymous users to select any trainer
  - **Added**: UPDATE policy for anonymous users to change trainer selections
  - **Added**: DELETE policy for anonymous users to remove selections

  ### 3. Messages Table
  - **Added**: SELECT policy for anonymous users to view all messages
  - **Added**: INSERT policy for anonymous users to send messages as client
  - Removed sender restriction for anonymous users

  ### 4. Client Profiles Table
  - **Added**: UPDATE policy for anonymous users to edit any profile
  - Existing policies already allow anonymous users to create and read profiles

  ## Security Notes
  - This migration enables broad access for anonymous users as required for MVP
  - All anonymous policies use permissive rules (USING true/WITH CHECK true)
  - Authentication and restrictive policies should be added before production
*/

-- Match Results Table: Add INSERT policy for anonymous users
CREATE POLICY "Anonymous users can insert match results"
  ON match_results FOR INSERT
  TO anon
  WITH CHECK (true);

-- Selected Trainers Table: Add comprehensive anonymous policies
CREATE POLICY "Anonymous users can read selected trainers"
  ON selected_trainers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert selected trainers"
  ON selected_trainers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anonymous users can update selected trainers"
  ON selected_trainers FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anonymous users can delete selected trainers"
  ON selected_trainers FOR DELETE
  TO anon
  USING (true);

-- Messages Table: Add anonymous user policies
CREATE POLICY "Anonymous users can read messages"
  ON messages FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anonymous users can insert messages"
  ON messages FOR INSERT
  TO anon
  WITH CHECK (true);

-- Client Profiles Table: Add UPDATE policy for anonymous users
CREATE POLICY "Anonymous users can update profiles"
  ON client_profiles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
