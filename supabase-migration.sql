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

-- 3. Add tenant_domain for grouping scripts by customer
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.tables WHERE table_name='test_scripts') AND NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='test_scripts' and column_name='tenant_domain') THEN
    ALTER TABLE test_scripts ADD COLUMN tenant_domain text;
  END IF;
END $$;

-- 4. Add creator_email for script creation attribution
DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.tables WHERE table_name='test_scripts') AND NOT EXISTS(SELECT * FROM information_schema.columns WHERE table_name='test_scripts' and column_name='creator_email') THEN
    ALTER TABLE test_scripts ADD COLUMN creator_email text;
  END IF;
END $$;

-- 5. Create support_notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS support_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tester_email text NOT NULL,
  type text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT now()
);

DO $$
BEGIN
  IF EXISTS(SELECT * FROM information_schema.tables WHERE table_name='support_notifications') THEN
    ALTER TABLE support_notifications ENABLE ROW LEVEL SECURITY;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all select' AND tablename = 'support_notifications') THEN
        CREATE POLICY "Allow all select" ON support_notifications FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all insert' AND tablename = 'support_notifications') THEN
        CREATE POLICY "Allow all insert" ON support_notifications FOR INSERT WITH CHECK (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Allow all update' AND tablename = 'support_notifications') THEN
        CREATE POLICY "Allow all update" ON support_notifications FOR UPDATE USING (true);
    END IF;
  END IF;
END $$;

