import { useState, useEffect, useRef } from "react";
import { ExamWorkspace } from "./components/ExamWorkspace";
import { AdminDashboard } from "./components/admin/AdminDashboard";
import { 
  dbService, 
  isSupabaseConfigured, 
  computeRealTimeRemaining, 
  type Student, 
  type ExamSession, 
  type Admin,
  type Teacher,
  type SavedAnswer 
} from "./supabaseClient";
import { validatePassword } from "./utils/security";
import type { Exam } from "./data/mockQuestions";
import { CheckCircle, AlertTriangle, Download, LogOut, BookOpen, Clock, Award, Calendar, KeyRound, Eye, EyeOff } from "lucide-react";
import confetti from "canvas-confetti";

type Screen = "LOGIN" | "DASHBOARD" | "EXAM" | "RECEIPT" | "ADMIN_DASHBOARD";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("LOGIN");
  
  // App States
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [examsList, setExamsList] = useState<Exam[]>([]);
  
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [submittedAnswers, setSubmittedAnswers] = useState<SavedAnswer[]>([]);
  const [showQuestionReview, setShowQuestionReview] = useState(false);
  const [isResumingSession, setIsResumingSession] = useState(false);
  const [resumeSessionData, setResumeSessionData] = useState<ExamSession | null>(null);
  const [studentSessions, setStudentSessions] = useState<ExamSession[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<SavedAnswer[]>([]);
  
  // Registration / Login forms
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isPreExamModalOpen, setIsPreExamModalOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  // Change Password modal
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [cpCurrentPwd, setCpCurrentPwd] = useState("");
  const [cpNewPwd, setCpNewPwd] = useState("");
  const [cpConfirmPwd, setCpConfirmPwd] = useState("");
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");
  const [cpLoading, setCpLoading] = useState(false);
  const [showCpCurrentPwd, setShowCpCurrentPwd] = useState(false);
  const [showCpNewPwd, setShowCpNewPwd] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleDocumentClick);
    return () => {
      document.removeEventListener("mousedown", handleDocumentClick);
    };
  }, []);

  const loadStudentSessions = async (studentId: string) => {
    try {
      const sessions = await dbService.getStudentSessions(studentId);
      setStudentSessions(sessions);

      // Fetch answers for all these sessions to calculate history scores
      const allAnswersPromises = sessions.map(s => dbService.getAnswers(s.id));
      const resolvedAnswers = await Promise.all(allAnswersPromises);
      setStudentAnswers(resolvedAnswers.flat());
    } catch (err) {
      console.error("Error loading student sessions:", err);
    }
  };

  const loadExamsList = async () => {
    try {
      const exams = await dbService.getExams();
      setExamsList(exams);
    } catch (err) {
      console.error("Error loading exams:", err);
    }
  };

  // Actions
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!username || !password) {
      setAuthError("Please fill out all fields.");
      return;
    }
    setIsLoggingIn(true);
    try {
      // Try student login first
      try {
        const student = await dbService.loginStudent(username, password);
        setCurrentStudent(student);
        await loadStudentSessions(student.id);
        await loadExamsList();
        setCurrentScreen("DASHBOARD");
        setUsername("");
        setPassword("");
        return;
      } catch (err: any) {
        // If rate-limited, stop immediately — don’t try other roles
        if (err.message?.toLowerCase().includes("too many")) {
          setAuthError(err.message);
          setIsLoggingIn(false);
          return;
        }
        // Otherwise not a student — try teacher
      }
      try {
        const teacher = await dbService.loginTeacher(username, password);
        setCurrentTeacher(teacher);
        setCurrentScreen("ADMIN_DASHBOARD");
        setUsername("");
        setPassword("");
        return;
      } catch (err: any) {
        // If rate-limited, stop immediately
        if (err.message?.toLowerCase().includes("too many")) {
          setAuthError(err.message);
          setIsLoggingIn(false);
          return;
        }
        // Otherwise not a teacher — try admin
      }
      const admin = await dbService.loginAdmin(username, password);
      setCurrentAdmin(admin);
      setCurrentScreen("ADMIN_DASHBOARD");
      setUsername("");
      setPassword("");
    } catch (err: any) {
      setAuthError("Invalid username or password. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStartExamClick = async (exam: Exam) => {
    if (!currentStudent) return;

    // Block if already submitted
    const hasAlreadySubmitted = studentSessions.some(
      (s) => s.exam_name === exam.title && s.submitted
    );
    if (hasAlreadySubmitted) {
      alert("You have already submitted an attempt for this exam. Only one attempt is allowed.");
      return;
    }

    setActiveExam(exam);
    setPasscodeInput("");
    setPasscodeError("");

    // Silently check if there's an existing unfinished session for THIS exam
    try {
      const existing = await dbService.getActiveSession(currentStudent.id);
      if (existing && existing.exam_name === exam.title) {
        // Student has a saved session — they will seamlessly continue
        setIsResumingSession(true);
        setResumeSessionData(existing);
      } else {
        setIsResumingSession(false);
        setResumeSessionData(null);
      }
    } catch {
      setIsResumingSession(false);
      setResumeSessionData(null);
    }

    setIsPreExamModalOpen(true);
  };

  const handleStartExamConfirm = async () => {
    if (!currentStudent || !activeExam) return;
    
    // Passcode validation (required for both starting and resuming)
    if (passcodeInput.trim().toUpperCase() !== activeExam.passcode.toUpperCase()) {
      setPasscodeError("Incorrect passcode. Please try again.");
      return;
    }
    
    try {
      if (isResumingSession && resumeSessionData) {
        // Seamlessly resume the existing session
        setActiveSession(resumeSessionData);
      } else {
        // Create a brand new session
        const session = await dbService.createSession(
          currentStudent.id,
          activeExam.title,
          activeExam.durationMinutes * 60,
          activeExam.id
        );
        setActiveSession(session);
      }
      setIsPreExamModalOpen(false);
      setCurrentScreen("EXAM");
    } catch (err: any) {
      console.error("Error starting exam session:", err);
      alert(`Failed to initialize exam session: ${err.message || "Unknown error"}\n\nIf you are using a live Supabase database, please make sure you have run the SQL migrations from the bottom of supabase_schema.sql.`);
    }
  };

  const handleFinishExam = (score: number, answers: SavedAnswer[]) => {
    setFinalScore(score);
    setSubmittedAnswers(answers);
    setShowQuestionReview(false);
    setCurrentScreen("RECEIPT");

    // Confetti effect!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleDownloadReceipt = () => {
    if (!activeSession || !activeExam || !currentStudent) return;
    
    const totalPoints = activeExam.questions.reduce((a, b) => a + b.points, 0);
    const scaledScore = totalPoints > 0 ? (finalScore / totalPoints) * 100 : 0;

    const receiptContent = `================================================
DEBRE BIRHAN COLLEGE OF TEACHER EDUCATION - SUBMISSION RECEIPT
================================================
Student Name: ${currentStudent.full_name || currentStudent.username}
Student ID: ${currentStudent.id}
Exam Title: ${activeExam.title}
Session ID: ${activeSession.id}
Status: SUBMITTED SUCCESSFUL
Started At: ${new Date(activeSession.started_at).toLocaleString()}
Submitted At: ${new Date().toLocaleString()}
------------------------------------------------
FINAL PERFORMANCE REPORT:
Total Marks: ${scaledScore.toFixed(2)} / 100.00
Percentage: ${scaledScore.toFixed(1)}%
Result: ${scaledScore >= 50 ? "PASS" : "FAIL"}
================================================
Thank you for participating.
`;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Exam_Receipt_${activeExam.id}_${currentStudent.username}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setCurrentAdmin(null);
    setCurrentTeacher(null);
    setActiveExam(null);
    setActiveSession(null);
    setResumeSessionData(null);
    setIsResumingSession(false);
    setCurrentScreen("LOGIN");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;
    setCpError("");
    setCpSuccess("");

    if (!cpCurrentPwd || !cpNewPwd || !cpConfirmPwd) {
      setCpError("Please fill in all fields.");
      return;
    }
    if (cpNewPwd !== cpConfirmPwd) {
      setCpError("New passwords do not match.");
      return;
    }
    const validation = validatePassword(cpNewPwd);
    if (!validation.valid) {
      setCpError(validation.errors.join(" · "));
      return;
    }
    setCpLoading(true);
    try {
      await dbService.changeStudentPassword(currentStudent.id, cpCurrentPwd, cpNewPwd);
      // Update local state to clear the must_change_password flag
      setCurrentStudent(prev => prev ? { ...prev, must_change_password: false } : prev);
      setCpSuccess("Password changed successfully!");
      setCpCurrentPwd("");
      setCpNewPwd("");
      setCpConfirmPwd("");
      setTimeout(() => {
        setIsChangePasswordOpen(false);
        setCpSuccess("");
      }, 1800);
    } catch (err: any) {
      setCpError(err.message || "Failed to change password.");
    } finally {
      setCpLoading(false);
    }
  };

  const getSessionScoreStr = (session: ExamSession) => {
    const exam = examsList.find(e => e.title === session.exam_name);
    if (!exam) return "N/A";

    const sessionAnswers = studentAnswers.filter(a => a.session_id === session.id);
    let score = 0;
    let totalPoints = 0;

    exam.questions.forEach(q => {
      totalPoints += q.points;
      const ans = sessionAnswers.find(a => a.question_id === q.id);
      if (ans && ans.selected_option === q.correctAnswer) {
        score += q.points;
      }
    });

    const percent = totalPoints > 0 ? (score / totalPoints) * 100 : 0;
    const isPass = percent >= 50;
    return (
      <span style={{ color: isPass ? "#16a34a" : "#dc2626", fontWeight: "bold" }}>
        {percent.toFixed(1)}% ({isPass ? "PASS" : "FAIL"})
      </span>
    );
  };

  return (
    <div className="euee-theme app-root">
      {/* Render different screens directly inside the page viewport */}
        

        {currentScreen === "LOGIN" && (
          <div className="auth-page-container">
            <div className="auth-card">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <img src="/db_cte_logo.png" alt="Logo" style={{ width: "90px", height: "90px", objectFit: "contain" }} />
              </div>

              <h2 className="auth-card-title" style={{ fontSize: "20px", margin: "0 0 4px 0" }}>Debre Birhan CTE</h2>
              <p className="auth-card-subtitle" style={{ fontWeight: "600", color: "#0f6cbf", marginBottom: "12px" }}>College Exam System</p>
              <p className="auth-card-subtitle">Sign in to the exam portal</p>
              
              <form onSubmit={handleLoginSubmit}>
                {authError && (
                  <div className="auth-error-banner">
                    <AlertTriangle size={16} />
                    <span>{authError}</span>
                  </div>
                )}

                <div className="auth-form-group">
                  <label className="auth-label">Username</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    autoComplete="username"
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                  />
                </div>

                <button type="submit" className="auth-btn" disabled={isLoggingIn}>
                  {isLoggingIn ? "Signing in..." : "Sign In"}
                </button>
              </form>
              
              <p className="auth-switch-text" style={{ color: "#94a3b8", fontSize: "12px", marginTop: "16px", textAlign: "center" }}>
                Contact your college administrator to get your login credentials.
              </p>
            </div>
          </div>
        )}

        {currentScreen === "DASHBOARD" && currentStudent && (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {/* Nav */}
            <div className="euee-navbar">
              <div className="euee-logo-area">
                <div className="euee-logo-icon">D</div>
                <span className="euee-brand-name">Debre Birhan CTE Exam Portal</span>
              </div>
              <div className="euee-nav-links">
                <span className="euee-nav-link active">Home</span>
                <span className="euee-nav-link">Dashboard</span>
                <span className="euee-nav-link">My courses</span>
              </div>
              <div className="euee-nav-right">
                <div 
                  ref={profileMenuRef}
                  className="euee-profile" 
                  onClick={() => setIsProfileMenuOpen(prev => !prev)}
                  style={{ position: "relative" }}
                >
                  <div className="euee-avatar">
                    {(currentStudent.full_name || currentStudent.username).substring(0, 2).toUpperCase()}
                  </div>
                  <span>{currentStudent.full_name || currentStudent.username}</span>
                  <div style={{ display: "flex", alignItems: "center", color: "#64748b" }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "2px", transform: isProfileMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6"/></svg>
                  </div>

                  {isProfileMenuOpen && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "100%",
                        marginTop: "8px",
                        backgroundColor: "white",
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                        width: "220px",
                        padding: "8px 0",
                        zIndex: 9999,
                        textAlign: "left"
                      }}
                    >
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px", lineHeight: "1.4", wordBreak: "break-all" }}>
                          {currentStudent.full_name || currentStudent.username}
                        </div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
                          ID: {currentStudent.username}
                        </div>
                        <div style={{ display: "inline-block", fontSize: "11px", fontWeight: "600", color: "#0f6cbf", backgroundColor: "rgba(15, 108, 191, 0.08)", padding: "2px 6px", borderRadius: "4px", marginTop: "6px" }}>
                          {currentStudent.department} Dept
                        </div>
                      </div>

                      <div style={{ padding: "4px 0" }}>
                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            setCpError(""); setCpSuccess(""); setCpCurrentPwd(""); setCpNewPwd(""); setCpConfirmPwd("");
                            setIsChangePasswordOpen(true);
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            border: "none",
                            background: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#334155",
                            fontSize: "13.5px",
                            transition: "background-color 0.2s"
                          }}
                          className="profile-menu-item"
                        >
                          <KeyRound size={15} style={{ color: "#64748b" }} />
                          <span>Change Password</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setIsProfileMenuOpen(false);
                            handleLogout();
                          }}
                          style={{
                            width: "100%",
                            padding: "10px 16px",
                            border: "none",
                            background: "none",
                            textAlign: "left",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            color: "#dc2626",
                            fontSize: "13.5px",
                            transition: "background-color 0.2s"
                          }}
                          className="profile-menu-item"
                        >
                          <LogOut size={15} />
                          <span>Log Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="dashboard-container" style={{ textAlign: "left" }}>
              <div className="dashboard-header">
                <h1 className="dashboard-title">Welcome back, {currentStudent.full_name || currentStudent.username}!</h1>
                <p className="dashboard-subtitle">Select an online examination from your department's active list below.</p>
              </div>

              {/* Must-change-password warning banner */}
              {currentStudent.must_change_password && (
                <div style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  backgroundColor: "#fffbeb",
                  border: "1px solid #f59e0b",
                  borderRadius: "8px",
                  padding: "14px 16px",
                  marginBottom: "20px"
                }}>
                  <AlertTriangle size={18} style={{ color: "#d97706", flexShrink: 0, marginTop: "1px" }} />
                  <div>
                    <p style={{ margin: 0, fontWeight: "700", color: "#92400e", fontSize: "14px" }}>Action Required: Change Your Password</p>
                    <p style={{ margin: "4px 0 8px", color: "#78350f", fontSize: "13px" }}>You are using a temporary password assigned by an administrator. Please change it before taking any exam.</p>
                    <button
                      onClick={() => { setCpError(""); setCpSuccess(""); setCpCurrentPwd(""); setCpNewPwd(""); setCpConfirmPwd(""); setIsChangePasswordOpen(true); }}
                      style={{ background: "#d97706", color: "white", border: "none", borderRadius: "5px", padding: "7px 14px", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Change Password Now
                    </button>
                  </div>
                </div>
              )}

              {/* Dynamic Exams List */}
              <div className="dashboard-grid">
                {examsList
                  .filter((exam) => exam.department.toLowerCase() === currentStudent.department.toLowerCase() && exam.is_active !== false)
                  .map((exam) => {
                    const hasSubmitted = studentSessions.some(
                      (s) => s.exam_name === exam.title && s.submitted
                    );
                    const hasActive = studentSessions.some(
                      (s) => s.exam_name === exam.title && !s.submitted
                    );
                    const now = new Date();
                    const isUpcoming = exam.available_from ? new Date(exam.available_from) > now : false;
                    const isExpired = exam.available_until ? new Date(exam.available_until) < now : false;

                    return (
                      <div className="exam-card" key={exam.id} style={{ opacity: isExpired ? 0.75 : 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                          <span className="exam-card-dept" style={{ margin: 0 }}>{exam.department}</span>
                          {isUpcoming && (
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#d97706", backgroundColor: "#fffbeb", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(217, 119, 6, 0.2)" }}>Scheduled</span>
                          )}
                          {isExpired && (
                            <span style={{ fontSize: "11px", fontWeight: "700", color: "#dc2626", backgroundColor: "#fef2f2", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(220, 38, 38, 0.2)" }}>Expired</span>
                          )}
                        </div>
                        <h3 className="exam-card-title">{exam.title}</h3>
                        
                        <div className="exam-card-detail">
                          <BookOpen size={14} />
                          <span>{exam.questions?.length || 0} Questions (Multiple Choice)</span>
                        </div>
                        <div className="exam-card-detail">
                          <Clock size={14} />
                          <span>{exam.durationMinutes} Minutes Duration</span>
                        </div>

                        {exam.available_from && (
                          <div className="exam-card-detail">
                            <Calendar size={14} style={{ color: "#d97706" }} />
                            <span style={{ fontSize: "12px", color: "#d97706" }}>Opens: {new Date(exam.available_from).toLocaleString()}</span>
                          </div>
                        )}
                        {exam.available_until && (
                          <div className="exam-card-detail">
                            <Calendar size={14} style={{ color: "#dc2626" }} />
                            <span style={{ fontSize: "12px", color: "#dc2626" }}>Closes: {new Date(exam.available_until).toLocaleString()}</span>
                          </div>
                        )}

                        {hasSubmitted ? (
                          <button 
                            className="exam-card-btn submitted"
                            disabled
                            style={{
                              backgroundColor: "#e5e7eb",
                              color: "#9ca3af",
                              cursor: "not-allowed",
                              border: "1px solid #d1d5db"
                            }}
                          >
                            Attempt Completed
                          </button>
                        ) : isUpcoming ? (
                          <button 
                            className="exam-card-btn"
                            disabled
                            style={{
                              backgroundColor: "#f3f4f6",
                              color: "#9ca3af",
                              cursor: "not-allowed",
                              border: "1px solid #e5e7eb"
                            }}
                          >
                            Opens {new Date(exam.available_from!).toLocaleDateString()}
                          </button>
                        ) : isExpired ? (
                          <button 
                            className="exam-card-btn"
                            disabled
                            style={{
                              backgroundColor: "#f3f4f6",
                              color: "#9ca3af",
                              cursor: "not-allowed",
                              border: "1px solid #e5e7eb"
                            }}
                          >
                            Availability Ended
                          </button>
                        ) : (
                          <button 
                            className="exam-card-btn"
                            onClick={() => handleStartExamClick(exam)}
                          >
                            {hasActive ? "Resume Attempt" : "Attempt Quiz Now"}
                          </button>
                        )}
                      </div>
                    );
                  })}
                {examsList.filter((exam) => exam.department.toLowerCase() === currentStudent.department.toLowerCase() && exam.is_active !== false).length === 0 && (
                  <div style={{ gridColumn: "span 3", textAlign: "center", padding: "40px", backgroundColor: "white", border: "1px solid var(--moodle-border)", borderRadius: "8px" }}>
                    <p style={{ color: "#64748b", margin: 0 }}>No exams are currently active for the {currentStudent.department} department.</p>
                  </div>
                )}
              </div>

              {/* Past Attempts Log */}
              {studentSessions.filter(s => s.submitted).length > 0 && (
                <div style={{ marginTop: "48px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "16px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Award size={18} style={{ color: "#0f6cbf" }} />
                    <span>Your Exam History & Performance</span>
                  </h2>
                  
                  <div className="table-responsive" style={{ backgroundColor: "white", border: "1px solid var(--moodle-border)", borderRadius: "8px", overflow: "hidden" }}>
                    <table className="summary-table" style={{ margin: 0 }}>
                      <thead>
                        <tr>
                          <th style={{ padding: "12px 16px" }}>Exam Title</th>
                          <th>Completion Date</th>
                          <th style={{ textAlign: "right", paddingRight: "24px" }}>Result Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentSessions.filter(s => s.submitted).map((session) => (
                          <tr key={session.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "14px 16px", fontWeight: "600", color: "#334155" }}>
                              {session.exam_name}
                            </td>
                            <td style={{ color: "#64748b", fontSize: "13px" }}>
                              {new Date(session.ended_at || session.started_at).toLocaleString()}
                            </td>
                            <td style={{ textAlign: "right", paddingRight: "24px" }}>
                              {getSessionScoreStr(session)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmation pre-exam modal */}
            {isPreExamModalOpen && activeExam && (
              <div className="modal-overlay">
                <div className="modal-content" style={{ textAlign: "left" }}>
                  <h3 className="modal-title">
                    {isResumingSession ? "Continue Your Attempt" : "Confirm Exam Start"}
                  </h3>
                  <p className="modal-body-text">
                    {isResumingSession
                      ? <>You have a saved attempt for <strong>{activeExam.title}</strong>. Your previous answers are restored and the timer will continue from where it left off.</>  
                      : <>You are about to start <strong>{activeExam.title}</strong>. Once started, the timer of <strong>{activeExam.durationMinutes} minutes</strong> will begin running and cannot be paused.</>
                    }
                  </p>
                  
                  <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d", padding: "12px", borderRadius: "6px", fontSize: "13px" }}>
                    <strong>Auto-Save ON:</strong> Your answers are automatically saved as you answer. The timer runs continuously — even if you close the browser.
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "16px" }}>
                    <label style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>Exam Passcode</label>
                    <input 
                      type="text"
                      placeholder="Enter passcode to start"
                      value={passcodeInput}
                      onChange={(e) => {
                        setPasscodeInput(e.target.value);
                        setPasscodeError("");
                      }}
                      style={{
                        padding: "10px 12px",
                        border: passcodeError ? "1px solid #dc2626" : "1px solid #d1d5db",
                        borderRadius: "6px",
                        fontSize: "14px",
                        outline: "none",
                        textTransform: "uppercase"
                      }}
                    />
                    {passcodeError && (
                      <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: "500" }}>
                        {passcodeError}
                      </span>
                    )}
                  </div>

                  <div className="modal-actions">
                    <button 
                      className="modal-btn cancel"
                      onClick={() => setIsPreExamModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="modal-btn confirm"
                      disabled={!passcodeInput.trim()}
                      onClick={handleStartExamConfirm}
                    >
                      {isResumingSession ? "Continue Attempt" : "Start Attempt"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {currentScreen === "EXAM" && activeExam && activeSession && currentStudent && (
          <ExamWorkspace
            exam={activeExam}
            sessionId={activeSession.id}
            studentName={currentStudent.full_name || currentStudent.username}
            realTimeRemaining={computeRealTimeRemaining(activeSession)}
            onFinishExam={(score, answers) => handleFinishExam(score, answers)}
          />
        )}

        {currentScreen === "ADMIN_DASHBOARD" && (currentAdmin || currentTeacher) && (
          <AdminDashboard
            adminName={currentAdmin ? currentAdmin.username : currentTeacher!.username}
            adminId={currentAdmin ? currentAdmin.id : currentTeacher!.id}
            onLogout={handleLogout}
            role={currentTeacher ? "TEACHER" : "ADMIN"}
            teacherDepartment={currentTeacher?.department}
          />
        )}

        {currentScreen === "RECEIPT" && activeExam && activeSession && currentStudent && (() => {
          const totalPoints = activeExam.questions.reduce((a, b) => a + b.points, 0);
          const percentage = totalPoints > 0 ? (finalScore / totalPoints) * 100 : 0;
          const isPassing = percentage >= 50;
          const answeredCount = submittedAnswers.filter(a => a.selected_option !== null).length;
          const correctCount = activeExam.questions.filter(q => {
            const ans = submittedAnswers.find(a => a.question_id === q.id);
            return ans && ans.selected_option === q.correctAnswer;
          }).length;
          const wrongCount = answeredCount - correctCount;
          const unansweredCount = activeExam.questions.length - answeredCount;

          return (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1, backgroundColor: "#f1f5f9", minHeight: "100vh" }}>
            {/* Navbar */}
            <div className="euee-navbar">
              <div className="euee-logo-area">
                <div className="euee-logo-icon">D</div>
                <span className="euee-brand-name">Debre Birhan CTE Exam Portal</span>
              </div>
              <div className="euee-nav-right">
                <div
                  ref={profileMenuRef}
                  className="euee-profile"
                  onClick={() => setIsProfileMenuOpen(prev => !prev)}
                  style={{ position: "relative" }}
                >
                  <div className="euee-avatar">{(currentStudent.full_name || currentStudent.username).substring(0, 2).toUpperCase()}</div>
                  <span>{currentStudent.full_name || currentStudent.username}</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "4px", color: "#64748b", transform: isProfileMenuOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}><path d="m6 9 6 6 6-6"/></svg>
                  {isProfileMenuOpen && (
                    <div onClick={(e) => e.stopPropagation()} style={{ position: "absolute", right: 0, top: "100%", marginTop: "8px", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)", width: "220px", padding: "8px 0", zIndex: 9999 }}>
                      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f1f5f9" }}>
                        <div style={{ fontWeight: "700", color: "#1e293b", fontSize: "14px" }}>{currentStudent.full_name || currentStudent.username}</div>
                        <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>ID: {currentStudent.username}</div>
                      </div>
                      <button type="button" className="profile-menu-item" onClick={() => { setIsProfileMenuOpen(false); handleLogout(); }} style={{ width: "100%", padding: "10px 16px", border: "none", background: "none", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", color: "#dc2626", fontSize: "13.5px" }}>
                        <LogOut size={15} /><span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Results page body */}
            <div style={{ maxWidth: "820px", margin: "32px auto", padding: "0 16px", width: "100%", paddingBottom: "48px" }}>

              {/* Score Hero Card */}
              <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", overflow: "hidden", marginBottom: "24px" }}>
                {/* Top colour band */}
                <div style={{ background: isPassing ? "linear-gradient(135deg, #16a34a, #15803d)" : "linear-gradient(135deg, #dc2626, #b91c1c)", padding: "32px 32px 24px", textAlign: "center", color: "white" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: "28px", fontWeight: "800" }}>
                    {isPassing ? "✓" : "✗"}
                  </div>
                  <h1 style={{ margin: "0 0 4px", fontSize: "26px", fontWeight: "800", letterSpacing: "-0.5px" }}>
                    {isPassing ? "Congratulations! You Passed" : "Exam Not Passed"}
                  </h1>
                  <p style={{ margin: 0, opacity: 0.88, fontSize: "14px" }}>{activeExam.title}</p>
                </div>

                {/* Score numbers */}
                <div style={{ padding: "28px 32px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
                    {/* Big percentage */}
                    <div style={{ textAlign: "center", minWidth: "120px" }}>
                      <div style={{ fontSize: "52px", fontWeight: "800", color: isPassing ? "#16a34a" : "#dc2626", lineHeight: 1 }}>{percentage.toFixed(1)}%</div>
                      <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>Overall Score</div>
                    </div>

                    {/* Progress bar + breakdown */}
                    <div style={{ flex: 1, minWidth: "200px" }}>
                      <div style={{ height: "12px", backgroundColor: "#e2e8f0", borderRadius: "99px", overflow: "hidden", marginBottom: "12px" }}>
                        <div style={{ height: "100%", width: `${percentage}%`, background: isPassing ? "linear-gradient(90deg,#16a34a,#22c55e)" : "linear-gradient(90deg,#dc2626,#f87171)", borderRadius: "99px", transition: "width 1s ease" }} />
                      </div>
                      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#16a34a" }} />
                          <span style={{ fontSize: "13px", color: "#374151" }}><strong>{correctCount}</strong> Correct</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#dc2626" }} />
                          <span style={{ fontSize: "13px", color: "#374151" }}><strong>{wrongCount}</strong> Wrong</span>
                        </div>
                        {unansweredCount > 0 && (
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#94a3b8" }} />
                            <span style={{ fontSize: "13px", color: "#374151" }}><strong>{unansweredCount}</strong> Skipped</span>
                          </div>
                        )}
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontSize: "13px", color: "#374151" }}>Raw: <strong>{finalScore.toFixed(1)} / {totalPoints.toFixed(1)} pts</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Pass/Fail badge */}
                    <div style={{ padding: "10px 20px", borderRadius: "99px", backgroundColor: isPassing ? "#f0fdf4" : "#fef2f2", border: `2px solid ${isPassing ? "#16a34a" : "#dc2626"}`, color: isPassing ? "#16a34a" : "#dc2626", fontWeight: "800", fontSize: "15px", whiteSpace: "nowrap" }}>
                      {isPassing ? "✓ PASS" : "✗ FAIL"}
                    </div>
                  </div>

                  {/* Meta info row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: "12px", marginTop: "20px", paddingTop: "20px", borderTop: "1px solid #f1f5f9" }}>
                    {[{label: "Student", val: currentStudent.full_name || currentStudent.username},{label: "Department", val: currentStudent.department},{label: "Started", val: new Date(activeSession.started_at).toLocaleString()},{label: "Submitted", val: new Date().toLocaleString()},{label: "Total Questions", val: String(activeExam.questions.length)}].map(item => (
                      <div key={item.label}>
                        <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>{item.label}</div>
                        <div style={{ fontSize: "13.5px", color: "#1e293b", fontWeight: "600", marginTop: "2px" }}>{item.val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Question Review Section */}
              <div style={{ backgroundColor: "white", borderRadius: "16px", boxShadow: "0 4px 24px rgba(0,0,0,0.06)", overflow: "hidden", marginBottom: "24px" }}>
                <button
                  onClick={() => setShowQuestionReview(p => !p)}
                  style={{ width: "100%", padding: "18px 24px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: showQuestionReview ? "1px solid #e2e8f0" : "none" }}
                >
                  <span style={{ fontWeight: "700", fontSize: "16px", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "18px" }}>📋</span> Question-by-Question Review
                  </span>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showQuestionReview ? "rotate(180deg)" : "none", transition: "transform 0.25s" }}><path d="m6 9 6 6 6-6"/></svg>
                </button>

                {showQuestionReview && (
                  <div style={{ padding: "0" }}>
                    {activeExam.questions.map((q, idx) => {
                      const ans = submittedAnswers.find(a => a.question_id === q.id);
                      const selected = ans?.selected_option ?? null;
                      const isCorrect = selected === q.correctAnswer;
                      const isSkipped = selected === null;

                      const optionLabel = (key: string | null) => {
                        if (!key) return null;
                        const text = (q.options as any)[key];
                        return text ? `${key.toUpperCase()}. ${text}` : key.toUpperCase();
                      };

                      return (
                        <div key={q.id} style={{ padding: "16px 24px", borderBottom: idx < activeExam.questions.length - 1 ? "1px solid #f1f5f9" : "none", backgroundColor: isSkipped ? "#fafafa" : isCorrect ? "#f0fdf4" : "#fef2f2" }}>
                          <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                            {/* Status icon */}
                            <div style={{ width: "28px", height: "28px", borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "13px", backgroundColor: isSkipped ? "#e2e8f0" : isCorrect ? "#dcfce7" : "#fee2e2", color: isSkipped ? "#64748b" : isCorrect ? "#16a34a" : "#dc2626" }}>
                              {isSkipped ? "–" : isCorrect ? "✓" : "✗"}
                            </div>

                            <div style={{ flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", backgroundColor: "#f1f5f9", padding: "1px 8px", borderRadius: "99px" }}>Q{idx + 1}</span>
                                <span style={{ fontSize: "12px", fontWeight: "700", padding: "1px 8px", borderRadius: "99px", backgroundColor: isSkipped ? "#f1f5f9" : isCorrect ? "#dcfce7" : "#fee2e2", color: isSkipped ? "#64748b" : isCorrect ? "#16a34a" : "#dc2626" }}>
                                  {isSkipped ? "Skipped" : isCorrect ? `+${q.points} pts` : "0 pts"}
                                </span>
                              </div>

                              {/* Question text */}
                              <p style={{ margin: "0 0 10px", fontSize: "14px", color: "#1e293b", fontWeight: "500", lineHeight: 1.5 }}>{q.text}</p>

                              {/* Answer comparison */}
                              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                <div style={{ fontSize: "13px", padding: "6px 12px", borderRadius: "8px", backgroundColor: isSkipped ? "#e2e8f0" : isCorrect ? "#16a34a" : "#dc2626", color: isSkipped ? "#64748b" : "white", fontWeight: "600" }}>
                                  {isSkipped ? "Not answered" : `Your answer: ${optionLabel(selected)}`}
                                </div>
                                {!isCorrect && (
                                  <div style={{ fontSize: "13px", padding: "6px 12px", borderRadius: "8px", backgroundColor: "#16a34a", color: "white", fontWeight: "600" }}>
                                    Correct: {optionLabel(q.correctAnswer)}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                <button
                  onClick={handleDownloadReceipt}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 24px", backgroundColor: "#0f6cbf", color: "white", border: "none", borderRadius: "8px", fontWeight: "700", fontSize: "14px", cursor: "pointer", transition: "background 0.2s" }}
                >
                  <Download size={16} />
                  Download Receipt
                </button>
                <button
                  onClick={async () => {
                    if (currentStudent) await loadStudentSessions(currentStudent.id);
                    setCurrentScreen("DASHBOARD");
                  }}
                  style={{ padding: "12px 24px", backgroundColor: "white", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", fontWeight: "700", fontSize: "14px", cursor: "pointer", transition: "background 0.2s" }}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
          );
        })()}

        {/* Change Password Modal — for students */}
        {isChangePasswordOpen && currentStudent && (
          <div className="modal-overlay" style={{ zIndex: 9999 }}>
            <div className="modal-content" style={{ textAlign: "left", maxWidth: "460px", width: "100%" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 className="modal-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <KeyRound size={18} style={{ color: "#0f6cbf" }} />
                  Change Password
                </h3>
                <button
                  onClick={() => setIsChangePasswordOpen(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
                >
                  ✕
                </button>
              </div>

              {cpError && (
                <div className="auth-error-banner" style={{ marginBottom: "12px" }}>
                  <AlertTriangle size={15} />
                  <span>{cpError}</span>
                </div>
              )}
              {cpSuccess && (
                <div className="auth-info-banner" style={{ marginBottom: "12px" }}>
                  <CheckCircle size={15} />
                  <span>{cpSuccess}</span>
                </div>
              )}

              <form onSubmit={handleChangePassword}>
                {/* Current Password */}
                <div className="auth-form-group">
                  <label className="auth-label">Current Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCpCurrentPwd ? "text" : "password"}
                      className="auth-input"
                      placeholder="Enter your current password"
                      value={cpCurrentPwd}
                      onChange={(e) => setCpCurrentPwd(e.target.value)}
                      style={{ paddingRight: "40px", margin: 0 }}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCpCurrentPwd(p => !p)}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0 }}
                    >
                      {showCpCurrentPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div className="auth-form-group">
                  <label className="auth-label">New Password</label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCpNewPwd ? "text" : "password"}
                      className="auth-input"
                      placeholder="At least 8 chars, uppercase, number"
                      value={cpNewPwd}
                      onChange={(e) => setCpNewPwd(e.target.value)}
                      style={{ paddingRight: "40px", margin: 0 }}
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCpNewPwd(p => !p)}
                      style={{ position: "absolute", right: "10px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: 0 }}
                    >
                      {showCpNewPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>Min 8 characters · uppercase · lowercase · number</p>
                </div>

                {/* Confirm New Password */}
                <div className="auth-form-group">
                  <label className="auth-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Re-enter your new password"
                    value={cpConfirmPwd}
                    onChange={(e) => setCpConfirmPwd(e.target.value)}
                    style={{ margin: 0 }}
                    autoComplete="new-password"
                  />
                </div>

                <div className="modal-actions" style={{ marginTop: "20px" }}>
                  <button type="button" className="modal-btn cancel" onClick={() => setIsChangePasswordOpen(false)} disabled={cpLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn confirm" disabled={cpLoading}>
                    {cpLoading ? "Saving..." : "Save New Password"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Database connectivity HUD display at bottom right */}
        <div className="mode-indicator">
          <div className={`indicator-dot ${isSupabaseConfigured ? "online" : "offline"}`}></div>
          <span>
            {isSupabaseConfigured 
              ? "Connected to Live Supabase DB" 
              : "Running offline in Local DB mode"}
          </span>
        </div>
    </div>
  );
}

export default App;
