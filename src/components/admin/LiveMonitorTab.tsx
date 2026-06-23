import React, { useState, useEffect } from "react";
import { Play, ShieldAlert, CheckSquare } from "lucide-react";
import { dbService, computeRealTimeRemaining, type ExamSession, type Exam, type SavedAnswer } from "../../supabaseClient";

interface LiveMonitorTabProps {
  sessions: ExamSession[];
  exams: Exam[];
  answers: SavedAnswer[];
  onRefresh: () => void;
}

export const LiveMonitorTab: React.FC<LiveMonitorTabProps> = ({
  sessions,
  exams,
  answers,
  onRefresh
}) => {
  const [ticks, setTicks] = useState(0);

  // Force re-renders every second so the countdown timers update in real-time
  useEffect(() => {
    const timer = setInterval(() => {
      setTicks((t) => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeSessions = sessions.filter((s) => !s.submitted);

  const handleForceSubmit = async (sessionId: string, username: string) => {
    if (!confirm(`Are you sure you want to force-submit the exam session for student "${username}"? This will lock their answers and finish their attempt.`)) return;
    try {
      await dbService.submitSession(sessionId);
      onRefresh();
    } catch (err) {
      alert("Failed to force submit session.");
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const hStr = h > 0 ? `${h}:` : "";
    const mStr = m.toString().padStart(2, "0");
    const sStr = s.toString().padStart(2, "0");
    
    return `${hStr}${mStr}:${sStr}`;
  };

  return (
    <div className="admin-live-monitor-tab" style={{ textAlign: "left" }}>
      {/* Live header status bar */}
      <div 
        style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between", 
          backgroundColor: "#fffbeb", 
          border: "1px solid #fef3c7", 
          borderRadius: "8px", 
          padding: "16px 20px", 
          marginBottom: "20px" 
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div className="indicator-dot online pulse-dot" style={{ backgroundColor: "#f59e0b", width: "10px", height: "10px", borderRadius: "50%" }}></div>
          <div>
            <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#78350f" }}>Live Active Session Monitor</h3>
            <p style={{ margin: 0, fontSize: "12px", color: "#b45309" }}>Currently viewing all examinations actively being written by students.</p>
          </div>
        </div>
        
        <span style={{ fontSize: "13px", fontWeight: "600", color: "#d97706", backgroundColor: "rgba(245, 158, 11, 0.1)", padding: "4px 8px", borderRadius: "4px" }}>
          {activeSessions.length} Active Student{activeSessions.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Monitor Table */}
      <div className="table-responsive" style={{ backgroundColor: "white", border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
        <table className="summary-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: "12px 16px" }}>Student</th>
              <th>Department</th>
              <th>Exam Name</th>
              <th>Started At</th>
              <th>Time Remaining</th>
              <th>Progress</th>
              <th style={{ textAlign: "right", paddingRight: "24px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {activeSessions.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  There are no active exam sessions right now.
                </td>
              </tr>
            ) : (
              activeSessions.map((session) => {
                const studentName = session.student?.username || "Unknown Student";
                const studentDept = session.student?.department || "N/A";
                
                // Get exam and questions count
                const exam = exams.find((e) => e.title === session.exam_name);
                const totalQuestions = exam?.questions?.length || 0;
                
                // Calculate progress
                const sessionAnswers = answers.filter((a) => a.session_id === session.id);
                const answeredQuestions = sessionAnswers.filter((a) => a.selected_option !== null).length;
                
                // Calculate time remaining
                const remaining = computeRealTimeRemaining(session);
                const isUnderTimeWarning = remaining < 300; // less than 5 minutes

                return (
                  <tr key={session.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "16px", fontWeight: "600", color: "#1e293b" }}>
                      {studentName}
                    </td>
                    <td>
                      <span className="exam-card-dept" style={{ margin: 0, backgroundColor: "#f1f5f9", color: "#475569" }}>
                        {studentDept}
                      </span>
                    </td>
                    <td style={{ color: "#334155", fontWeight: "500" }}>{session.exam_name}</td>
                    <td style={{ color: "#64748b", fontSize: "13px" }}>
                      {new Date(session.started_at).toLocaleTimeString()}
                    </td>
                    <td>
                      <span 
                        style={{ 
                          fontWeight: "bold", 
                          fontFamily: "monospace",
                          color: isUnderTimeWarning ? "#dc2626" : "#2563eb",
                          animation: isUnderTimeWarning ? "blinker 1s linear infinite" : "none"
                        }}
                      >
                        {formatTime(remaining)}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ fontSize: "13px", fontWeight: "600", color: "#475569" }}>
                          {answeredQuestions} / {totalQuestions}
                        </span>
                        {/* Progress mini bar */}
                        <div style={{ width: "60px", height: "6px", backgroundColor: "#e2e8f0", borderRadius: "3px", overflow: "hidden" }}>
                          <div 
                            style={{ 
                              width: `${totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0}%`, 
                              height: "100%", 
                              backgroundColor: "#10b981" 
                            }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td style={{ textAlign: "right", paddingRight: "16px" }}>
                      <button 
                        onClick={() => handleForceSubmit(session.id, studentName)}
                        className="modal-btn cancel"
                        style={{ 
                          padding: "6px 12px", 
                          fontSize: "12px", 
                          display: "flex", 
                          alignItems: "center", 
                          gap: "4px",
                          border: "1px solid #fca5a5",
                          backgroundColor: "#fef2f2",
                          color: "#b91c1c",
                          width: "auto",
                          marginLeft: "auto"
                        }}
                      >
                        <ShieldAlert size={13} />
                        <span>Force Submit</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
