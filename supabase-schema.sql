-- Run this completely in the Supabase SQL Editor

CREATE TABLE test_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text DEFAULT 'General',
  assignee_emails text[],
  order_index int DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE test_script_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES test_scripts(id) ON DELETE CASCADE,
  section text NOT NULL,
  instruction text NOT NULL,
  media_url text,
  notes text,
  test_data text,
  linked_step_id uuid,
  order_index int NOT NULL
);

CREATE TABLE test_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id uuid REFERENCES test_scripts(id) ON DELETE CASCADE,
  tester_email text NOT NULL,
  rating int,
  feedback text,
  status text NOT NULL CHECK (status IN ('in_progress', 'completed')),
  total_steps int,
  passed_steps int,
  failed_steps int,
  created_at timestamp with time zone DEFAULT now(),
  completed_at timestamp with time zone
);

CREATE TABLE test_execution_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id uuid REFERENCES test_executions(id) ON DELETE CASCADE,
  step_id uuid REFERENCES test_script_steps(id) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('not_started', 'pass', 'fail')),
  comments text,
  uploaded_media_url text,
  UNIQUE(execution_id, step_id)
);

-- Set up storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Enable RLS and create open policies to allow from anywhere for this test
ALTER TABLE test_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_script_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_execution_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all select" ON test_scripts FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON test_scripts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON test_scripts FOR UPDATE USING (true);

CREATE POLICY "Allow all select" ON test_script_steps FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON test_script_steps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON test_script_steps FOR UPDATE USING (true);
CREATE POLICY "Allow all delete" ON test_script_steps FOR DELETE USING (true);

CREATE POLICY "Allow all select" ON test_executions FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON test_executions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON test_executions FOR UPDATE USING (true);

CREATE POLICY "Allow all select" ON test_execution_steps FOR SELECT USING (true);
CREATE POLICY "Allow all insert" ON test_execution_steps FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all update" ON test_execution_steps FOR UPDATE USING (true);

CREATE POLICY "Allow all media select" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Allow all media insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
