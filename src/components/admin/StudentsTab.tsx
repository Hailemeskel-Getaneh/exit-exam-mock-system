import React, { useState } from "react";
import { Search, Eye, Trash2, X, UserPlus, KeyRound, Copy, Check } from "lucide-react";
import { dbService, type Student, type ExamSession, type Exam, type SavedAnswer, type Department } from "../../supabaseClient";
import { generateSecurePassword } from "../../utils/security";

interface StudentsTabProps {
  students: Student[];
  sessions: ExamSession[];
  exams: Exam[];
  answers: SavedAnswer[];
  departments: Department[];
  onRefresh: () => void;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({
  students,
  sessions,
  exams,
  answers,
  departments,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Add Student modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [newDept, setNewDept] = useState(departments[0]?.name || "");
  const [newTempPwd, setNewTempPwd] = useState("");
  const [addError, setAddError] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; password: string } | null>(null);
  const [copiedField, setCopiedField] = useState<"username" | "password" | null>(null);

  // Reset Password modal
  const [resetStudentTarget, setResetStudentTarget] = useState<Student | null>(null);
  const [resetNewPwd, setResetNewPwd] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

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

  const openAddModal = () => {
    setNewUsername("");
    setNewDept(departments[0]?.name || "");
    // Auto-generate a secure temp password
    const generated = generateSecurePassword();
    setNewTempPwd(generated);
    setAddError("");
    setCreatedCredentials(null);
    setIsAddModalOpen(true);
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    if (!newUsername.trim() || !newDept || !newTempPwd) {
      setAddError("Please fill in all fields.");
      return;
    }
    setAddLoading(true);
    try {
      await dbService.createStudentByAdmin(newUsername.trim(), newDept, newTempPwd);
      setCreatedCredentials({ username: newUsername.trim(), password: newTempPwd });
      onRefresh();
    } catch (err: any) {
      setAddError(err.message || "Failed to create student.");
    } finally {
      setAddLoading(false);
    }
  };

  const openResetModal = (student: Student) => {
    setResetStudentTarget(student);
    const generated = generateSecurePassword();
    setResetNewPwd(generated);
    setResetError("");
    setResetSuccess(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetStudentTarget || !resetNewPwd.trim()) return;
    setResetError("");
    setResetLoading(true);
    try {
      await dbService.adminResetStudentPassword(resetStudentTarget.id, resetNewPwd);
      setResetSuccess(true);
    } catch (err: any) {
      setResetError(err.message || "Failed to reset password.");
    } finally {
      setResetLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: "username" | "password") => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
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
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flexGrow: 1, maxWidth: "500px" }}>
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
          {departments.map(d => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
        {/* Add New Student Button */}
        <button
          onClick={openAddModal}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            backgroundColor: "#0f6cbf", color: "white",
            border: "none", borderRadius: "6px", padding: "9px 16px",
            fontSize: "13px", fontWeight: "600", cursor: "pointer",
            whiteSpace: "nowrap"
          }}
        >
          <UserPlus size={15} />
          Add New Student
        </button>
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
                  const mustChange = (student as any).must_change_password;

                  return (
                    <tr 
                      key={student.id} 
                      style={{ 
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: isCurrentlySelected ? "rgba(15, 108, 191, 0.05)" : "transparent"
                      }}
                    >
                      <td style={{ padding: "16px", fontWeight: "600", color: "#1e293b" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {student.username}
                          {mustChange && (
                            <span style={{ fontSize: "10px", fontWeight: "700", color: "#d97706", backgroundColor: "#fffbeb", padding: "2px 6px", borderRadius: "10px", border: "1px solid #fcd34d" }}>
                              Temp Password
                            </span>
                          )}
                        </div>
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
                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "6px" }}>
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="modal-btn confirm"
                            style={{ padding: "6px 10px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => openResetModal(student)}
                            title="Reset Password"
                            style={{ border: "1px solid #bfdbfe", backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "6px 8px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                          >
                            <KeyRound size={13} />
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
                
                exam.questions.forEach((q: Exam["questions"][0]) => {
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
                      exam.questions.forEach((q: Exam["questions"][0]) => {
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
                          <span style={{ color: "#334155", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "180px" }}>
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

      {/* ─── Add New Student Modal ─── */}
      {isAddModalOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ textAlign: "left", maxWidth: "480px", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 className="modal-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <UserPlus size={18} style={{ color: "#0f6cbf" }} />
                {createdCredentials ? "Student Account Created" : "Add New Student"}
              </h3>
              <button
                onClick={() => { setIsAddModalOpen(false); setCreatedCredentials(null); }}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            {/* After creation: show credentials */}
            {createdCredentials ? (
              <div>
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "16px", marginBottom: "16px" }}>
                  <p style={{ margin: "0 0 12px", fontWeight: "700", color: "#15803d", fontSize: "14px" }}>
                    ✓ Account created successfully! Share these credentials with the student:
                  </p>

                  {/* Username row */}
                  <div style={{ marginBottom: "10px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>USERNAME</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <code style={{ flexGrow: 1, backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "5px", padding: "8px 10px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                        {createdCredentials.username}
                      </code>
                      <button
                        onClick={() => copyToClipboard(createdCredentials.username, "username")}
                        style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "5px", backgroundColor: "white", cursor: "pointer", color: copiedField === "username" ? "#16a34a" : "#64748b", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        {copiedField === "username" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* Temp Password row */}
                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>TEMPORARY PASSWORD</label>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <code style={{ flexGrow: 1, backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "5px", padding: "8px 10px", fontSize: "14px", fontWeight: "600", color: "#1e293b", wordBreak: "break-all" }}>
                        {createdCredentials.password}
                      </code>
                      <button
                        onClick={() => copyToClipboard(createdCredentials.password, "password")}
                        style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "5px", backgroundColor: "white", cursor: "pointer", color: copiedField === "password" ? "#16a34a" : "#64748b", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        {copiedField === "password" ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                <p style={{ fontSize: "12px", color: "#dc2626", margin: "0 0 16px", fontWeight: "500" }}>
                  ⚠ This password will not be shown again. The student must change it on first login.
                </p>

                <div className="modal-actions">
                  <button
                    className="modal-btn confirm"
                    onClick={() => { setIsAddModalOpen(false); setCreatedCredentials(null); }}
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              /* Before creation: form */
              <form onSubmit={handleAddStudent}>
                {addError && (
                  <div className="auth-error-banner" style={{ marginBottom: "12px" }}>
                    <span>{addError}</span>
                  </div>
                )}

                <div className="auth-form-group">
                  <label className="auth-label">Student Username / Full Name</label>
                  <input
                    type="text"
                    className="auth-input"
                    placeholder="e.g. Haile.Getaneh or ST2024001"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    style={{ margin: 0 }}
                    autoFocus
                  />
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Department</label>
                  <select
                    className="auth-input"
                    value={newDept}
                    onChange={(e) => setNewDept(e.target.value)}
                    style={{ margin: 0, backgroundColor: "white", cursor: "pointer" }}
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div className="auth-form-group">
                  <label className="auth-label">Temporary Password</label>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <input
                      type="text"
                      className="auth-input"
                      placeholder="Auto-generated"
                      value={newTempPwd}
                      onChange={(e) => setNewTempPwd(e.target.value)}
                      style={{ margin: 0, flexGrow: 1, fontFamily: "monospace" }}
                    />
                    <button
                      type="button"
                      onClick={() => setNewTempPwd(generateSecurePassword())}
                      style={{ padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "#f8fafc", cursor: "pointer", color: "#475569", fontSize: "12px", whiteSpace: "nowrap" }}
                    >
                      Regenerate
                    </button>
                  </div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>Student will be required to change this password on first login.</p>
                </div>

                <div className="modal-actions" style={{ marginTop: "20px" }}>
                  <button type="button" className="modal-btn cancel" onClick={() => setIsAddModalOpen(false)} disabled={addLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn confirm" disabled={addLoading}>
                    {addLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── Reset Password Modal ─── */}
      {resetStudentTarget && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content" style={{ textAlign: "left", maxWidth: "440px", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h3 className="modal-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                <KeyRound size={18} style={{ color: "#1d4ed8" }} />
                Reset Password
              </h3>
              <button
                onClick={() => setResetStudentTarget(null)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: "18px" }}
              >
                ✕
              </button>
            </div>

            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#475569" }}>
              Resetting password for: <strong style={{ color: "#1e293b" }}>{resetStudentTarget.username}</strong>
            </p>

            {resetSuccess ? (
              <div>
                <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "14px 16px", marginBottom: "14px" }}>
                  <p style={{ margin: "0 0 10px", fontWeight: "700", color: "#15803d", fontSize: "14px" }}>
                    ✓ Password reset successfully!
                  </p>
                  <label style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", display: "block", marginBottom: "4px" }}>NEW TEMPORARY PASSWORD</label>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <code style={{ flexGrow: 1, backgroundColor: "white", border: "1px solid #d1d5db", borderRadius: "5px", padding: "8px 10px", fontSize: "14px", fontWeight: "600", color: "#1e293b", wordBreak: "break-all" }}>
                      {resetNewPwd}
                    </code>
                    <button
                      onClick={() => copyToClipboard(resetNewPwd, "password")}
                      style={{ padding: "8px 10px", border: "1px solid #d1d5db", borderRadius: "5px", backgroundColor: "white", cursor: "pointer", color: copiedField === "password" ? "#16a34a" : "#64748b", display: "flex", alignItems: "center" }}
                    >
                      {copiedField === "password" ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <p style={{ fontSize: "12px", color: "#dc2626", margin: "0 0 16px" }}>⚠ Share this password with the student. They must change it on next login.</p>
                <button className="modal-btn confirm" onClick={() => setResetStudentTarget(null)}>Done</button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword}>
                {resetError && (
                  <div className="auth-error-banner" style={{ marginBottom: "12px" }}>
                    <span>{resetError}</span>
                  </div>
                )}

                <div className="auth-form-group">
                  <label className="auth-label">New Temporary Password</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input
                      type="text"
                      className="auth-input"
                      value={resetNewPwd}
                      onChange={(e) => setResetNewPwd(e.target.value)}
                      style={{ margin: 0, flexGrow: 1, fontFamily: "monospace" }}
                    />
                    <button
                      type="button"
                      onClick={() => setResetNewPwd(generateSecurePassword())}
                      style={{ padding: "9px 12px", border: "1px solid #d1d5db", borderRadius: "6px", backgroundColor: "#f8fafc", cursor: "pointer", color: "#475569", fontSize: "12px", whiteSpace: "nowrap" }}
                    >
                      Regenerate
                    </button>
                  </div>
                  <p style={{ fontSize: "11px", color: "#94a3b8", margin: "4px 0 0" }}>Student will be flagged to change this on next login.</p>
                </div>

                <div className="modal-actions" style={{ marginTop: "20px" }}>
                  <button type="button" className="modal-btn cancel" onClick={() => setResetStudentTarget(null)} disabled={resetLoading}>
                    Cancel
                  </button>
                  <button type="submit" className="modal-btn confirm" disabled={resetLoading}>
                    {resetLoading ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
