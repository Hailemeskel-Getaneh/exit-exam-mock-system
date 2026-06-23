import React, { useState } from "react";
import { Search, Plus, Edit, Trash2, HelpCircle, Eye } from "lucide-react";
import { dbService, type Exam } from "../../supabaseClient";
import { QuestionsManager } from "./QuestionsManager";

interface ExamsTabProps {
  exams: Exam[];
  onRefresh: () => void;
}

export const ExamsTab: React.FC<ExamsTabProps> = ({
  exams,
  onRefresh
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  
  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeExamForQuestions, setActiveExamForQuestions] = useState<Exam | null>(null);
  const [examToEdit, setExamToEdit] = useState<Exam | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Information Technology");
  const [durationMinutes, setDurationMinutes] = useState(40);
  const [passcode, setPasscode] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setDepartment("Information Technology");
    setDurationMinutes(40);
    setPasscode("");
    setDescription("");
    setError("");
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !passcode || !durationMinutes) {
      setError("Please fill out all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await dbService.createExam(title, department, durationMinutes, passcode, description);
      setIsCreateOpen(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to create exam.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (exam: Exam) => {
    setExamToEdit(exam);
    setTitle(exam.title);
    setDepartment(exam.department);
    setDurationMinutes(exam.durationMinutes);
    setPasscode(exam.passcode);
    setDescription(exam.description || "");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examToEdit) return;
    if (!title || !passcode || !durationMinutes) {
      setError("Please fill out all required fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await dbService.updateExam(examToEdit.id, title, department, durationMinutes, passcode, description);
      setIsEditOpen(false);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to update exam.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this exam? This will delete all associated student sessions and questions!")) return;
    try {
      await dbService.deleteExam(id);
      onRefresh();
    } catch (err) {
      alert("Failed to delete exam.");
    }
  };

  // If in Questions Manager mode
  if (activeExamForQuestions) {
    const updatedExam = exams.find(e => e.id === activeExamForQuestions.id) || activeExamForQuestions;
    return (
      <QuestionsManager 
        exam={updatedExam} 
        onBack={() => setActiveExamForQuestions(null)} 
        onRefresh={onRefresh} 
      />
    );
  }

  // Filter exams
  const filteredExams = exams.filter((exam) => {
    const matchesSearch = exam.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "" || exam.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="admin-exams-tab" style={{ textAlign: "left" }}>
      {/* Search / Filter header bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: "12px", flexGrow: 1, maxW: "600px", width: "100%" }}>
          <div style={{ position: "relative", flexGrow: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input 
              type="text" 
              placeholder="Search exams by title..."
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

        <button 
          className="auth-btn" 
          style={{ width: "auto", margin: 0, padding: "10px 20px" }}
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
        >
          <Plus size={16} />
          <span>Create New Exam</span>
        </button>
      </div>

      {/* Exams list table */}
      <div className="table-responsive" style={{ backgroundColor: "white", border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
        <table className="summary-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: "12px 16px" }}>Exam Title</th>
              <th>Department</th>
              <th>Duration</th>
              <th>Passcode</th>
              <th>Questions</th>
              <th style={{ textAlign: "right", paddingRight: "24px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredExams.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  No exams match the search or filter criteria.
                </td>
              </tr>
            ) : (
              filteredExams.map((exam) => (
                <tr key={exam.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontWeight: "600", color: "#1e293b" }}>
                    {exam.title}
                  </td>
                  <td>
                    <span className="exam-card-dept" style={{ margin: 0 }}>{exam.department}</span>
                  </td>
                  <td style={{ color: "#475569", fontWeight: "500" }}>{exam.durationMinutes} Mins</td>
                  <td style={{ fontFamily: "monospace", color: "#0f6cbf", fontWeight: "bold" }}>{exam.passcode}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#1e293b" }}>{exam.questions?.length || 0}</span>
                  </td>
                  <td style={{ textAlign: "right", paddingRight: "16px" }}>
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                      <button 
                        onClick={() => setActiveExamForQuestions(exam)}
                        className="modal-btn confirm"
                        style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <HelpCircle size={13} />
                        <span>Questions</span>
                      </button>
                      <button 
                        onClick={() => handleEditClick(exam)}
                        style={{ border: "1px solid #ced4da", backgroundColor: "#f8f9fa", color: "#495057", padding: "6px 8px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        title="Edit settings"
                      >
                        <Edit size={13} />
                      </button>
                      <button 
                        onClick={() => handleDelete(exam.id)}
                        style={{ border: "1px solid #fecaca", backgroundColor: "#fff5f5", color: "#dc2626", padding: "6px 8px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                        title="Delete exam"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <h3 className="modal-title">Create New Exam</h3>
            
            {error && (
              <div className="auth-error-banner" style={{ margin: 0 }}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="auth-form-group">
                <label className="auth-label">Exam Title *</label>
                <input 
                  type="text" 
                  className="auth-input"
                  placeholder="e.g. Mid-term Information Tech Exam"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Department *</label>
                <select
                  className="auth-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ backgroundColor: "white", color: "#374151" }}
                >
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="General Science">General Science</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="auth-form-group">
                  <label className="auth-label">Duration (Minutes) *</label>
                  <input 
                    type="number" 
                    className="auth-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="auth-form-group">
                  <label className="auth-label">Exam Passcode *</label>
                  <input 
                    type="text" 
                    className="auth-input"
                    placeholder="e.g. 1234"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Description</label>
                <textarea 
                  className="auth-input"
                  placeholder="Provide exam details..."
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: "none" }}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: "8px" }}>
                <button 
                  type="button" 
                  className="modal-btn cancel"
                  onClick={() => { setIsCreateOpen(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn confirm"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && examToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <h3 className="modal-title">Edit Exam Settings</h3>
            
            {error && (
              <div className="auth-error-banner" style={{ margin: 0 }}>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div className="auth-form-group">
                <label className="auth-label">Exam Title *</label>
                <input 
                  type="text" 
                  className="auth-input"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Department *</label>
                <select
                  className="auth-input"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  style={{ backgroundColor: "white", color: "#374151" }}
                >
                  <option value="Information Technology">Information Technology</option>
                  <option value="Mathematics">Mathematics</option>
                  <option value="General Science">General Science</option>
                  <option value="English">English</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="auth-form-group">
                  <label className="auth-label">Duration (Minutes) *</label>
                  <input 
                    type="number" 
                    className="auth-input"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="auth-form-group">
                  <label className="auth-label">Exam Passcode *</label>
                  <input 
                    type="text" 
                    className="auth-input"
                    value={passcode}
                    onChange={(e) => setPasscode(e.target.value)}
                  />
                </div>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Description</label>
                <textarea 
                  className="auth-input"
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ resize: "none" }}
                />
              </div>

              <div className="modal-actions" style={{ marginTop: "8px" }}>
                <button 
                  type="button" 
                  className="modal-btn cancel"
                  onClick={() => { setIsEditOpen(false); resetForm(); }}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="modal-btn confirm"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
