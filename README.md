# Ethiopian University Exit Exam Mock System

A high-fidelity, full-stack simulation of the Ethiopian University Exit Examination (EUEE) portal, built to give students a realistic practice experience — from typing the website URL in a browser to submitting their final answers.

## ✨ Features

- 🖥️ **Simulated Browser Shell** — opens with a Chrome-like browser with address bar, tabs, and a fake Google search engine.
- 🔍 **Search Results Page** — students can search for "exit exam portal" and click through to the portal.
- 📝 **Student Registration & Login** — create a username/password pair and log in.
- 📋 **Exam Dashboard** — lists available model exams by department.
- ⏱️ **Full Moodle-Replica Exam Workspace** — faithful reproduction of the Moodle quiz UI:
  - Floating red countdown timer
  - Left question status card (Not answered / Answered / Marked out of X)
  - Light blue question container with radio-button MCQ options
  - Flag question toggle with visual flag indicator
  - Quiz Navigation sidebar with numbered grid blocks (grey = unanswered, bottom-shaded = answered, red corner = flagged, thick border = current)
  - Previous/Next page navigation buttons
  - Auto-save on every answer selection
- 📊 **Submission Summary** — review answered/unanswered questions before final submit.
- 🎉 **Final Receipt** — confetti celebration, score display, downloadable .txt receipt.
- 💾 **Dual DB mode** — works offline with localStorage fallback; plug in Supabase credentials for live data persistence.

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/Hailemeskel-Getaneh/exit-exam-mock-system.git
cd exit-exam-mock-system
```

### 2. Install dependencies

```bash
npm install
```

### 3. (Optional) Configure Supabase

Copy `.env.example` to `.env.local` and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Without Supabase the app runs fully in local storage mode — no setup needed.

### 4. Run the dev server

```bash
npm run dev
```

Open your browser at `http://localhost:5173`

## 🌐 Deploying to Vercel (Free)

1. Push your code to GitHub (already done).
2. Go to [vercel.com](https://vercel.com) → **New Project** → import `exit-exam-mock-system`.
3. Set **Framework Preset** to **Vite**.
4. Add environment variables (if using Supabase):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy** — your mock portal will be live at a public URL within minutes!

## 🗄️ Supabase Database Setup (Optional)

If you want live data persistence across different devices, create a free project at [supabase.com](https://supabase.com) and run this SQL in the **SQL Editor**:

```sql
-- Students table
create table students (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Exam sessions table
create table exam_sessions (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references students(id) on delete cascade not null,
  exam_name text not null,
  started_at timestamp with time zone default timezone('utc'::text, now()) not null,
  ended_at timestamp with time zone,
  submitted boolean default false not null,
  time_remaining integer not null
);

-- Saved answers table
create table saved_answers (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references exam_sessions(id) on delete cascade not null,
  question_id integer not null,
  selected_option text,
  flagged boolean default false not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (session_id, question_id)
);
```

## 📁 Project Structure

```
src/
├── components/
│   ├── BrowserShell.tsx     # Simulated Chrome browser with URL bar & search
│   └── ExamWorkspace.tsx    # Full Moodle quiz replica
├── data/
│   └── mockQuestions.ts     # Pre-loaded MCQ questions (Mech Eng + CS)
├── supabaseClient.ts        # DB service with Supabase & localStorage fallback
├── App.tsx                  # Main app router and state machine
├── index.css                # Complete custom stylesheet
└── main.tsx                 # React entry point
```

## 🛠️ Tech Stack

- **React 19** + **TypeScript** + **Vite 8**
- **Supabase** (optional, for live database)
- **lucide-react** (icons)
- **canvas-confetti** (submission celebration)
- **Vanilla CSS** (custom, no Tailwind)

## 📄 License

MIT — open for educational use.
