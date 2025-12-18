# Database Migration - French & Spanish Support

## ⚠️ Important: Run This Migration

The database currently only supports **Portuguese** and **English**. To enable **French** and **Spanish** sessions, you need to run the migration.

## How to Run the Migration

### Option 1: Supabase Dashboard (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com/)
2. Select your project
3. Click **SQL Editor** in the sidebar
4. Click **+ New query**
5. Copy and paste this SQL:

```sql
-- Add French and Spanish language support to sessions table
-- Drop the old constraint
ALTER TABLE sessions DROP CONSTRAINT IF EXISTS sessions_language_check;

-- Add new constraint with all 4 languages
ALTER TABLE sessions ADD CONSTRAINT sessions_language_check 
  CHECK (language IN ('pt', 'en', 'fr', 'es'));

-- Update any NULL values to 'pt'
UPDATE sessions SET language = 'pt' WHERE language IS NULL;
```

6. Click **Run** (or press Cmd/Ctrl + Enter)
7. ✅ Done! You should see: "Success. No rows returned"

### Option 2: Supabase CLI

If you have Supabase CLI installed:

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Apply the migration
supabase db push
```

## What This Migration Does

- **Removes** the old language constraint that only allowed `pt` and `en`
- **Adds** a new constraint allowing: `pt`, `en`, `fr`, `es`
- **Updates** any NULL language values to default `pt`

## Testing After Migration

1. Change your site language to **French**
2. Open the widget and create a new session
3. You should see: "Bonjour! Comment puis-je vous aider aujourd'hui?"
4. ✅ No more 500 errors!

## Current Status

- ✅ API routes support all 4 languages
- ✅ Widget UI translated to all 4 languages
- ✅ System prompts for all 4 languages
- ⚠️ Database constraint needs update (run this migration!)

After running this migration, all 4 languages will work perfectly! 🚀🌍

