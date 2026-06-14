import { useState } from "react";
import { ExamWorkspace } from "./components/ExamWorkspace";
import { mockExams, type Exam } from "./data/mockQuestions";
import { dbService, isSupabaseConfigured, computeRealTimeRemaining, type Student, type ExamSession } from "./supabaseClient";
import { CheckCircle, AlertTriangle, Download, LogOut, BookOpen, Clock } from "lucide-react";
import confetti from "canvas-confetti";

type Screen = "REGISTER" | "LOGIN" | "DASHBOARD" | "EXAM" | "RECEIPT";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("LOGIN");
  
  // App States
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isResumingSession, setIsResumingSession] = useState(false);
  const [resumeSessionData, setResumeSessionData] = useState<ExamSession | null>(null);
  const [studentSessions, setStudentSessions] = useState<ExamSession[]>([]);
  
  // Registration / Login forms
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("Information Technology");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isPreExamModalOpen, setIsPreExamModalOpen] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [passcodeError, setPasscodeError] = useState("");

  const loadStudentSessions = async (studentId: string) => {
    try {
      const sessions = await dbService.getStudentSessions(studentId);
      setStudentSessions(sessions);
    } catch (err) {
      console.error("Error loading student sessions:", err);
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
      await dbService.registerStudent(username, department);
      setAuthSuccess("Registration successful! You can now log in.");
      setUsername("");
      setPassword("");
      setDepartment("Information Technology");
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
    try {
      const student = await dbService.loginStudent(username);
      setCurrentStudent(student);
      await loadStudentSessions(student.id);
      setCurrentScreen("DASHBOARD");
      setUsername("");
      setPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Login failed.");
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
          activeExam.durationMinutes * 60
        );
        setActiveSession(session);
      }
      setIsPreExamModalOpen(false);
      setCurrentScreen("EXAM");
    } catch (err) {
      console.error("Error starting exam session:", err);
      alert("Failed to initialize exam session. Please try again.");
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

    const receiptContent = `=========================================
ETHIOPIAN EXIT EXAM - SUBMISSION RECEIPT
=========================================
Student Name: ${currentStudent.username}
Student ID: ${currentStudent.id}
Exam Title: ${activeExam.title}
Session ID: ${activeSession.id}
Status: SUBMITTED SUCCESSFUL
Started At: ${new Date(activeSession.started_at).toLocaleString()}
Submitted At: ${new Date().toLocaleString()}
-----------------------------------------
FINAL PERFORMANCE REPORT:
Total Marks: ${scaledScore.toFixed(2)} / 100.00
Percentage: ${scaledScore.toFixed(1)}%
Result: ${scaledScore >= 50 ? "PASS" : "FAIL"}
=========================================
Thank you for practicing with EUEE Mock.
`;

    const blob = new Blob([receiptContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EUEE_Receipt_${activeExam.id}_${currentStudent.username}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    setCurrentStudent(null);
    setActiveExam(null);
    setActiveSession(null);
    setResumeSessionData(null);
    setIsResumingSession(false);
    setCurrentScreen("LOGIN");
  };

  return (
    <div className="euee-theme app-root">
      {/* Render different screens directly inside the page viewport */}
        
        {currentScreen === "REGISTER" && (
          <div className="auth-page-container">
            <div className="auth-card">
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <img src="/moe_logo.png" alt="Ministry of Education Logo" style={{ width: "90px", height: "90px", objectFit: "contain" }} />
              </div>
              <h2 className="auth-card-title">EUEE Registration</h2>
              <p className="auth-card-subtitle">Create a student credential to start the mock</p>
              
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
                  <label className="auth-label">Student Username</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="Enter username (e.g. Haile)"
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
                    <option value="Information Technology">Information Technology</option>
                    <option value="English">English</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="General Science">General Science</option>
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
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                <img src="/moe_logo.png" alt="Ministry of Education Logo" style={{ width: "90px", height: "90px", objectFit: "contain" }} />
              </div>
              <h2 className="auth-card-title">EUEE Student Login</h2>
              <p className="auth-card-subtitle">Use your registered mock credentials to log in</p>
              
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
                    placeholder="Enter username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Password</label>
                  <input
                    type="password"
                    className="auth-input"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <button type="submit" className="auth-btn">Log In</button>
              </form>
              
              <p className="auth-switch-text">
                New student?{" "}
                <span className="auth-link" onClick={() => setCurrentScreen("REGISTER")}>Register here</span>
              </p>
            </div>
          </div>
        )}

        {currentScreen === "DASHBOARD" && currentStudent && (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {/* Nav clone */}
            <div className="euee-navbar">
              <div className="euee-logo-area">
                <div className="euee-logo-icon">I</div>
                <span className="euee-brand-name">INDMET E-Learning</span>
              </div>
              <div className="euee-nav-links">
                <span className="euee-nav-link active">Home</span>
                <span className="euee-nav-link">Dashboard</span>
                <span className="euee-nav-link">My courses</span>
                <span className="euee-nav-link">Back to ETC Site</span>
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
            <div className="dashboard-container">
              <div className="dashboard-header">
                <h1 className="dashboard-title">Welcome back, {currentStudent.username}!</h1>
                <p className="dashboard-subtitle">Select an Exit Exam from your registered list to begin the mock simulation.</p>
              </div>

              <div className="dashboard-grid">
                {mockExams
                  .filter((exam) => exam.department.toLowerCase() === currentStudent.department.toLowerCase())
                  .map((exam) => {
                    const hasSubmitted = studentSessions.some(
                      (s) => s.exam_name === exam.title && s.submitted
                    );
                    const hasActive = studentSessions.some(
                      (s) => s.exam_name === exam.title && !s.submitted
                    );

                    return (
                      <div className="exam-card" key={exam.id}>
                        <span className="exam-card-dept">{exam.department}</span>
                        <h3 className="exam-card-title">{exam.title}</h3>
                        
                        <div className="exam-card-detail">
                          <BookOpen size={14} />
                          <span>{exam.questions.length} Questions (Multiple Choice)</span>
                        </div>
                        <div className="exam-card-detail">
                          <Clock size={14} />
                          <span>{exam.durationMinutes} Minutes Duration</span>
                        </div>

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
              </div>
            </div>

            {/* Confirmation pre-exam modal */}
            {isPreExamModalOpen && activeExam && (
              <div className="modal-overlay">
                <div className="modal-content">
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

        {currentScreen === "RECEIPT" && activeExam && activeSession && currentStudent && (
          <div style={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
            {/* Navbar */}
            <div className="euee-navbar">
              <div className="euee-logo-area">
                <div className="euee-logo-icon">I</div>
                <span className="euee-brand-name">INDMET E-Learning</span>
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
            <div className="summary-container" style={{ marginTop: "24px" }}>
              <div className="receipt-card">
                <div className="receipt-success-icon">✓</div>
                <h2 className="receipt-title">Exam Submitted Successfully!</h2>
                <p className="receipt-text">
                  Your responses for the exit exam have been recorded in the database. 
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
