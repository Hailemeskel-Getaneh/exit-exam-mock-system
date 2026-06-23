-- ============================================================
-- MIGRATION: Create Teachers Table
-- Run this in Supabase Dashboard > SQL Editor
-- Project URL: https://supabase.com/dashboard/project/bkxxhsfsgebowvxamhyo/sql
-- ============================================================

-- Create the teachers table
CREATE TABLE IF NOT EXISTS teachers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text UNIQUE NOT NULL,
  password text NOT NULL,
  department text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Create RLS policy (allow all for now)
DROP POLICY IF EXISTS "Allow all on teachers" ON teachers;
CREATE POLICY "Allow all on teachers" ON teachers FOR ALL USING (true) WITH CHECK (true);

-- Verify the table was created
SELECT 'teachers table created successfully!' AS status;
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'teachers' ORDER BY ordinal_position;
