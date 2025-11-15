/*
  # Rename Match Results Reason Columns

  ## Overview
  This migration fixes a column name mismatch between the database schema and application code.
  The columns reason1 and reason2 are being renamed to reason_1 and reason_2 to match the
  expected naming convention used throughout the application code.

  ## Changes Made

  ### Match Results Table
  - **Renamed**: `reason1` column to `reason_1`
  - **Renamed**: `reason2` column to `reason_2`

  ## Notes
  - This migration preserves all existing data
  - The rename operation is safe and non-destructive
  - Application code already expects the underscore naming convention
*/

-- Rename reason1 to reason_1
ALTER TABLE match_results 
  RENAME COLUMN reason1 TO reason_1;

-- Rename reason2 to reason_2
ALTER TABLE match_results 
  RENAME COLUMN reason2 TO reason_2;
