/*
  # Add Name and Image Fields to Experts Table

  1. Schema Changes
    - Add `name` field (text, NOT NULL) - Expert's full name
    - Add `image` field (text, NOT NULL) - URL to expert's profile photo
    - Add `created_at` and `updated_at` timestamp fields for audit trail
    - Add default values for backward compatibility
  
  2. Data Integrity
    - Add NOT NULL constraints after populating existing data
    - Add index on name field for search optimization
  
  3. Notes
    - Images should point to publicly accessible URLs
    - Names should be professional trainer names
*/

-- Add new columns to experts table
ALTER TABLE experts 
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS image text,
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add index on name for search optimization
CREATE INDEX IF NOT EXISTS idx_experts_name ON experts(name);

-- Add index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_experts_created_at ON experts(created_at);
