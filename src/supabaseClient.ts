import { createClient } from "@supabase/supabase-js";
import { mockExams, type Exam, type Question } from "./data/mockQuestions";
import {
  hashPassword,
  validatePassword,
  validateUsername,
  sanitizeInput,
  checkLoginAttempts,
  recordLoginAttempt,
  createSession,
  validateExamImportRow,
  generateSecurePassword
} from "./utils/security";

export type { Exam, Question };

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
  full_name?: string;
  department: string;
  created_at: string;
  must_change_password?: boolean;
}

export interface Admin {
  id: string;
  username: string;
  created_at: string;
}

export interface Teacher {
  id: string;
  username: string;
  department: string;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  head?: string;
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
  total_duration: number; // full exam duration in seconds
  exam_id?: string;
  student?: {
    username: string;
    department: string;
  };
}

/**
 * Computes the true time remaining using the stored time_remaining field
 * as the source of truth, NOT the device clock vs server started_at.
 *
 * Why: If the student's device clock differs from the server clock (wrong
 * timezone, wrong date/time settings, etc.), using Date.now() - started_at
 * could produce a huge elapsed value and instantly show "Time is Up".
 *
 * Instead we trust the `time_remaining` value that was last saved by the
 * server, and start counting down from there once the session is loaded.
 * The ExamWorkspace component handles the per-second countdown locally.
 */
// FIXED — uses server-stored time_remaining, not device clock
export const computeRealTimeRemaining = (session: ExamSession): number => {
  // Use stored time_remaining as the baseline (server-side source of truth)
  return Math.max(0, session.time_remaining);
};

export interface SavedAnswer {
  id: string;
  session_id: string;
  question_id: number;
  selected_option: string | null;
  flagged: boolean;
  updated_at: string;
}

// Seeding function for LocalStorage to guarantee exams exist
const initializeMockExams = (): Exam[] => {
  let exams = getLocalStorageData<Exam[]>("mock_exams", []);
  if (exams.length === 0) {
    exams = JSON.parse(JSON.stringify(mockExams)); // Deep copy mockExams
    setLocalStorageData("mock_exams", exams);
  }
  return exams;
};

// Default departments seed
const defaultDepartments: Department[] = [
  { id: "dept-it", name: "Information Technology", description: "Computing, networks, and software systems", head: "", created_at: new Date().toISOString() },
  { id: "dept-math", name: "Mathematics", description: "Pure and applied mathematics", head: "", created_at: new Date().toISOString() },
  { id: "dept-sci", name: "General Science", description: "Physics, chemistry, and biology", head: "", created_at: new Date().toISOString() },
  { id: "dept-eng", name: "English", description: "English language and literature", head: "", created_at: new Date().toISOString() },
];

const initializeMockDepartments = (): Department[] => {
  let depts = getLocalStorageData<Department[]>("mock_departments", []);
  if (depts.length === 0) {
    depts = JSON.parse(JSON.stringify(defaultDepartments));
    setLocalStorageData("mock_departments", depts);
  }
  return depts;
};

/**
 * Initialize mock admins with secure password hashing
 * No default admin is created - admins must be created manually through secure process
 */
const initializeMockAdmins = async () => {
  let admins = getLocalStorageData<any[]>("mock_admins", []);
  // Only create initial admin if NONE exist (first-run setup)
  if (admins.length === 0) {
    const initialPassword = generateSecurePassword();
    const hashedPassword = await hashPassword(initialPassword);
    admins = [{
      id: "admin-root",
      username: "admin",
      password: hashedPassword,
      created_at: new Date().toISOString(),
      initialized: true
    }];
    setLocalStorageData("mock_admins", admins);
    // Store the initial password temporarily (in practice, show in UI once)
    console.warn(`[SETUP] Initial admin created with temporary password. Store safely: ${initialPassword}`);
  }
  return admins;
};

// Mock database services (LocalStorage fallback)
export const mockDb = {
  students: {
    async register(username: string, password: string, department: string, fullName?: string): Promise<Student> {
      // Validate inputs
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        throw new Error(usernameValidation.errors.join("; "));
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join("; "));
      }

      const students = getLocalStorageData<any[]>("mock_students", []);
      if (students.some(s => s.username.toLowerCase() === username.toLowerCase())) {
        throw new Error("Username already exists");
      }

      const hashedPassword = await hashPassword(password);
      const newStudent = {
        id: Math.random().toString(36).substring(2, 11),
        username: sanitizeInput(username),
        full_name: fullName ? sanitizeInput(fullName) : sanitizeInput(username),
        password: hashedPassword,
        department: sanitizeInput(department),
        created_at: new Date().toISOString()
      };
      students.push(newStudent);
      setLocalStorageData("mock_students", students);

      const { password: _, ...studentData } = newStudent;
      return studentData;
    },
    async login(username: string, password?: string): Promise<Student> {
      // Check rate limiting
      const rateLimitCheck = checkLoginAttempts(username);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.message || "Too many login attempts");
      }

      const students = getLocalStorageData<any[]>("mock_students", []);
      const student = students.find(s => s.username.toLowerCase() === username.toLowerCase());
      
      if (!student) {
        // Don't record as failed attempt — user simply doesn't exist as student
        throw new Error("Student not found. Please register first.");
      }

      if (password && student.password !== await hashPassword(password)) {
        recordLoginAttempt(username, false);
        throw new Error("Incorrect password. Please try again.");
      }

      // Record successful login
      recordLoginAttempt(username, true);
      const sessionId = `session-${username}-${Date.now()}`;
      createSession(sessionId);

      const { password: _, ...studentData } = student;
      return studentData;
    },
    async list(): Promise<Student[]> {
      const students = getLocalStorageData<any[]>("mock_students", []);
      return students.map(({ password: _, ...s }) => s);
    },
    async delete(id: string): Promise<void> {
      let students = getLocalStorageData<any[]>("mock_students", []);
      students = students.filter(s => s.id !== id);
      setLocalStorageData("mock_students", students);

      // Clean up sessions
      let sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      const studentSessions = sessions.filter(s => s.student_id === id);
      sessions = sessions.filter(s => s.student_id !== id);
      setLocalStorageData("mock_exam_sessions", sessions);

      // Clean up answers
      let answers = getLocalStorageData<SavedAnswer[]>("mock_saved_answers", []);
      const sessionIds = studentSessions.map(s => s.id);
      answers = answers.filter(a => !sessionIds.includes(a.session_id));
      setLocalStorageData("mock_saved_answers", answers);
    },
    async createByAdmin(username: string, tempPassword: string, department: string, fullName: string): Promise<Student> {
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) throw new Error(usernameValidation.errors.join("; "));

      const students = getLocalStorageData<any[]>("mock_students", []);
      if (students.some(s => s.username.toLowerCase() === username.toLowerCase())) {
        throw new Error("Username already exists");
      }

      const hashedPassword = await hashPassword(tempPassword);
      const newStudent = {
        id: Math.random().toString(36).substring(2, 11),
        username: sanitizeInput(username),
        full_name: sanitizeInput(fullName),
        password: hashedPassword,
        department: sanitizeInput(department),
        must_change_password: true,
        created_at: new Date().toISOString()
      };
      students.push(newStudent);
      setLocalStorageData("mock_students", students);
      const { password: _, ...studentData } = newStudent;
      return studentData;
    },
    async changePassword(id: string, currentPassword: string, newPassword: string): Promise<void> {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) throw new Error(passwordValidation.errors.join("; "));

      const students = getLocalStorageData<any[]>("mock_students", []);
      const student = students.find(s => s.id === id);
      if (!student) throw new Error("Student not found");

      if (student.password !== await hashPassword(currentPassword)) {
        throw new Error("Current password is incorrect");
      }

      student.password = await hashPassword(newPassword);
      student.must_change_password = false;
      setLocalStorageData("mock_students", students);
    },
    async adminResetPassword(id: string, newPassword: string): Promise<void> {
      const students = getLocalStorageData<any[]>("mock_students", []);
      const student = students.find(s => s.id === id);
      if (!student) throw new Error("Student not found");

      student.password = await hashPassword(newPassword);
      student.must_change_password = true;
      setLocalStorageData("mock_students", students);
    },
    async update(id: string, fullName: string, username: string, department: string): Promise<Student> {
      const students = getLocalStorageData<any[]>("mock_students", []);
      const idx = students.findIndex(s => s.id === id);
      if (idx === -1) throw new Error("Student not found");
      // Check username uniqueness if changed
      const duplicate = students.find(s => s.id !== id && s.username.toLowerCase() === username.toLowerCase());
      if (duplicate) throw new Error("Username already exists");
      students[idx] = { ...students[idx], full_name: sanitizeInput(fullName), username: sanitizeInput(username), department: sanitizeInput(department) };
      setLocalStorageData("mock_students", students);
      const { password: _, ...studentData } = students[idx];
      return studentData;
    }
  },
  teachers: {
    async register(username: string, password: string, department: string): Promise<Teacher> {
      // Validate inputs
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        throw new Error(usernameValidation.errors.join("; "));
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join("; "));
      }

      const teachers = getLocalStorageData<any[]>("mock_teachers", []);
      if (teachers.some(t => t.username.toLowerCase() === username.toLowerCase())) {
        throw new Error("Teacher username already exists");
      }

      const hashedPassword = await hashPassword(password);
      const newTeacher = {
        id: Math.random().toString(36).substring(2, 11),
        username: sanitizeInput(username),
        password: hashedPassword,
        department: sanitizeInput(department),
        created_at: new Date().toISOString()
      };
      teachers.push(newTeacher);
      setLocalStorageData("mock_teachers", teachers);

      const { password: _, ...teacherData } = newTeacher;
      return teacherData;
    },
    async login(username: string, password?: string): Promise<Teacher> {
      // Check rate limiting
      const rateLimitCheck = checkLoginAttempts(username);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.message || "Too many login attempts");
      }

      const teachers = getLocalStorageData<any[]>("mock_teachers", []);
      const teacher = teachers.find(t => t.username.toLowerCase() === username.toLowerCase());
      
      if (!teacher) {
        // Don't record as failed attempt — user simply doesn't exist as teacher
        throw new Error("Teacher not found.");
      }

      if (password && teacher.password !== await hashPassword(password)) {
        recordLoginAttempt(username, false);
        throw new Error("Incorrect password.");
      }

      // Record successful login
      recordLoginAttempt(username, true);
      const sessionId = `session-${username}-${Date.now()}`;
      createSession(sessionId);

      const { password: _, ...teacherData } = teacher;
      return teacherData;
    },
    async list(): Promise<Teacher[]> {
      const teachers = getLocalStorageData<any[]>("mock_teachers", []);
      return teachers.map(({ password: _, ...t }) => t);
    },
    async delete(id: string): Promise<void> {
      let teachers = getLocalStorageData<any[]>("mock_teachers", []);
      teachers = teachers.filter(t => t.id !== id);
      setLocalStorageData("mock_teachers", teachers);
    },
    async updatePassword(id: string, newPassword: string): Promise<void> {
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join("; "));
      }
      const teachers = getLocalStorageData<any[]>("mock_teachers", []);
      const teacher = teachers.find(t => t.id === id);
      if (!teacher) throw new Error("Teacher not found");
      const hashedPassword = await hashPassword(newPassword);
      teacher.password = hashedPassword;
      setLocalStorageData("mock_teachers", teachers);
    },
    async update(id: string, username: string, department: string): Promise<Teacher> {
      const teachers = getLocalStorageData<any[]>("mock_teachers", []);
      const idx = teachers.findIndex(t => t.id === id);
      if (idx === -1) throw new Error("Teacher not found");
      const duplicate = teachers.find(t => t.id !== id && t.username.toLowerCase() === username.toLowerCase());
      if (duplicate) throw new Error("Username already exists");
      teachers[idx] = { ...teachers[idx], username: sanitizeInput(username), department: sanitizeInput(department) };
      setLocalStorageData("mock_teachers", teachers);
      const { password: _, ...teacherData } = teachers[idx];
      return teacherData;
    }
  },
  exams: {
    async list(department?: string): Promise<Exam[]> {
      const exams = initializeMockExams();
      if (department) {
        return exams.filter(e => e.department.toLowerCase() === department.toLowerCase());
      }
      return exams;
    },
    async get(id: string): Promise<Exam | null> {
      const exams = initializeMockExams();
      return exams.find(e => e.id === id) || null;
    },
    async create(title: string, department: string, durationMinutes: number, passcode: string, description?: string): Promise<Exam> {
      const exams = initializeMockExams();
      const newExam: Exam = {
        id: Math.random().toString(36).substring(2, 11),
        title: sanitizeInput(title),
        department: sanitizeInput(department),
        durationMinutes,
        passcode: sanitizeInput(passcode),
        description: description ? sanitizeInput(description) : undefined,
        is_active: true,
        questions: []
      };
      exams.push(newExam);
      setLocalStorageData("mock_exams", exams);
      return newExam;
    },
    async update(id: string, examData: Partial<Omit<Exam, "id" | "questions">>): Promise<Exam> {
      const exams = initializeMockExams();
      const idx = exams.findIndex(e => e.id === id);
      if (idx === -1) throw new Error("Exam not found");
      
      // Sanitize input data
      const sanitizedData: Partial<Exam> = {};
      if (examData.title) sanitizedData.title = sanitizeInput(examData.title);
      if (examData.description) sanitizedData.description = sanitizeInput(examData.description);
      if (examData.passcode) sanitizedData.passcode = sanitizeInput(examData.passcode);
      if (examData.durationMinutes !== undefined) sanitizedData.durationMinutes = examData.durationMinutes;
      if (examData.is_active !== undefined) sanitizedData.is_active = examData.is_active;
      
      exams[idx] = { ...exams[idx], ...sanitizedData };
      setLocalStorageData("mock_exams", exams);
      return exams[idx];
    },
    async delete(id: string): Promise<void> {
      let exams = initializeMockExams();
      exams = exams.filter(e => e.id !== id);
      setLocalStorageData("mock_exams", exams);
    },
    async addQuestion(examId: string, text: string, options: Question["options"], correctAnswer: string, points: number): Promise<Question> {
      const exams = initializeMockExams();
      const exam = exams.find(e => e.id === examId);
      if (!exam) throw new Error("Exam not found");

      const newQuestion: Question = {
        id: Math.floor(Math.random() * 1000000) + 1,
        text: sanitizeInput(text),
        options: {
          a: sanitizeInput(options.a),
          b: sanitizeInput(options.b),
          c: sanitizeInput(options.c),
          d: sanitizeInput(options.d)
        },
        correctAnswer: sanitizeInput(correctAnswer),
        points
      };
      exam.questions.push(newQuestion);
      setLocalStorageData("mock_exams", exams);
      return newQuestion;
    },
    async updateQuestion(questionId: number, text?: string, options?: Question["options"], correctAnswer?: string, points?: number): Promise<Question> {
      const exams = initializeMockExams();
      let updatedQuestion: Question | null = null;

      for (const exam of exams) {
        const q = exam.questions.find(q => q.id === questionId);
        if (q) {
          if (text !== undefined) q.text = sanitizeInput(text);
          if (options !== undefined) {
            q.options = {
              a: sanitizeInput(options.a),
              b: sanitizeInput(options.b),
              c: sanitizeInput(options.c),
              d: sanitizeInput(options.d)
            };
          }
          if (correctAnswer !== undefined) q.correctAnswer = sanitizeInput(correctAnswer);
          if (points !== undefined) q.points = points;
          updatedQuestion = q;
          break;
        }
      }

      if (!updatedQuestion) throw new Error("Question not found");
      setLocalStorageData("mock_exams", exams);
      return updatedQuestion;
    },
    async deleteQuestion(questionId: number): Promise<void> {
      const exams = initializeMockExams();
      let found = false;
      for (const exam of exams) {
        const initialLen = exam.questions.length;
        exam.questions = exam.questions.filter(q => q.id !== questionId);
        if (exam.questions.length !== initialLen) {
          found = true;
          break;
        }
      }
      if (!found) throw new Error("Question not found");
      setLocalStorageData("mock_exams", exams);
    },
    async addQuestionsBulk(examId: string, questions: Array<{ text: string; options: Question["options"]; correctAnswer: string; points: number }>): Promise<Question[]> {
      const exams = initializeMockExams();
      const exam = exams.find(e => e.id === examId);
      if (!exam) throw new Error("Exam not found");

      const created: Question[] = [];
      for (const q of questions) {
        const newQuestion: Question = {
          id: Math.floor(Math.random() * 1000000) + 1,
          text: sanitizeInput(q.text),
          options: {
            a: sanitizeInput(q.options.a),
            b: sanitizeInput(q.options.b),
            c: sanitizeInput(q.options.c),
            d: sanitizeInput(q.options.d)
          },
          correctAnswer: sanitizeInput(q.correctAnswer),
          points: q.points
        };
        exam.questions.push(newQuestion);
        created.push(newQuestion);
      }
      setLocalStorageData("mock_exams", exams);
      return created;
    }
  },
  sessions: {
    async create(studentId: string, examName: string, durationSeconds: number, examId?: string): Promise<ExamSession> {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      const newSession: ExamSession = {
        id: Math.random().toString(36).substring(2, 11),
        student_id: studentId,
        exam_name: sanitizeInput(examName),
        started_at: new Date().toISOString(),
        ended_at: null,
        submitted: false,
        time_remaining: durationSeconds,
        total_duration: durationSeconds,
        exam_id: examId
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
    },
    async getActive(studentId: string): Promise<ExamSession | null> {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      const active = sessions
        .filter(s => s.student_id === studentId && !s.submitted)
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
      return active[0] || null;
    },
    async listAll(): Promise<ExamSession[]> {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      const students = getLocalStorageData<any[]>("mock_students", []);

      return sessions.map(s => {
        const student = students.find(st => st.id === s.student_id);
        return {
          ...s,
          student: student ? { username: student.username, department: student.department } : undefined
        };
      });
    },
    async addTime(sessionId: string, additionalSeconds: number): Promise<void> {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.total_duration += additionalSeconds;
        setLocalStorageData("mock_exam_sessions", sessions);
      }
    },
    async addTimeToAllActive(examName: string, additionalSeconds: number): Promise<void> {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      let updated = false;
      sessions.forEach(s => {
        if (s.exam_name === examName && !s.submitted) {
          s.total_duration += additionalSeconds;
          updated = true;
        }
      });
      if (updated) {
        setLocalStorageData("mock_exam_sessions", sessions);
      }
    }
  },
  departments: {
    async list(): Promise<Department[]> {
      return initializeMockDepartments();
    },
    async create(name: string, description?: string, head?: string): Promise<Department> {
      const depts = initializeMockDepartments();
      if (depts.some(d => d.name.toLowerCase() === name.toLowerCase())) {
        throw new Error("Department already exists");
      }
      const newDept: Department = {
        id: Math.random().toString(36).substring(2, 11),
        name: sanitizeInput(name),
        description: description ? sanitizeInput(description) : undefined,
        head: head ? sanitizeInput(head) : undefined,
        created_at: new Date().toISOString()
      };
      depts.push(newDept);
      setLocalStorageData("mock_departments", depts);
      return newDept;
    },
    async update(id: string, name: string, description?: string, head?: string): Promise<Department> {
      const depts = initializeMockDepartments();
      const idx = depts.findIndex(d => d.id === id);
      if (idx === -1) throw new Error("Department not found");
      depts[idx] = {
        ...depts[idx],
        name: sanitizeInput(name),
        description: description ? sanitizeInput(description) : undefined,
        head: head ? sanitizeInput(head) : undefined
      };
      setLocalStorageData("mock_departments", depts);
      return depts[idx];
    },
    async delete(id: string): Promise<void> {
      let depts = initializeMockDepartments();
      depts = depts.filter(d => d.id !== id);
      setLocalStorageData("mock_departments", depts);
    }
  },
  admins: {
    async list(): Promise<Admin[]> {
      const admins = await initializeMockAdmins();
      return admins.map(({ password: _, ...a }) => a);
    },
    async create(username: string, password: string): Promise<Admin> {
      // Validate inputs
      const usernameValidation = validateUsername(username);
      if (!usernameValidation.valid) {
        throw new Error(usernameValidation.errors.join("; "));
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join("; "));
      }

      const admins = await initializeMockAdmins();
      if (admins.some(a => a.username.toLowerCase() === username.toLowerCase())) {
        throw new Error("Admin username already exists");
      }

      const hashedPassword = await hashPassword(password);
      const newAdmin = {
        id: Math.random().toString(36).substring(2, 11),
        username: sanitizeInput(username),
        password: hashedPassword,
        created_at: new Date().toISOString()
      };
      admins.push(newAdmin);
      setLocalStorageData("mock_admins", admins);
      const { password: _, ...adminData } = newAdmin;
      return adminData;
    },
    async delete(id: string): Promise<void> {
      let admins = await initializeMockAdmins();
      admins = admins.filter(a => a.id !== id);
      setLocalStorageData("mock_admins", admins);
    },
    async updatePassword(id: string, newPassword: string): Promise<void> {
      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        throw new Error(passwordValidation.errors.join("; "));
      }

      const admins = await initializeMockAdmins();
      const admin = admins.find(a => a.id === id);
      if (!admin) throw new Error("Admin not found");

      const hashedPassword = await hashPassword(newPassword);
      admin.password = hashedPassword;
      setLocalStorageData("mock_admins", admins);
    },
    async login(username: string, password: string): Promise<Admin> {
      // Check rate limiting
      const rateLimitCheck = checkLoginAttempts(username);
      if (!rateLimitCheck.allowed) {
        throw new Error(rateLimitCheck.message || "Too many login attempts");
      }

      const admins = await initializeMockAdmins();
      const admin = admins.find(a => a.username.toLowerCase() === username.toLowerCase());
      
      if (!admin) {
        recordLoginAttempt(username, false);
        throw new Error("Admin not found");
      }

      if (admin.password !== await hashPassword(password)) {
        recordLoginAttempt(username, false);
        throw new Error("Incorrect password");
      }

      // Record successful login
      recordLoginAttempt(username, true);
      const sessionId = `session-${username}-${Date.now()}`;
      createSession(sessionId);

      const { password: _, ...adminData } = admin;
      return adminData;
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
        selected_option: selectedOption ? sanitizeInput(selectedOption) : null,
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

// Helper to seed Supabase database if empty
export const seedSupabaseExams = async () => {
  if (!isSupabaseConfigured || !supabase) return;
  try {
    const { count, error: countError } = await supabase
      .from("exams")
      .select("id", { count: "exact", head: true });

    if (countError) throw countError;

    if (count === 0) {
      console.log("Seeding default exams and questions to Supabase...");
      for (const mockExam of mockExams) {
        const { data: examData, error: examError } = await supabase
          .from("exams")
          .insert({
            id: mockExam.id,
            title: mockExam.title,
            department: mockExam.department,
            duration_minutes: mockExam.durationMinutes,
            passcode: mockExam.passcode,
            description: `Default college exam for ${mockExam.department}`
          })
          .select()
          .single();

        if (examError) throw examError;

        const questionsToInsert = mockExam.questions.map(q => ({
          exam_id: examData.id,
          text: q.text,
          option_a: q.options.a,
          option_b: q.options.b,
          option_c: q.options.c,
          option_d: q.options.d,
          correct_answer: q.correctAnswer,
          points: q.points
        }));

        const { error: qError } = await supabase.from("questions").insert(questionsToInsert);
        if (qError) throw qError;
      }
      console.log("Supabase seeding completed successfully.");
    }
  } catch (err) {
    console.error("Failed to seed Supabase database:", err);
  }
};

// Unified API calls that switch between Supabase and Local Storage Mock
export const dbService = {
  // Students & Admins Auth
  async registerStudent(username: string, password: string, department: string): Promise<Student> {
    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.errors.join("; "));
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join("; "));
    }

    if (isSupabaseConfigured && supabase) {
      const hashedPassword = await hashPassword(password);
      const { data, error } = await supabase
        .from("students")
        .insert([{ username: sanitizeInput(username), password: hashedPassword, department: sanitizeInput(department) }])
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
      return mockDb.students.register(username, password, department);
    }
  },

  async loginStudent(username: string, password?: string): Promise<Student> {
    // Check rate limiting
    const rateLimitCheck = checkLoginAttempts(username);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message || "Too many login attempts");
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("students")
          .select()
          .ilike("username", sanitizeInput(username))
          .maybeSingle();

        if (error) {
          recordLoginAttempt(username, false);
          throw new Error(error.message);
        }
        if (!data) {
          // Don't record as failed attempt — user simply doesn't exist as student
          throw new Error("Student not found. Please register first.");
        }
        if (password && data.password !== await hashPassword(password)) {
          recordLoginAttempt(username, false);
          throw new Error("Incorrect password. Please try again.");
        }
        recordLoginAttempt(username, true);
        return data;
      } else {
        return mockDb.students.login(username, password);
      }
    } catch (err) {
      throw err;
    }
  },

  async registerTeacher(username: string, password: string, department: string): Promise<Teacher> {
    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.errors.join("; "));
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join("; "));
    }

    if (isSupabaseConfigured && supabase) {
      const hashedPassword = await hashPassword(password);
      const { data, error } = await supabase
        .from("teachers")
        .insert([{ username: sanitizeInput(username), password: hashedPassword, department: sanitizeInput(department) }])
        .select()
        .single();

      if (error) {
        if (error.code === "PGRST205" || error.code === "42P01") {
          throw new Error("Teachers table not found. Please run the database migration SQL in Supabase SQL Editor.");
        }
        if (error.code === "23505") {
          throw new Error("Teacher username already exists");
        }
        throw new Error(error.message);
      }
      return data;
    } else {
      return mockDb.teachers.register(username, password, department);
    }
  },

  async loginTeacher(username: string, password?: string): Promise<Teacher> {
    // Check rate limiting
    const rateLimitCheck = checkLoginAttempts(username);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message || "Too many login attempts");
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("teachers")
          .select()
          .ilike("username", sanitizeInput(username))
          .maybeSingle();

        if (error) {
          recordLoginAttempt(username, false);
          throw new Error(error.message);
        }
        if (!data) {
          // Don't record as failed attempt — user simply doesn't exist as teacher
          throw new Error("Teacher not found.");
        }
        if (password && data.password !== await hashPassword(password)) {
          recordLoginAttempt(username, false);
          throw new Error("Incorrect password.");
        }
        recordLoginAttempt(username, true);
        return data;
      } else {
        return mockDb.teachers.login(username, password);
      }
    } catch (err) {
      throw err;
    }
  },

  async getAllTeachers(): Promise<Teacher[]> {
    if (isSupabaseConfigured && supabase) {
      let allData: Teacher[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("teachers")
          .select()
          .order("created_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) {
          if (error.code === "PGRST205" || error.code === "42P01") {
            console.warn("Teachers table not found in database. Please run the migration SQL.");
            return [];
          }
          throw new Error(error.message);
        }
        if (data) {
          allData = [...allData, ...data];
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
        page++;
      }
      return allData;
    } else {
      return mockDb.teachers.list();
    }
  },

  async deleteTeacher(teacherId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", teacherId);
      if (error) throw new Error(error.message);
    } else {
      await mockDb.teachers.delete(teacherId);
    }
  },

  async updateTeacher(id: string, username: string, department: string): Promise<Teacher> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("teachers")
        .update({ username: sanitizeInput(username), department: sanitizeInput(department) })
        .eq("id", id)
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Username already exists");
        throw new Error(error.message);
      }
      return data;
    } else {
      return mockDb.teachers.update(id, username, department);
    }
  },

  async updateTeacherPassword(id: string, newPassword: string): Promise<void> {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join("; "));
    }

    if (isSupabaseConfigured && supabase) {
      const hashedPassword = await hashPassword(newPassword);
      const { error } = await supabase
        .from("teachers")
        .update({ password: hashedPassword })
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      await mockDb.teachers.updatePassword(id, newPassword);
    }
  },

  async loginAdmin(username: string, password?: string): Promise<Admin> {
    // Check rate limiting
    const rateLimitCheck = checkLoginAttempts(username);
    if (!rateLimitCheck.allowed) {
      throw new Error(rateLimitCheck.message || "Too many login attempts");
    }

    try {
      if (isSupabaseConfigured && supabase) {
        const { data, error } = await supabase
          .from("admins")
          .select()
          .ilike("username", sanitizeInput(username))
          .maybeSingle();

        if (error) {
          recordLoginAttempt(username, false);
          throw new Error(error.message);
        }
        if (!data) {
          recordLoginAttempt(username, false);
          throw new Error("Admin credentials not found.");
        }
        if (password && data.password !== await hashPassword(password)) {
          recordLoginAttempt(username, false);
          throw new Error("Incorrect password. Please try again.");
        }
        recordLoginAttempt(username, true);
        return { id: data.id, username: data.username, created_at: data.created_at };
      } else {
        return mockDb.admins.login(username, password || "");
      }
    } catch (err) {
      throw err;
    }
  },

  // Departments CRUD
  async getDepartments(): Promise<Department[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("departments")
        .select()
        .order("name", { ascending: true });
      if (error) {
        return defaultDepartments;
      }
      return data && data.length > 0 ? data : defaultDepartments;
    } else {
      return mockDb.departments.list();
    }
  },

  async createDepartment(name: string, description?: string, head?: string): Promise<Department> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("departments")
        .insert({ name: sanitizeInput(name), description: description ? sanitizeInput(description) : undefined, head: head ? sanitizeInput(head) : undefined })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      return mockDb.departments.create(name, description, head);
    }
  },

  async updateDepartment(id: string, name: string, description?: string, head?: string): Promise<Department> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("departments")
        .update({ name: sanitizeInput(name), description: description ? sanitizeInput(description) : undefined, head: head ? sanitizeInput(head) : undefined })
        .eq("id", id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    } else {
      return mockDb.departments.update(id, name, description, head);
    }
  },

  async deleteDepartment(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("departments").delete().eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      await mockDb.departments.delete(id);
    }
  },

  // Admin account management
  async getAllAdmins(): Promise<Admin[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("admins")
        .select("id, username, created_at")
        .order("created_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    } else {
      return mockDb.admins.list();
    }
  },

  async createAdmin(username: string, password: string): Promise<Admin> {
    // Validate inputs
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      throw new Error(usernameValidation.errors.join("; "));
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join("; "));
    }

    if (isSupabaseConfigured && supabase) {
      const hashedPassword = await hashPassword(password);
      const { data, error } = await supabase
        .from("admins")
        .insert({ username: sanitizeInput(username), password: hashedPassword })
        .select("id, username, created_at")
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Admin username already exists");
        throw new Error(error.message);
      }
      return data;
    } else {
      return mockDb.admins.create(username, password);
    }
  },

  async deleteAdmin(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from("admins").delete().eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      await mockDb.admins.delete(id);
    }
  },

  async updateAdminPassword(id: string, newPassword: string): Promise<void> {
    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors.join("; "));
    }

    if (isSupabaseConfigured && supabase) {
      const hashedPassword = await hashPassword(newPassword);
      const { error } = await supabase
        .from("admins")
        .update({ password: hashedPassword })
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      await mockDb.admins.updatePassword(id, newPassword);
    }
  },

  // Exam scheduling
  async toggleExamActive(id: string, isActive: boolean): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("exams")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const exams = initializeMockExams();
      const exam = exams.find(e => e.id === id);
      if (exam) {
        (exam as any).is_active = isActive;
        setLocalStorageData("mock_exams", exams);
      }
    }
  },

  async setExamSchedule(id: string, availableFrom: string | null, availableUntil: string | null): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("exams")
        .update({ available_from: availableFrom, available_until: availableUntil })
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      const exams = initializeMockExams();
      const exam = exams.find(e => e.id === id);
      if (exam) {
        (exam as any).available_from = availableFrom;
        (exam as any).available_until = availableUntil;
        setLocalStorageData("mock_exams", exams);
      }
    }
  },

  async getAllStudents(): Promise<Student[]> {
    if (isSupabaseConfigured && supabase) {
      let allData: Student[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("students")
          .select()
          .order("created_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);
        if (error) throw new Error(error.message);
        if (data) {
          allData = [...allData, ...data];
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
        page++;
      }
      return allData;
    } else {
      return mockDb.students.list();
    }
  },

  async deleteStudent(studentId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);
      if (error) throw new Error(error.message);
    } else {
      await mockDb.students.delete(studentId);
    }
  },

  async updateStudent(id: string, fullName: string, username: string, department: string): Promise<Student> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("students")
        .update({ full_name: sanitizeInput(fullName), username: sanitizeInput(username), department: sanitizeInput(department) })
        .eq("id", id)
        .select()
        .single();
      if (error) {
        if (error.code === "23505") throw new Error("Username already exists");
        throw new Error(error.message);
      }
      return data;
    } else {
      return mockDb.students.update(id, fullName, username, department);
    }
  },

  /**
   * Admin creates a student account with a temporary password.
   * The student will be flagged to change their password on first login.
   */
  async createStudentByAdmin(username: string, department: string, tempPassword: string, fullName: string): Promise<Student> {
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) throw new Error(usernameValidation.errors.join("; "));

    if (isSupabaseConfigured && supabase) {
      const hashedPassword = await hashPassword(tempPassword);
      const payload: any = { 
        username: sanitizeInput(username), 
        password: hashedPassword, 
        department: sanitizeInput(department), 
        must_change_password: true,
        full_name: sanitizeInput(fullName)
      };

      let result = await supabase
        .from("students")
        .insert([payload])
        .select()
        .single();

      if (result.error && (result.error.message.includes("full_name") || result.error.message.includes("schema cache"))) {
        // Fallback: DB hasn't been migrated with full_name yet. Remove it and retry.
        delete payload.full_name;
        result = await supabase
          .from("students")
          .insert([payload])
          .select()
          .single();
      }

      if (result.error && result.error.message.includes("must_change_password")) {
        // Fallback: DB hasn't been migrated with must_change_password yet. Remove it and retry.
        delete payload.must_change_password;
        result = await supabase
          .from("students")
          .insert([payload])
          .select()
          .single();
      }

      if (result.error) {
        if (result.error.code === "23505") throw new Error("Username already exists");
        throw new Error(result.error.message);
      }
      return result.data;
    } else {
      return mockDb.students.createByAdmin(username, tempPassword, department, fullName);
    }
  },

  /**
   * Student changes their own password — requires current password verification.
   */
  async changeStudentPassword(studentId: string, currentPassword: string, newPassword: string): Promise<void> {
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) throw new Error(passwordValidation.errors.join("; "));

    if (isSupabaseConfigured && supabase) {
      // Fetch current hashed password
      const { data, error } = await supabase
        .from("students")
        .select("password")
        .eq("id", studentId)
        .single();
      if (error || !data) throw new Error("Student not found");

      const currentHash = await hashPassword(currentPassword);
      if (data.password !== currentHash) throw new Error("Current password is incorrect");

      const newHash = await hashPassword(newPassword);
      let updateResult = await supabase
        .from("students")
        .update({ password: newHash, must_change_password: false })
        .eq("id", studentId);

      if (updateResult.error && updateResult.error.message.includes("must_change_password")) {
        // Fallback: DB hasn't been migrated with must_change_password yet. Update password only.
        updateResult = await supabase
          .from("students")
          .update({ password: newHash })
          .eq("id", studentId);
      }

      if (updateResult.error) throw new Error(updateResult.error.message);
    } else {
      await mockDb.students.changePassword(studentId, currentPassword, newPassword);
    }
  },

  /**
   * Admin resets a student's password — no current password needed.
   * Student will be flagged to change their password again on next login.
   */
  async adminResetStudentPassword(studentId: string, newPassword: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const hashedPassword = await hashPassword(newPassword);
      let updateResult = await supabase
        .from("students")
        .update({ password: hashedPassword, must_change_password: true })
        .eq("id", studentId);

      if (updateResult.error && updateResult.error.message.includes("must_change_password")) {
        // Fallback: DB hasn't been migrated with must_change_password yet. Update password only.
        updateResult = await supabase
          .from("students")
          .update({ password: hashedPassword })
          .eq("id", studentId);
      }

      if (updateResult.error) throw new Error(updateResult.error.message);
    } else {
      await mockDb.students.adminResetPassword(studentId, newPassword);
    }
  },

  // Exams CRUD
  async getExams(department?: string): Promise<Exam[]> {
    if (isSupabaseConfigured && supabase) {
      await seedSupabaseExams();

      let query = supabase.from("exams").select("*, questions(*)");
      if (department) {
        query = query.eq("department", sanitizeInput(department));
      }

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw new Error(error.message);

      return (data || []).map((examRow: any) => ({
        id: examRow.id,
        title: examRow.title,
        department: examRow.department,
        durationMinutes: examRow.duration_minutes,
        passcode: examRow.passcode,
        description: examRow.description,
        is_active: examRow.is_active,
        available_from: examRow.available_from,
        available_until: examRow.available_until,
        questions: (examRow.questions || []).map((q: any) => ({
          id: q.id,
          text: q.text,
          options: {
            a: q.option_a,
            b: q.option_b,
            c: q.option_c,
            d: q.option_d
          },
          correctAnswer: q.correct_answer,
          points: q.points
        })).sort((a: any, b: any) => a.id - b.id)
      }));
    } else {
      return mockDb.exams.list(department);
    }
  },

  async getExam(id: string): Promise<Exam | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("exams")
        .select("*, questions(*)")
        .eq("id", id)
        .maybeSingle();

      if (error) throw new Error(error.message);
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        department: data.department,
        durationMinutes: data.duration_minutes,
        passcode: data.passcode,
        description: data.description,
        is_active: data.is_active,
        available_from: data.available_from,
        available_until: data.available_until,
        questions: (data.questions || []).map((q: any) => ({
          id: q.id,
          text: q.text,
          options: {
            a: q.option_a,
            b: q.option_b,
            c: q.option_c,
            d: q.option_d
          },
          correctAnswer: q.correct_answer,
          points: q.points
        })).sort((a: any, b: any) => a.id - b.id)
      };
    } else {
      return mockDb.exams.get(id);
    }
  },

  async createExam(title: string, department: string, durationMinutes: number, passcode: string, description?: string): Promise<Exam> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("exams")
        .insert({
          title: sanitizeInput(title),
          department: sanitizeInput(department),
          duration_minutes: durationMinutes,
          passcode: sanitizeInput(passcode),
          description: description ? sanitizeInput(description) : undefined
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        id: data.id,
        title: data.title,
        department: data.department,
        durationMinutes: data.duration_minutes,
        passcode: data.passcode,
        description: data.description,
        is_active: data.is_active,
        available_from: data.available_from,
        available_until: data.available_until,
        questions: []
      };
    } else {
      return mockDb.exams.create(title, department, durationMinutes, passcode, description);
    }
  },

  async updateExam(id: string, title: string, department: string, durationMinutes: number, passcode: string, description?: string): Promise<Exam> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("exams")
        .update({
          title: sanitizeInput(title),
          department: sanitizeInput(department),
          duration_minutes: durationMinutes,
          passcode: sanitizeInput(passcode),
          description: description ? sanitizeInput(description) : undefined
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        id: data.id,
        title: data.title,
        department: data.department,
        durationMinutes: data.duration_minutes,
        passcode: data.passcode,
        description: data.description,
        is_active: data.is_active,
        available_from: data.available_from,
        available_until: data.available_until,
        questions: []
      };
    } else {
      return mockDb.exams.update(id, { title, department, durationMinutes, passcode, description });
    }
  },

  async deleteExam(id: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("exams")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      await mockDb.exams.delete(id);
    }
  },

  // Questions Management
  async createQuestion(examId: string, text: string, options: Question["options"], correctAnswer: string, points: number): Promise<Question> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("questions")
        .insert({
          exam_id: examId,
          text: sanitizeInput(text),
          option_a: sanitizeInput(options.a),
          option_b: sanitizeInput(options.b),
          option_c: sanitizeInput(options.c),
          option_d: sanitizeInput(options.d),
          correct_answer: sanitizeInput(correctAnswer),
          points
        })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        id: data.id,
        text: data.text,
        options: {
          a: data.option_a,
          b: data.option_b,
          c: data.option_c,
          d: data.option_d
        },
        correctAnswer: data.correct_answer,
        points: data.points
      };
    } else {
      return mockDb.exams.addQuestion(examId, text, options, correctAnswer, points);
    }
  },

  async updateQuestion(id: number, text: string, options: Question["options"], correctAnswer: string, points: number): Promise<Question> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("questions")
        .update({
          text: sanitizeInput(text),
          option_a: sanitizeInput(options.a),
          option_b: sanitizeInput(options.b),
          option_c: sanitizeInput(options.c),
          option_d: sanitizeInput(options.d),
          correct_answer: sanitizeInput(correctAnswer),
          points
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw new Error(error.message);
      return {
        id: data.id,
        text: data.text,
        options: {
          a: data.option_a,
          b: data.option_b,
          c: data.option_c,
          d: data.option_d
        },
        correctAnswer: data.correct_answer,
        points: data.points
      };
    } else {
      return mockDb.exams.updateQuestion(id, text, options, correctAnswer, points);
    }
  },

  async deleteQuestion(id: number): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
    } else {
      await mockDb.exams.deleteQuestion(id);
    }
  },

  // Sessions CRUD
  async createSession(studentId: string, examName: string, durationSeconds: number, examId?: string): Promise<ExamSession> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("exam_sessions")
        .insert([{ student_id: studentId, exam_name: sanitizeInput(examName), time_remaining: durationSeconds, total_duration: durationSeconds, exam_id: examId }])
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    } else {
      return mockDb.sessions.create(studentId, examName, durationSeconds, examId);
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
      const { data, error } = await supabase
        .from("saved_answers")
        .upsert(
          { session_id: sessionId, question_id: questionId, selected_option: selectedOption ? sanitizeInput(selectedOption) : null, flagged },
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
  },

  async getActiveSession(studentId: string): Promise<ExamSession | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("exam_sessions")
        .select()
        .eq("student_id", studentId)
        .eq("submitted", false)
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw new Error(error.message);
      return data || null;
    } else {
      return mockDb.sessions.getActive(studentId);
    }
  },

  async getStudentSessions(studentId: string): Promise<ExamSession[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from("exam_sessions")
        .select()
        .eq("student_id", studentId)
        .order("started_at", { ascending: false });
      if (error) throw new Error(error.message);
      return data || [];
    } else {
      const sessions = getLocalStorageData<ExamSession[]>("mock_exam_sessions", []);
      return sessions
        .filter(s => s.student_id === studentId)
        .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
    }
  },

  // Admin Monitoring & Reporting APIs
  async getAllSessions(): Promise<ExamSession[]> {
    if (isSupabaseConfigured && supabase) {
      let allData: any[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("exam_sessions")
          .select("*, students(username, department)")
          .order("started_at", { ascending: false })
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw new Error(error.message);

        if (data) {
          allData = [...allData, ...data];
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
        page++;
      }

      return allData.map((row: any) => ({
        id: row.id,
        student_id: row.student_id,
        exam_name: row.exam_name,
        started_at: row.started_at,
        ended_at: row.ended_at,
        submitted: row.submitted,
        time_remaining: row.time_remaining,
        total_duration: row.total_duration,
        exam_id: row.exam_id,
        student: row.students ? { username: row.students.username, department: row.students.department } : undefined
      }));
    } else {
      return mockDb.sessions.listAll();
    }
  },

  async getAllAnswers(): Promise<SavedAnswer[]> {
    if (isSupabaseConfigured && supabase) {
      let allData: SavedAnswer[] = [];
      let page = 0;
      const pageSize = 1000;
      let hasMore = true;
      while (hasMore) {
        const { data, error } = await supabase
          .from("saved_answers")
          .select("*")
          .range(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw new Error(error.message);

        if (data) {
          allData = [...allData, ...data];
          if (data.length < pageSize) hasMore = false;
        } else {
          hasMore = false;
        }
        page++;
      }
      return allData;
    } else {
      return JSON.parse(localStorage.getItem("mock_saved_answers") || "[]");
    }
  },

  // Add extra minutes to an active session
  async addTimeToSession(sessionId: string, additionalMinutes: number): Promise<void> {
    const additionalSeconds = additionalMinutes * 60;
    if (isSupabaseConfigured && supabase) {
      const { data: session, error: fetchErr } = await supabase
        .from("exam_sessions")
        .select("total_duration")
        .eq("id", sessionId)
        .single();
      if (fetchErr) throw new Error(fetchErr.message);
      const { error } = await supabase
        .from("exam_sessions")
        .update({ total_duration: (session.total_duration ?? 0) + additionalSeconds })
        .eq("id", sessionId);
      if (error) throw new Error(error.message);
    } else {
      await mockDb.sessions.addTime(sessionId, additionalSeconds);
    }
  },

  // Add extra minutes to all active sessions of an exam
  async addTimeToAllActiveSessions(examName: string, additionalMinutes: number): Promise<void> {
    const additionalSeconds = additionalMinutes * 60;
    if (isSupabaseConfigured && supabase) {
      const { data: sessions, error: fetchErr } = await supabase
        .from("exam_sessions")
        .select("id, total_duration")
        .eq("exam_name", examName)
        .eq("submitted", false);
      if (fetchErr) throw new Error(fetchErr.message);

      if (sessions && sessions.length > 0) {
        const promises = sessions.map(async (s) => {
          return supabase
            .from("exam_sessions")
            .update({ total_duration: (s.total_duration ?? 0) + additionalSeconds })
            .eq("id", s.id);
        });
        const results = await Promise.all(promises);
        const firstError = results.find(r => r.error);
        if (firstError) throw new Error(firstError.error!.message);
      }
    } else {
      await mockDb.sessions.addTimeToAllActive(examName, additionalSeconds);
    }
  },

  // Bulk-insert questions for an exam (used for CSV/JSON import)
  async createQuestionsBulk(
    examId: string,
    questions: Array<{ text: string; options: Question["options"]; correctAnswer: string; points: number }>
  ): Promise<Question[]> {
    // Validate each row — map internal shape to what validateExamImportRow expects
    const validationErrors: string[] = [];
    questions.forEach((q, idx) => {
      const rowForValidation = {
        text: q.text,
        option_a: q.options.a,
        option_b: q.options.b,
        option_c: q.options.c,
        option_d: q.options.d,
        correct_answer: q.correctAnswer,
        points: q.points
      };
      const validation = validateExamImportRow(rowForValidation, idx + 1);
      if (!validation.valid) {
        validationErrors.push(...validation.errors);
      }
    });

    if (validationErrors.length > 0) {
      throw new Error(`Import validation failed:\n${validationErrors.join("\n")}`);
    }

    if (isSupabaseConfigured && supabase) {
      const rows = questions.map(q => ({
        exam_id: examId,
        text: sanitizeInput(q.text),
        option_a: sanitizeInput(q.options.a),
        option_b: sanitizeInput(q.options.b),
        option_c: sanitizeInput(q.options.c),
        option_d: sanitizeInput(q.options.d),
        correct_answer: sanitizeInput(q.correctAnswer),
        points: q.points
      }));
      const { data, error } = await supabase
        .from("questions")
        .insert(rows)
        .select();
      if (error) throw new Error(error.message);
      return (data || []).map((r: any) => ({
        id: r.id,
        text: r.text,
        options: { a: r.option_a, b: r.option_b, c: r.option_c, d: r.option_d },
        correctAnswer: r.correct_answer,
        points: r.points
      }));
    } else {
      return mockDb.exams.addQuestionsBulk(examId, questions);
    }
  }
};
