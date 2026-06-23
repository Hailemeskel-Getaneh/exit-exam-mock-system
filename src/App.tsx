import { useState, useEffect } from "react";
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
  type Department,
  type SavedAnswer 
} from "./supabaseClient";
import type { Exam } from "./data/mockQuestions";
import { CheckCircle, AlertTriangle, Download, LogOut, BookOpen, Clock, Award, Calendar } from "lucide-react";
import confetti from "canvas-confetti";

type Screen = "REGISTER" | "LOGIN" | "DASHBOARD" | "EXAM" | "RECEIPT" | "ADMIN_DASHBOARD";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("LOGIN");
  
  // App States
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<Admin | null>(null);
  const [currentTeacher, setCurrentTeacher] = useState<Teacher | null>(null);
  const [examsList, setExamsList] = useState<Exam[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isResumingSession, setIsResumingSession] = useState(false);
  const [resumeSessionData, setResumeSessionData] = useState<ExamSession | null>(null);
  const [studentSessions, setStudentSessions] = useState<ExamSession[]>([]);
  const [studentAnswers, setStudentAnswers] = useState<SavedAnswer[]>([]);
  
  // Registration / Login forms
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isPreExamModalOpen, setIsPreExamModalOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  // Load departments on mount
  useEffect(() => {
    dbService.getDepartments().then(depts => {
      setDepartments(depts);
      if (depts.length > 0) setDepartment(depts[0].name);
    }).catch(() => {});
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
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!username || !password || !department) {
      setAuthError("Please fill out all fields.");
      return;
    }
    try {
      await dbService.registerStudent(username, password, department);
      setAuthSuccess("Registration successful! You can now log in.");
      setUsername("");
      setPassword("");
      // Auto-switch to login screen after 1.5s
      setTimeout(() => {
        setCurrentScreen("LOGIN");
        setAuthSuccess("");
      }, 1500);
    } catch (err: any) {
      setAuthError(err.message || "Registration failed.");
    }
  };

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
      } catch {
        // Not a student — try teacher
      }
      try {
        const teacher = await dbService.loginTeacher(username, password);
        setCurrentTeacher(teacher);
        setCurrentScreen("ADMIN_DASHBOARD");
        setUsername("");
        setPassword("");
        return;
      } catch {
        // Not a teacher — try admin
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

  const handleFinishExam = (score: number) => {
    setFinalScore(score);
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
Student Name: ${currentStudent.username}
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
        
        {currentScreen === "REGISTER" && (
          <div className="auth-page-container">
            <div className="auth-card">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <img src="/moe_logo.png" alt="Logo" style={{ width: "90px", height: "90px", objectFit: "contain" }} />
              </div>
              <h2 className="auth-card-title" style={{ fontSize: "20px", margin: "0 0 4px 0" }}>Debre Birhan CTE</h2>
              <p className="auth-card-subtitle" style={{ fontWeight: "600", color: "#0f6cbf", marginBottom: "12px" }}>College Exam System</p>
              <p className="auth-card-subtitle">Create your student account to register</p>
              
              <form onSubmit={handleRegisterSubmit}>
                {authError && (
                  <div className="auth-error-banner">
                    <AlertTriangle size={16} />
                    <span>{authError}</span>
                  </div>
                )}
                {authSuccess && (
                  <div className="auth-info-banner">
                    <CheckCircle size={16} />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <div className="auth-form-group">
                  <label className="auth-label">Full Name / Username</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter your full name or username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Department</label>
                  <select
                    className="auth-input"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    style={{ backgroundColor: "white", color: "#374151", cursor: "pointer" }}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <button type="submit" className="auth-btn">Register</button>
              </form>
              
              <p className="auth-switch-text">
                Already registered?{" "}
                <span className="auth-link" onClick={() => setCurrentScreen("LOGIN")}>Log in here</span>
              </p>
            </div>
          </div>
        )}

        {currentScreen === "LOGIN" && (
          <div className="auth-page-container">
            <div className="auth-card">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                <img src="/moe_logo.png" alt="Logo" style={{ width: "90px", height: "90px", objectFit: "contain" }} />
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
              
              <p className="auth-switch-text">
                New student?{" "}
                <span className="auth-link" onClick={() => { setCurrentScreen("REGISTER"); setAuthError(""); }}>Register here</span>
              </p>
            </div>
          </div>
        )}

        {currentScreen === "DASHBOARD" && currentStudent && (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {/* Nav clone */}
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
                <div className="euee-profile" onClick={handleLogout}>
                  <div className="euee-avatar">
                    {currentStudent.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span>{currentStudent.username}</span>
                  <LogOut size={14} style={{ marginLeft: "4px" }} />
                </div>
              </div>
            </div>

            {/* Dashboard content */}
            <div className="dashboard-container" style={{ textAlign: "left" }}>
              <div className="dashboard-header">
                <h1 className="dashboard-title">Welcome back, {currentStudent.username}!</h1>
                <p className="dashboard-subtitle">Select an online examination from your department's active list below.</p>
              </div>

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
            studentName={currentStudent.username}
            realTimeRemaining={computeRealTimeRemaining(activeSession)}
            onFinishExam={handleFinishExam}
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

        {currentScreen === "RECEIPT" && activeExam && activeSession && currentStudent && (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {/* Navbar */}
            <div className="euee-navbar">
              <div className="euee-logo-area">
                <div className="euee-logo-icon">D</div>
                <span className="euee-brand-name">Debre Birhan CTE Exam Portal</span>
              </div>
              <div className="euee-nav-right">
                <div className="euee-profile" onClick={handleLogout}>
                  <div className="euee-avatar">
                    {currentStudent.username.substring(0, 2).toUpperCase()}
                  </div>
                  <span>{currentStudent.username}</span>
                  <LogOut size={14} style={{ marginLeft: "4px" }} />
                </div>
              </div>
            </div>

            {/* Receipt details */}
            <div className="summary-container" style={{ marginTop: "24px", textAlign: "left" }}>
              <div className="receipt-card">
                <div className="receipt-success-icon">✓</div>
                <h2 className="receipt-title" style={{ textAlign: "center" }}>Exam Submitted Successfully!</h2>
                <p className="receipt-text" style={{ textAlign: "center" }}>
                  Your responses for the exam have been recorded. 
                  You can download your submission receipt or return to the main dashboard.
                </p>

                <div className="receipt-details-grid">
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">Student ID</span>
                    <span className="receipt-detail-val">{currentStudent.id}</span>
                  </div>
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">Student Username</span>
                    <span className="receipt-detail-val">{currentStudent.username}</span>
                  </div>
                  <div className="receipt-detail-item" style={{ gridColumn: "span 2" }}>
                    <span className="receipt-detail-label">Exam Title</span>
                    <span className="receipt-detail-val">{activeExam.title}</span>
                  </div>
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">Start Time</span>
                    <span className="receipt-detail-val">
                      {new Date(activeSession.started_at).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className="receipt-detail-item">
                    <span className="receipt-detail-label">Submission Time</span>
                    <span className="receipt-detail-val">
                      {new Date().toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="receipt-score-display">
                    <span className="receipt-detail-label">Performance Result</span>
                    <span className="score-badge">
                      {(() => {
                        const totalPoints = activeExam.questions.reduce((a, b) => a + b.points, 0);
                        const scaled = totalPoints > 0 ? (finalScore / totalPoints) * 100 : 0;
                        return `${scaled.toFixed(2)} / 100.00`;
                      })()} Marks
                    </span>
                  </div>
                </div>

                <div className="receipt-actions">
                  <button 
                    className="receipt-btn download"
                    onClick={handleDownloadReceipt}
                  >
                    <Download size={16} />
                    <span>Download Receipt (.txt)</span>
                  </button>
                  <button 
                    className="receipt-btn home"
                    onClick={async () => {
                      if (currentStudent) {
                        await loadStudentSessions(currentStudent.id);
                      }
                      setCurrentScreen("DASHBOARD");
                    }}
                  >
                    Return to Dashboard
                  </button>
                </div>
              </div>
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
