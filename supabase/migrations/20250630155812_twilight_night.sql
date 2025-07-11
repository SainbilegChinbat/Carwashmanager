/*
  # Add Service Categories

  1. Changes
    - Add `category` column to `services` table
    - Set default category for existing services
    - Update views and functions to include category

  2. Security
    - No changes to RLS policies needed
*/

-- Add category column to services table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'category'
  ) THEN
    ALTER TABLE services ADD COLUMN category TEXT DEFAULT 'Ерөнхий';
  END IF;
END $$;

-- Update existing services to have a default category if they don't have one
UPDATE services 
SET category = 'Ерөнхий' 
WHERE category IS NULL OR category = '';