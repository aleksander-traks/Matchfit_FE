/*
  # Fix Match Results Table and Convert Fields to Arrays

  1. Match Results Fixes
    - Remove duplicate entries (keep most recent)
    - Add unique constraint on (client_profile_id, expert_id)
    - This prevents duplicate matches from being created

  2. Client Profiles Array Conversions
    - Convert living_area from text to text[]
    - Convert monthly_budget from text to text[]
    - Convert availability from text to text[]
    - Convert cooperation from text to text[]
    - Safely handles existing data by converting single values to arrays

  3. Why These Changes
    - Unique constraint enables proper upsert behavior
    - Array fields allow multiple selections (cities, budgets, days, formats)
    - Better data model matches user needs
*/

-- Step 1: Clean up duplicate match_results entries
-- Keep only the most recent match for each client-expert pair
DELETE FROM match_results a
USING match_results b
WHERE a.id < b.id
  AND a.client_profile_id = b.client_profile_id
  AND a.expert_id = b.expert_id;

-- Step 2: Add unique constraint to prevent future duplicates
ALTER TABLE match_results
  ADD CONSTRAINT match_results_client_expert_unique
  UNIQUE (client_profile_id, expert_id);

-- Step 3: Convert client_profiles fields to arrays
ALTER TABLE client_profiles
  ALTER COLUMN living_area TYPE text[]
    USING CASE
      WHEN living_area IS NULL THEN NULL
      WHEN living_area = '' THEN ARRAY[]::text[]
      ELSE ARRAY[living_area]
    END,
  ALTER COLUMN monthly_budget TYPE text[]
    USING CASE
      WHEN monthly_budget IS NULL THEN NULL
      WHEN monthly_budget = '' THEN ARRAY[]::text[]
      ELSE ARRAY[monthly_budget]
    END,
  ALTER COLUMN availability TYPE text[]
    USING CASE
      WHEN availability IS NULL THEN NULL
      WHEN availability = '' THEN ARRAY[]::text[]
      ELSE ARRAY[availability]
    END,
  ALTER COLUMN cooperation TYPE text[]
    USING CASE
      WHEN cooperation IS NULL THEN NULL
      WHEN cooperation = '' THEN ARRAY[]::text[]
      ELSE ARRAY[cooperation]
    END;
