/*
  # Create feedback table

  ## Summary
  Creates a table to store user feedback submitted via the feedback button widget
  that appears on all pages of the application.

  ## New Tables

  ### `feedback`
  Stores feedback submissions from users (both anonymous and identified).

  Columns:
  - `id` (uuid, primary key) - unique identifier
  - `page` (text) - the page/route where feedback was submitted
  - `rating` (integer) - star rating from 1 to 5
  - `message` (text, optional) - free-text feedback message
  - `client_profile_id` (uuid, optional) - reference to client profile if user is identified
  - `created_at` (timestamptz) - timestamp of submission

  ## Security

  ### RLS
  - RLS enabled on `feedback` table
  - Anonymous and authenticated users can INSERT feedback
  - No SELECT policy for regular users (only service role can read)

  ## Notes
  1. The `client_profile_id` is optional so anonymous users can still submit feedback
  2. The `page` column captures which route the feedback was submitted from
  3. Rating is constrained to 1-5 via a check constraint
*/

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page text NOT NULL DEFAULT '',
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  message text DEFAULT '',
  client_profile_id uuid REFERENCES client_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit feedback"
  ON feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
