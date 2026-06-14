-- ============================================================
-- EUEE Mock System - Supabase Database Setup
-- Run this entire script in: Supabase Dashboard > SQL Editor
-- Project: bkxxhsfsgebowvxamhyo
-- ============================================================

-- 1. Students table
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  department text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table students enable row level security;

-- Drop existing policies if any (safe to re-run)
drop policy if exists "Allow all on students" on students;
create policy "Allow all on students" on students for all using (true) with check (true);

-- MIGRATION NOTE FOR EXISTING USERS:
-- ALTER TABLE students ADD COLUMN IF NOT EXISTS department text;
-- UPDATE students SET department = 'Computer Science' WHERE department IS NULL;
-- ALTER TABLE students ALTER COLUMN department SET NOT NULL;

-- ============================================================

-- 2. Exam sessions table
create table if not exists exam_sessions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade not null,
  exam_name text not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  submitted boolean default false not null,
  time_remaining integer not null,
  -- total_duration stores the full exam length so we can always compute
  -- real time remaining as: total_duration - (now - started_at)
  -- This ensures the timer runs even when the student is away from the browser.
  total_duration integer not null default 10800
);

alter table exam_sessions enable row level security;

drop policy if exists "Allow all on exam_sessions" on exam_sessions;
create policy "Allow all on exam_sessions" on exam_sessions for all using (true) with check (true);

-- ============================================================
-- MIGRATION: If you already ran the old schema, run this once:
-- alter table exam_sessions add column if not exists total_duration integer not null default 10800;
-- ============================================================

-- ============================================================

-- 3. Saved answers table
create table if not exists saved_answers (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references exam_sessions(id) on delete cascade not null,
  question_id integer not null,
  selected_option text,
  flagged boolean default false not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (session_id, question_id)
);

alter table saved_answers enable row level security;

drop policy if exists "Allow all on saved_answers" on saved_answers;
create policy "Allow all on saved_answers" on saved_answers for all using (true) with check (true);

-- ============================================================
-- Verify tables were created:
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
