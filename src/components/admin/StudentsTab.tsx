import React, { useState } from "react";
import { Search, Eye, Trash2, Calendar, BookOpen, Award, CheckCircle, AlertCircle, X } from "lucide-react";
import { dbService, type Student, type ExamSession, type Exam, type SavedAnswer } from "../../supabaseClient";

interface StudentsTabProps {
  students: Student[];
  sessions: ExamSession[];
  exams: Exam[];
  answers: SavedAnswer[];
  onRefresh: () => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  sessions,
  exams,
  answers,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const handleDeleteStudent = async (studentId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete student "${username}"? This will delete their login credentials and all associated exam sessions/saved answers!`)) return;
    try {
      await dbService.deleteStudent(studentId);
      if (selectedStudent?.id === studentId) {
        setSelectedStudent(null);
      }
      onRefresh();
    } catch (err) {
      alert("Failed to delete student.");
    }
  };

  // Filter students list
  const filteredStudents = students.filter((s) => {
    const matchesSearch = s.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "" || s.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  // Calculate stats for a single student's attempts
  const getStudentAttempts = (studentId: string) => {
    return sessions.filter((s) => s.student_id === studentId);
  };

  return (
    <div className="admin-students-tab" style={{ textAlign: "left" }}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flexGrow: 1, maxW: "500px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input 
            type="text" 
            placeholder="Search students by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="auth-input"
            style={{ paddingLeft: "36px", width: "100%", margin: 0 }}
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="auth-input"
          style={{ width: "180px", margin: 0, backgroundColor: "white", cursor: "pointer" }}
        >
          <option value="">All Departments</option>
          <option value="Information Technology">Information Technology</option>
          <option value="Mathematics">Mathematics</option>
          <option value="General Science">General Science</option>
          <option value="English">English</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: selectedStudent ? "1fr 400px" : "1fr", gap: "24px", alignItems: "start" }}>
        {/* Main Students List */}
        <div className="table-responsive" style={{ backgroundColor: "white", border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
          <table className="summary-table" style={{ margin: 0 }}>
            <thead>
              <tr>
                <th style={{ padding: "12px 16px" }}>Username</th>
                <th>Department</th>
                <th>Joined Date</th>
                <th>Attempts</th>
                <th style={{ textAlign: "right", paddingRight: "24px" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                    No registered students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => {
                  const attempts = getStudentAttempts(student.id);
                  const isCurrentlySelected = selectedStudent?.id === student.id;

                  return (
                    <tr 
                      key={student.id} 
                      style={{ 
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: isCurrentlySelected ? "rgba(15, 108, 191, 0.05)" : "transparent"
                      }}
                    >
                      <td style={{ padding: "16px", fontWeight: "600", color: "#1e293b" }}>
                        {student.username}
                      </td>
                      <td>
                        <span className="exam-card-dept" style={{ margin: 0, backgroundColor: "#f1f5f9", color: "#475569" }}>
                          {student.department}
                        </span>
                      </td>
                      <td style={{ color: "#64748b", fontSize: "13px" }}>
                        {new Date(student.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ fontWeight: "600", color: "#475569" }}>
                        {attempts.length} attempts
                      </td>
                      <td style={{ textAlign: "right", paddingRight: "16px" }}>
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="modal-btn confirm"
                            style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <Eye size={13} />
                            <span>View History</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteStudent(student.id, student.username)}
                            style={{ border: "1px solid #fecaca", backgroundColor: "#fff5f5", color: "#dc2626", padding: "6px 8px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                            title="Delete student"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Side Panel: Selected Student Details */}
        {selectedStudent && (
          <div 
            style={{ 
              backgroundColor: "white", 
              border: "1px solid #dee2e6", 
              borderRadius: "8px", 
              padding: "24px",
              display: "flex",
              flexDirection: "column",
              gap: "16px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>{selectedStudent.username}</h3>
                <span style={{ fontSize: "12px", color: "#64748b" }}>{selectedStudent.department} Dept</span>
              </div>
              <button 
                onClick={() => setSelectedStudent(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Profile Overview Stats */}
            {(() => {
              const attempts = getStudentAttempts(selectedStudent.id);
              const completed = attempts.filter(a => a.submitted);
              
              let totalPassed = 0;
              let bestPercentage = 0;

              completed.forEach((session) => {
                const exam = exams.find((e) => e.title === session.exam_name);
                if (!exam) return;
                
                const sessionAnswers = answers.filter((a) => a.session_id === session.id);
                let score = 0;
                let totalPts = 0;
                
                exam.questions.forEach((q) => {
                  totalPts += q.points;
                  const ans = sessionAnswers.find((a) => a.question_id === q.id);
                  if (ans && ans.selected_option === q.correctAnswer) {
                    score += q.points;
                  }
                });

                const percent = totalPts > 0 ? (score / totalPts) * 100 : 0;
                if (percent >= 50) totalPassed++;
                if (percent > bestPercentage) bestPercentage = percent;
              });

              return (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", backgroundColor: "#f8fafc", padding: "12px", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>COMPLETED QUIZZES</span>
                    <span style={{ fontSize: "18px", fontWeight: "700", color: "#334155" }}>{completed.length} / {attempts.length}</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <span style={{ fontSize: "11px", color: "#64748b", fontWeight: "600" }}>BEST RESULT</span>
                    <span style={{ fontSize: "18px", fontWeight: "700", color: "#10b981" }}>{bestPercentage.toFixed(1)}%</span>
                  </div>
                </div>
              );
            })()}

            {/* Attempts list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <span style={{ fontSize: "13px", fontWeight: "700", color: "#475569" }}>Exam Log History</span>
              
              {getStudentAttempts(selectedStudent.id).length === 0 ? (
                <p style={{ fontSize: "13px", color: "#64748b", margin: 0, padding: "12px 0", textAlign: "center" }}>No exam attempts registered yet.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
                  {getStudentAttempts(selectedStudent.id).map((session) => {
                    const exam = exams.find((e) => e.title === session.exam_name);
                    const sessionAnswers = answers.filter((a) => a.session_id === session.id);
                    
                    let score = 0;
                    let totalPts = 0;
                    if (exam) {
                      exam.questions.forEach((q) => {
                        totalPts += q.points;
                        const ans = sessionAnswers.find((a) => a.question_id === q.id);
                        if (ans && ans.selected_option === q.correctAnswer) {
                          score += q.points;
                        }
                      });
                    }

                    const percent = totalPts > 0 ? (score / totalPts) * 100 : 0;
                    const isPass = percent >= 50;

                    return (
                      <div 
                        key={session.id} 
                        style={{ 
                          border: "1px solid #e2e8f0", 
                          borderRadius: "6px", 
                          padding: "10px 12px",
                          fontSize: "13px"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: "600", marginBottom: "4px" }}>
                          <span style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxW: "180px" }}>
                            {session.exam_name}
                          </span>
                          
                          {session.submitted ? (
                            <span style={{ color: isPass ? "#16a34a" : "#dc2626" }}>
                              {percent.toFixed(0)}% ({isPass ? "PASS" : "FAIL"})
                            </span>
                          ) : (
                            <span style={{ color: "#d97706", display: "flex", alignItems: "center", gap: "3px" }}>
                              <span className="spinner-mini" style={{ width: "10px", height: "10px", borderWidth: "1.5px" }}></span>
                              <span>Active</span>
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b" }}>
                          <span>{new Date(session.started_at).toLocaleDateString()}</span>
                          <span>Ans: {sessionAnswers.length} qns</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
