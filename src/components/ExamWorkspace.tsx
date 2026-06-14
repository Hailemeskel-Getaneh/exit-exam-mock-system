import React, { useState, useEffect, useRef } from "react";
import { Flag, Bell, Menu } from "lucide-react";
import type { Exam, Question } from "../data/mockQuestions";
import { dbService } from "../supabaseClient";
import type { SavedAnswer } from "../supabaseClient";

interface ExamWorkspaceProps {
  exam: Exam;
  sessionId: string;
  studentName: string;
  realTimeRemaining: number; // computed from started_at on the server/db
  onFinishExam: (score: number) => void;
}

export const ExamWorkspace: React.FC<ExamWorkspaceProps> = ({
  exam,
  sessionId,
  studentName,
  realTimeRemaining,
  onFinishExam
}) => {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [savedAnswers, setSavedAnswers] = useState<SavedAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(realTimeRemaining);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef<any>(null);

  const currentQuestion: Question = exam.questions[currentQuestionIdx];

  // Load answers from DB on mount
  useEffect(() => {
    const loadAnswers = async () => {
      try {
        const answers = await dbService.getAnswers(sessionId);
        setSavedAnswers(answers);
      } catch (err) {
        console.error("Error loading answers:", err);
      } finally {
        setLoading(false);
      }
    };
    loadAnswers();

    // Start countdown timer — purely wall-clock driven
    // The initial value was already calculated from started_at so it's always correct
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId]);

  const handleAutoSubmit = async () => {
    // Disable inputs and force submit
    alert("Time is up! Your answers are being automatically submitted.");
    handleSubmitAll();
  };

  const getAnswerForQuestion = (qId: number) => {
    return savedAnswers.find((ans) => ans.question_id === qId);
  };

  const handleSelectOption = async (option: string) => {
    setIsAutoSaving(true);
    const existing = getAnswerForQuestion(currentQuestion.id);
    const flaggedState = existing ? existing.flagged : false;
    
    try {
      const updated = await dbService.saveAnswer(sessionId, currentQuestion.id, option, flaggedState);
      
      setSavedAnswers((prev) => {
        const filtered = prev.filter((a) => a.question_id !== currentQuestion.id);
        return [...filtered, updated];
      });
    } catch (err) {
      console.error("Error saving answer:", err);
    } finally {
      setIsAutoSaving(false);
    }
  };

  const handleClearChoice = async () => {
    const existing = getAnswerForQuestion(currentQuestion.id);
    if (!existing || existing.selected_option === null) return;
    const flaggedState = existing ? existing.flagged : false;
    try {
      const updated = await dbService.saveAnswer(sessionId, currentQuestion.id, null, flaggedState);
      setSavedAnswers((prev) => {
        const filtered = prev.filter((a) => a.question_id !== currentQuestion.id);
        return [...filtered, updated];
      });
    } catch (err) {
      console.error("Error clearing answer:", err);
    }
  };

  const handleToggleFlag = async () => {
    const existing = getAnswerForQuestion(currentQuestion.id);
    const currentOption = existing ? existing.selected_option : null;
    const nextFlaggedState = existing ? !existing.flagged : true;

    try {
      const updated = await dbService.saveAnswer(sessionId, currentQuestion.id, currentOption, nextFlaggedState);
      
      setSavedAnswers((prev) => {
        const filtered = prev.filter((a) => a.question_id !== currentQuestion.id);
        return [...filtered, updated];
      });
    } catch (err) {
      console.error("Error saving flag state:", err);
    }
  };

  const handleNextPage = () => {
    if (currentQuestionIdx < exam.questions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1);
    } else {
      // Go to summary page
      setShowExitConfirm(true);
    }
  };

  const handlePrevPage = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx((prev) => prev - 1);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const hStr = h > 0 ? `${h}:` : "";
    const mStr = m.toString().padStart(2, "0");
    const sStr = s.toString().padStart(2, "0");
    
    return `${hStr}${mStr}:${sStr}`;
  };

  const calculateScore = () => {
    let score = 0;
    exam.questions.forEach((q) => {
      const ans = getAnswerForQuestion(q.id);
      if (ans && ans.selected_option === q.correctAnswer) {
        score += q.points;
      }
    });
    return score;
  };

  const handleSubmitAll = async () => {
    try {
      await dbService.submitSession(sessionId);
      const score = calculateScore();
      onFinishExam(score);
    } catch (err) {
      console.error("Error submitting exam:", err);
      alert("Submission error. Please try again.");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexGrow: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f8f9fa", color: "#666" }}>
        <p>Loading exam environment...</p>
      </div>
    );
  }

  const currentAnswer = getAnswerForQuestion(currentQuestion.id);
  const isAnswered = currentAnswer && currentAnswer.selected_option !== null;
  const isFlagged = currentAnswer && currentAnswer.flagged;

  return (
    <div className="moodle-workspace">
      {/* Navbar clone */}
      <div className="euee-navbar">
        <div className="euee-logo-area">
          <div className="euee-logo-icon">I</div>
          <span className="euee-brand-name">INDMET E-Learning</span>
        </div>
        <div className="euee-nav-links">
          <span className="euee-nav-link">Home</span>
          <span className="euee-nav-link">Dashboard</span>
          <span className="euee-nav-link">My courses</span>
          <span className="euee-nav-link">Back to ETC Site</span>
        </div>
        <div className="euee-nav-right">
          <Bell size={18} />
          <div className="euee-profile">
            <div className="euee-avatar">
              {studentName.substring(0, 2).toUpperCase()}
            </div>
            <span>{studentName}</span>
          </div>
        </div>
      </div>

      {/* Main Workspace Frame */}
      <div className="moodle-container">
        {!showExitConfirm ? (
          <>
            {/* Header info */}
            <div className="moodle-exam-header">
              <h1 className="moodle-exam-title">{exam.title}</h1>
              <div className="moodle-breadcrumbs">
                <span className="moodle-breadcrumb-tab">Course</span>
                <span className="moodle-breadcrumb-tab active">Quiz</span>
              </div>
            </div>

            <div className="moodle-top-actions">
              <button 
                className="moodle-back-btn"
                onClick={() => {
                  if (confirm("Are you sure you want to exit the exam workspace? Your progress is saved but the timer will continue.")) {
                    window.location.reload();
                  }
                }}
              >
                Back
              </button>
              
              {/* Sticky Timer */}
              <div className={`moodle-timer-box ${timeRemaining < 300 ? "warning" : ""}`}>
                Time left {formatTime(timeRemaining)}
              </div>
            </div>

            {/* Split Screen Grid */}
            <div className="moodle-main-grid">
              
              {/* Question pane */}
              <div className="moodle-question-section">
                <div className="moodle-question-row">
                  {/* Left box details */}
                  <div className="question-left-card">
                    <span className="left-card-qnum">Question {currentQuestionIdx + 1}</span>
                    <span className="left-card-status">
                      {isAnswered ? "Answered" : "Not yet answered"}
                    </span>
                    <span className="left-card-points">
                      Marked out of {currentQuestion.points.toFixed(2)}
                    </span>
                    <button 
                      className={`left-card-flag-btn ${isFlagged ? "flagged" : ""}`}
                      onClick={handleToggleFlag}
                    >
                      <Flag size={12} fill={isFlagged ? "#dc3545" : "none"} />
                      <span>{isFlagged ? "Remove flag" : "Flag question"}</span>
                    </button>
                  </div>

                  {/* Right box question text & inputs */}
                  <div className="question-right-card">
                    <p className="question-text">{currentQuestion.text}</p>
                    
                    <div className="question-options-list">
                      {Object.entries(currentQuestion.options).map(([key, val]) => (
                        <label className="option-item" key={key}>
                          <input 
                            type="radio" 
                            name={`q-${currentQuestion.id}`}
                            className="option-radio"
                            checked={currentAnswer?.selected_option === key}
                            onChange={() => handleSelectOption(key)}
                          />
                          <div className="option-content">
                            <span className="option-label-letter">{key}.</span>
                            <span>{val}</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Autosave spinner indicator */}
                {isAutoSaving && (
                  <div className="autosave-indicator">
                    <span className="spinner-mini"></span>Saving answer...
                  </div>
                )}

                {/* Previous / Next button row + Clear choice */}
                <div className="moodle-nav-actions">
                  <button 
                    className="moodle-page-btn prev"
                    onClick={handlePrevPage}
                    disabled={currentQuestionIdx === 0}
                    style={{ opacity: currentQuestionIdx === 0 ? 0.5 : 1, cursor: currentQuestionIdx === 0 ? "not-allowed" : "pointer" }}
                  >
                    Previous page
                  </button>
                  <button
                    className="moodle-clear-btn"
                    onClick={handleClearChoice}
                    disabled={!isAnswered}
                    title="Remove your selected answer for this question"
                  >
                    Clear my choice
                  </button>
                  <button 
                    className="moodle-page-btn next"
                    onClick={handleNextPage}
                  >
                    {currentQuestionIdx === exam.questions.length - 1 ? "Finish attempt..." : "Next page"}
                  </button>
                </div>
              </div>

              {/* Quiz Navigation Sidebar */}
              {isSidebarOpen ? (
                <div className="quiz-navigation-panel">
                  <div className="quiz-nav-header">
                    <h3 className="quiz-nav-title">Quiz navigation</h3>
                    <button className="quiz-nav-close" onClick={() => setIsSidebarOpen(false)}>×</button>
                  </div>
                  
                  <div className="quiz-nav-grid">
                    {exam.questions.map((q, idx) => {
                      const ans = getAnswerForQuestion(q.id);
                      const isQAnswered = ans && ans.selected_option !== null;
                      const isQFlagged = ans && ans.flagged;
                      const isQCurrent = idx === currentQuestionIdx;

                      return (
                        <button
                          key={q.id}
                          className={`quiz-nav-block ${isQCurrent ? "current" : ""} ${isQAnswered ? "answered" : ""} ${isQFlagged ? "flagged" : ""}`}
                          onClick={() => setCurrentQuestionIdx(idx)}
                        >
                          <span className="nav-block-num">{idx + 1}</span>
                        </button>
                      );
                    })}
                  </div>

                  <span 
                    className="quiz-nav-finish-link"
                    onClick={() => setShowExitConfirm(true)}
                  >
                    Finish attempt...
                  </span>
                </div>
              ) : (
                <button 
                  className="moodle-sidebar-trigger"
                  onClick={() => setIsSidebarOpen(true)}
                >
                  <Menu size={14} />
                  <span>Show Navigation</span>
                </button>
              )}
            </div>
          </>
        ) : (
          /* Submission Summary Screen */
          <div className="summary-container">
            <h2 className="summary-title">Summary of attempt</h2>
            
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {exam.questions.map((q, idx) => {
                  const ans = getAnswerForQuestion(q.id);
                  const isQAnswered = ans && ans.selected_option !== null;
                  return (
                    <tr key={q.id}>
                      <td>Question {idx + 1}</td>
                      <td>
                        <span className={`summary-status-tag ${isQAnswered ? "answered" : "unanswered"}`}>
                          {isQAnswered ? "Answer saved" : "Not yet answered"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div className="summary-actions">
              <button 
                className="summary-btn return"
                onClick={() => setShowExitConfirm(false)}
              >
                Return to attempt
              </button>
              <button 
                className="summary-btn submit-all"
                onClick={() => {
                  if (confirm("Once you submit, you will no longer be able to change your answers for this attempt. Submit and finish?")) {
                    handleSubmitAll();
                  }
                }}
              >
                Submit all and finish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
