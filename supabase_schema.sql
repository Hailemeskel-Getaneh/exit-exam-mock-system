# EUEE Mock System – Supabase Setup SQL Script
#
# Run this script in the Supabase SQL Editor at:
# https://supabase.com/dashboard/project/<your-project-id>/sql
#
# This sets up the three required tables and row-level security policies.

-- 1. Students table
create table if not exists students (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,  -- For this mock system, stored as plaintext. For production use bcrypt.
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (open access for this mock demo)
alter table students enable row level security;
create policy "Allow all on students" on students for all using (true);

-- 2. Exam sessions table
create table if not exists exam_sessions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade not null,
  exam_name text not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  submitted boolean default false not null,
  time_remaining integer not null  -- stored in seconds
);

alter table exam_sessions enable row level security;
create policy "Allow all on exam_sessions" on exam_sessions for all using (true);

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
create policy "Allow all on saved_answers" on saved_answers for all using (true);
