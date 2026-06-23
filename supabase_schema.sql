-- ============================================================
-- College Online Exam System - Supabase Database Setup
-- Run this entire script in: Supabase Dashboard > SQL Editor
-- Project Setup
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

-- ============================================================

-- 2. Exams table (NEW)
create table if not exists exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  department text not null,
  duration_minutes integer not null,
  passcode text not null,
  description text,
  is_active boolean default true not null,
  available_from timestamp with time zone,
  available_until timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table exams enable row level security;
drop policy if exists "Allow all on exams" on exams;
create policy "Allow all on exams" on exams for all using (true) with check (true);

-- ============================================================

-- 3. Questions table (NEW)
create table if not exists questions (
  id serial primary key,
  exam_id uuid references exams(id) on delete cascade not null,
  text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer text not null, -- 'a', 'b', 'c', or 'd'
  points double precision not null default 1.0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table questions enable row level security;
drop policy if exists "Allow all on questions" on questions;
create policy "Allow all on questions" on questions for all using (true) with check (true);

-- ============================================================

-- 3.5 Teachers table (NEW)
create table if not exists teachers (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  department text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table teachers enable row level security;
drop policy if exists "Allow all on teachers" on teachers;
create policy "Allow all on teachers" on teachers for all using (true) with check (true);

-- ============================================================

-- 4. Admins table (NEW)
create table if not exists admins (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table admins enable row level security;
drop policy if exists "Allow all on admins" on admins;
create policy "Allow all on admins" on admins for all using (true) with check (true);

-- Seed a default admin if none exists
insert into admins (username, password)
values ('admin', 'admin')
on conflict (username) do nothing;

-- ============================================================

-- 4.5 Departments table (NEW)
create table if not exists departments (
  id uuid default gen_random_uuid() primary key,
  name text unique not null,
  description text,
  head text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table departments enable row level security;
drop policy if exists "Allow all on departments" on departments;
create policy "Allow all on departments" on departments for all using (true) with check (true);

-- Seed default departments if none exists
insert into departments (name, description, head)
values 
  ('Information Technology', 'Computing, networks, and software systems', ''),
  ('Mathematics', 'Pure and applied mathematics', ''),
  ('General Science', 'Physics, chemistry, and biology', ''),
  ('English', 'English language and literature', '')
on conflict (name) do nothing;

-- ============================================================

-- 5. Exam sessions table
create table if not exists exam_sessions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade not null,
  exam_name text not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  submitted boolean default false not null,
  time_remaining integer not null,
  total_duration integer not null default 10800,
  exam_id uuid references exams(id) on delete cascade -- NEW: optional link to exams table
);

alter table exam_sessions enable row level security;

drop policy if exists "Allow all on exam_sessions" on exam_sessions;
create policy "Allow all on exam_sessions" on exam_sessions for all using (true) with check (true);

-- ============================================================

-- 6. Saved answers table
create table if not exists saved_answers (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references exam_sessions(id) on delete cascade not null,
  question_id integer not null, -- references questions(id) or mock integer ID
  selected_option text,
  flagged boolean default false not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (session_id, question_id)
);

alter table saved_answers enable row level security;

drop policy if exists "Allow all on saved_answers" on saved_answers;
create policy "Allow all on saved_answers" on saved_answers for all using (true) with check (true);

-- ============================================================
-- MIGRATION COMMANDS FOR EXISTING DATABASES:
-- RUN THESE IN YOUR SUPABASE SQL EDITOR TO UPGRADE TO THE LATEST VERSION
--
-- 1. Add scheduling columns to exams table:
-- ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true NOT null;
-- ALTER TABLE exams ADD COLUMN IF NOT EXISTS available_from timestamp with time zone;
-- ALTER TABLE exams ADD COLUMN IF NOT EXISTS available_until timestamp with time zone;
--
-- 2. Add exam_id to exam_sessions table:
-- ALTER TABLE exam_sessions ADD COLUMN IF NOT EXISTS exam_id uuid REFERENCES exams(id) ON DELETE CASCADE;
--
-- 3. Create departments table:
-- CREATE TABLE IF NOT EXISTS departments (
--   id uuid default gen_random_uuid() primary key,
--   name text unique not null,
--   description text,
--   head text,
--   created_at timestamp with time zone default timezone('utc'::text, now()) not null
-- );
--
-- ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Allow all on departments" ON departments;
-- CREATE POLICY "Allow all on departments" ON departments FOR ALL USING (true) WITH CHECK (true);
--
-- 4. Seed default departments:
-- INSERT INTO departments (name, description, head)
-- VALUES 
--   ('Information Technology', 'Computing, networks, and software systems', ''),
--   ('Mathematics', 'Pure and applied mathematics', ''),
--   ('General Science', 'Physics, chemistry, and biology', ''),
--   ('English', 'English language and literature', '')
-- ON CONFLICT (name) DO NOTHING;
-- ============================================================

-- Verify tables were created:
select table_name from information_schema.tables
where table_schema = 'public'
order by table_name;
