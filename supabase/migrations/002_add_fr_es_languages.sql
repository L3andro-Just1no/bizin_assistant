-- Add French and Spanish language support to sessions table
-- Drop the old constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_language_check;

-- Add new constraint with all 4 languages
ALTER TABLE sessions ADD CONSTRAINT sessions_language_check 
  CHECK (language IN ('pt', 'en', 'fr', 'es'));

-- Update any NULL values to 'pt'
UPDATE sessions SET language = 'pt' WHERE language IS NULL;

