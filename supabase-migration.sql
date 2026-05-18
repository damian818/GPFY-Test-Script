-- Supabase Database Migration
-- Run these commands in your Supabase SQL Editor to apply the latest changes

-- 1. Migrate assignee_email to an array column if it exists
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.columns WHERE table_name='test_scripts' and column_name='assignee_email') THEN
    ALTER TABLE test_scripts RENAME COLUMN assignee_email TO _temp_email;
    ALTER TABLE test_scripts ADD COLUMN assignee_emails text[];
    UPDATE test_scripts SET assignee_emails = ARRAY[_temp_email] WHERE _temp_email IS NOT NULL AND _temp_email != '';
    ALTER TABLE test_scripts DROP COLUMN _temp_email;
  END IF;
END $$;

-- 2. Add order_index for custom script ordering if it doesn't exist AND table exists
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.tables WHERE table_name='test_scripts') AND NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='test_scripts' and column_name='order_index') THEN
    ALTER TABLE test_scripts ADD COLUMN order_index int DEFAULT 0;
  END IF;
END $$;

