import { useState } from "react";
import { BrowserShell } from "./components/BrowserShell";
import { ExamWorkspace } from "./components/ExamWorkspace";
import { mockExams, type Exam } from "./data/mockQuestions";
import { dbService, isSupabaseConfigured, type Student, type ExamSession } from "./supabaseClient";
import { CheckCircle, AlertTriangle, Download, LogOut, BookOpen, Clock } from "lucide-react";
import confetti from "canvas-confetti";

type Screen = "SEARCH" | "REGISTER" | "LOGIN" | "DASHBOARD" | "EXAM" | "RECEIPT";

function App() {
  const [currentUrl, setCurrentUrl] = useState("https://www.google.com");
  const [currentScreen, setCurrentScreen] = useState<Screen>("SEARCH");
  
  // App States
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [activeExam, setActiveExam] = useState<Exam | null>(null);
  const [activeSession, setActiveSession] = useState<ExamSession | null>(null);
  const [finalScore, setFinalScore] = useState<number>(0);
  
  // Registration / Login forms
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [isPreExamModalOpen, setIsPreExamModalOpen] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Helper navigation triggers
  const handleNavigateToPortal = () => {
    if (currentStudent) {
      setCurrentScreen("DASHBOARD");
    } else {
      setCurrentScreen("LOGIN");
    }
  };

  const handleNavigateToSearch = () => {
    setCurrentScreen("SEARCH");
  };

  // Actions
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!username || !password) {
      setAuthError("Please fill out all fields.");
      return;
    }
    try {
      await dbService.registerStudent(username);
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
    try {
      const student = await dbService.loginStudent(username);
      setCurrentStudent(student);
      setCurrentUrl("https://wuetc.net/elearning/dashboard.php");
      setCurrentScreen("DASHBOARD");
      setUsername("");
      setPassword("");
    } catch (err: any) {
      setAuthError(err.message || "Login failed.");
    }
  };

  const handleStartExamClick = (exam: Exam) => {
    setActiveExam(exam);
    setIsPreExamModalOpen(true);
    setRulesAccepted(false);
  };

  const handleStartExamConfirm = async () => {
    if (!currentStudent || !activeExam) return;
    
    try {
      const session = await dbService.createSession(
        currentStudent.id,
        activeExam.title,
        activeExam.durationMinutes * 60
      );
      setActiveSession(session);
      setIsPreExamModalOpen(false);
      setCurrentUrl(`https://wuetc.net/elearning/mod/quiz/attempt.php?attempt=${session.id}&cmid=320&page=0`);
      setCurrentScreen("EXAM");
    } catch (err) {
      console.error("Error creating session:", err);
      alert("Failed to initialize exam session. Please try again.");
    }
  };

  const handleFinishExam = (score: number) => {
    setFinalScore(score);
    setCurrentScreen("RECEIPT");
    setCurrentUrl(`https://wuetc.net/elearning/mod/quiz/receipt.php?session=${activeSession?.id}`);
    
    // Confetti effect!
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  };

  const handleDownloadReceipt = () => {
    if (!activeSession || !activeExam || !currentStudent) return;
    
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
Total Marks: ${finalScore.toFixed(2)} / ${activeExam.questions.reduce((a, b) => a + b.points, 0).toFixed(2)}
Percentage: ${((finalScore / activeExam.questions.length) * 100).toFixed(1)}%
Result: ${finalScore >= (activeExam.questions.length / 2) ? "PASS" : "FAIL"}
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
    setCurrentScreen("LOGIN");
    setCurrentUrl("https://wuetc.net/elearning/login.php");
  };

  return (
    <BrowserShell
      currentUrl={currentUrl}
      setCurrentUrl={setCurrentUrl}
      onNavigateToPortal={handleNavigateToPortal}
      onNavigateToSearch={handleNavigateToSearch}
    >
      <div className="euee-theme">
        {/* Render different screens inside the browser window */}
        
        {currentScreen === "REGISTER" && (
          <div className="auth-page-container">
            <div className="auth-card">
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
                {mockExams.map((exam) => (
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

                    <button 
                      className="exam-card-btn"
                      onClick={() => handleStartExamClick(exam)}
                    >
                      Attempt Quiz Now
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Confirmation pre-exam modal */}
            {isPreExamModalOpen && activeExam && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h3 className="modal-title">Confirm Exam Start</h3>
                  <p className="modal-body-text">
                    You are about to start the <strong>{activeExam.title}</strong>. 
                    Once started, the timer of <strong>{activeExam.durationMinutes} minutes</strong> will begin running immediately and cannot be paused.
                  </p>
                  
                  <div style={{ backgroundColor: "#fef3c7", border: "1px solid #fde68a", color: "#92400e", padding: "12px", borderRadius: "6px", fontSize: "13px" }}>
                    <strong>Warning:</strong> Navigating away from the browser workspace or closing the browser window before pressing "Submit all and finish" can cause your answers to fail to save.
                  </div>

                  <label className="modal-checkbox-row">
                    <input 
                      type="checkbox" 
                      checked={rulesAccepted}
                      onChange={(e) => setRulesAccepted(e.target.checked)}
                    />
                    <span>I understand the terms and am ready to start my exit exam attempt.</span>
                  </label>

                  <div className="modal-actions">
                    <button 
                      className="modal-btn cancel"
                      onClick={() => setIsPreExamModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button 
                      className="modal-btn confirm"
                      disabled={!rulesAccepted}
                      onClick={handleStartExamConfirm}
                    >
                      Start Attempt
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
                      {finalScore.toFixed(2)} / {activeExam.questions.reduce((a, b) => a + b.points, 0).toFixed(2)} Marks
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
                    onClick={() => {
                      setCurrentScreen("DASHBOARD");
                      setCurrentUrl("https://wuetc.net/elearning/dashboard.php");
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
    </BrowserShell>
  );
}

export default App;
