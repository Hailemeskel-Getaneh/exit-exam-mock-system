import { createClient } from "@supabase/supabase-js";

// Check if we have Env variables configured
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export const isSupabaseConfigured = supabaseUrl !== "" && supabaseAnonKey !== "";

// Helper for Mock Database (LocalStorage based)
const getLocalStorageData = <T>(key: string, defaultValue: T): T => {
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : defaultValue;
};

const setLocalStorageData = (key: string, data: any) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Types corresponding to our DB schema
export interface Student {
  id: string;
  username: string;
  created_at: string;
}

export interface ExamSession {
  id: string;
  student_id: string;
  exam_name: string;
  started_at: string;
  ended_at: string | null;
  submitted: boolean;
  time_remaining: number; // in seconds
}

export interface SavedAnswer {
  id: string;
  session_id: string;
  question_id: number;
  selected_option: string | null;
  flagged: boolean;
  updated_at: string;
}

// Mock database services
export const mockDb = {
  students: {
    async register(username: string): Promise<Student> {
      const students = getLocalStorageData<any[]>("mock_students", []);
      if (students.some(s => s.username.toLowerCase() === username.toLowerCase())) {
        throw new Error("Username already exists");
      }
      const newStudent: Student = {
        id: Math.random().toString(36).substring(2, 11),
        username,
        created_at: new Date().toISOString()
      };
      students.push(newStudent);
      setLocalStorageData("mock_students", students);
      return newStudent;
    },
    async login(username: string): Promise<Student> {
      const students = getLocalStorageData<any[]>("mock_students", []);
      const student = students.find(s => s.username.toLowerCase() === username.toLowerCase());
      if (!student) {
        throw new Error("Student not found. Please register first.");
      }
      return student;
    }
  },
  sessions: {
    async create(studentId: string, examName: string, durationSeconds: number): Promise<ExamSession> {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      const newSession: ExamSession = {
        id: Math.random().toString(36).substring(2, 11),
        student_id: studentId,
        exam_name: examName,
        started_at: new Date().toISOString(),
        ended_at: null,
        submitted: false,
        time_remaining: durationSeconds
      };
      sessions.push(newSession);
      setLocalStorageData("mock_exam_sessions", sessions);
      return newSession;
    },
    async get(sessionId: string): Promise<ExamSession | null> {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      return sessions.find(s => s.id === sessionId) || null;
    },
    async updateTime(sessionId: string, timeRemaining: number): Promise<void> {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.time_remaining = timeRemaining;
        setLocalStorageData("mock_exam_sessions", sessions);
      }
    },
    async submit(sessionId: string): Promise<ExamSession> {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      const session = sessions.find(s => s.id === sessionId);
      if (!session) throw new Error("Session not found");
      session.submitted = true;
      session.ended_at = new Date().toISOString();
      setLocalStorageData("mock_exam_sessions", sessions);
      return session;
    }
  },
  answers: {
    async save(sessionId: string, questionId: number, selectedOption: string | null, flagged: boolean): Promise<SavedAnswer> {
      const answers = getLocalStorageData<SavedAnswer[]>("mock_saved_answers", []);
      const existingIdx = answers.findIndex(a => a.session_id === sessionId && a.question_id === questionId);
      
      const answerData: SavedAnswer = {
        id: existingIdx >= 0 ? answers[existingIdx].id : Math.random().toString(36).substring(2, 11),
        session_id: sessionId,
        question_id: questionId,
        selected_option: selectedOption,
        flagged: flagged,
        updated_at: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        answers[existingIdx] = answerData;
      } else {
        answers.push(answerData);
      }
      setLocalStorageData("mock_saved_answers", answers);
      return answerData;
    },
    async getForSession(sessionId: string): Promise<SavedAnswer[]> {
      const answers = getLocalStorageData<SavedAnswer[]>("mock_saved_answers", []);
      return answers.filter(a => a.session_id === sessionId);
    }
  }
};

// Main Export Client
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Unified API calls that switch between Supabase and Local Storage Mock
export const dbService = {
  async registerStudent(username: string): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      // For mock purposes, we register students in a custom "students" table
      // To keep it simple, we do a upsert or insert. Let's insert.
      const { data, error } = await supabase
        .from("students")
        .insert([{ username, password: "mock_password" }])
        .select()
        .single();
      
      if (error) {
        if (error.code === "23505") {
          throw new Error("Username already exists");
        }
        throw new Error(error.message);
      }
      return data;
    } else {
      return mockDb.students.register(username);
    }
  },

  async loginStudent(username: string): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("students")
        .select()
        .eq("username", username)
        .maybeSingle();
      
      if (error) throw new Error(error.message);
      if (!data) throw new Error("Student not found. Please register first.");
      return data;
    } else {
      return mockDb.students.login(username);
    }
  },

  async createSession(studentId: string, examName: string, durationSeconds: number): Promise<ExamSession> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("exam_sessions")
        .insert([{ student_id: studentId, exam_name: examName, time_remaining: durationSeconds }])
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    } else {
      return mockDb.sessions.create(studentId, examName, durationSeconds);
    }
  },

  async updateSessionTime(sessionId: string, timeRemaining: number): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      await supabase
        .from("exam_sessions")
        .update({ time_remaining: timeRemaining })
        .eq("id", sessionId);
    } else {
      await mockDb.sessions.updateTime(sessionId, timeRemaining);
    }
  },

  async submitSession(sessionId: string): Promise<ExamSession> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("exam_sessions")
        .update({ submitted: true, ended_at: new Date().toISOString() })
        .eq("id", sessionId)
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    } else {
      return mockDb.sessions.submit(sessionId);
    }
  },

  async saveAnswer(sessionId: string, questionId: number, selectedOption: string | null, flagged: boolean): Promise<SavedAnswer> {
    if (isSupabaseConfigured && supabase) {
      // Upsert answer
      const { data, error } = await supabase
        .from("saved_answers")
        .upsert(
          { session_id: sessionId, question_id: questionId, selected_option: selectedOption, flagged },
          { onConflict: "session_id,question_id" }
        )
        .select()
        .single();
      
      if (error) throw new Error(error.message);
      return data;
    } else {
      return mockDb.answers.save(sessionId, questionId, selectedOption, flagged);
    }
  },

  async getAnswers(sessionId: string): Promise<SavedAnswer[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("saved_answers")
        .select()
        .eq("session_id", sessionId);
      
      if (error) throw new Error(error.message);
      return data || [];
    } else {
      return mockDb.answers.getForSession(sessionId);
    }
  }
};
