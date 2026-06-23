import React, { useState } from "react";
import { Plus, Trash2, Edit2, ArrowLeft, Check, X } from "lucide-react";
import { dbService, type Exam, type Question } from "../../supabaseClient";

interface QuestionsManagerProps {
  exam: Exam;
  onBack: () => void;
  onRefresh: () => void;
}

export const QuestionsManager: React.FC<QuestionsManagerProps> = ({
  exam,
  onBack,
  onRefresh
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Form States
  const [text, setText] = useState("");
  const [optionA, setOptionA] = useState("");
  const [optionB, setOptionB] = useState("");
  const [optionC, setOptionC] = useState("");
  const [optionD, setOptionD] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("a");
  const [points, setPoints] = useState(1.0);
  const [error, setError] = useState("");

  const resetForm = () => {
    setText("");
    setOptionA("");
    setOptionB("");
    setOptionC("");
    setOptionD("");
    setCorrectAnswer("a");
    setPoints(1.0);
    setError("");
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text || !optionA || !optionB || !optionC || !optionD) {
      setError("Please fill out all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await dbService.createQuestion(
        exam.id,
        text,
        { a: optionA, b: optionB, c: optionC, d: optionD },
        correctAnswer,
        points
      );
      resetForm();
      setIsAdding(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to add question.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (q: Question) => {
    setEditingQuestionId(q.id);
    setText(q.text);
    setOptionA(q.options.a);
    setOptionB(q.options.b);
    setOptionC(q.options.c);
    setOptionD(q.options.d);
    setCorrectAnswer(q.correctAnswer);
    setPoints(q.points);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestionId) return;
    if (!text || !optionA || !optionB || !optionC || !optionD) {
      setError("Please fill out all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await dbService.updateQuestion(
        editingQuestionId,
        text,
        { a: optionA, b: optionB, c: optionC, d: optionD },
        correctAnswer,
        points
      );
      setEditingQuestionId(null);
      resetForm();
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to update question.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (qId: number) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await dbService.deleteQuestion(qId);
      onRefresh();
    } catch (err) {
      alert("Failed to delete question.");
    }
  };

  return (
    <div className="questions-manager-container" style={{ textAlign: "left" }}>
      {/* Header Row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #e2e8f0", paddingBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button onClick={onBack} className="moodle-back-btn" style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 12px" }}>
            <ArrowLeft size={16} />
            <span>Exams List</span>
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700" }}>Manage Questions</h2>
            <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>{exam.title} ({exam.questions.length} questions)</p>
          </div>
        </div>

        {!isAdding && editingQuestionId === null && (
          <button 
            className="auth-btn" 
            style={{ width: "auto", margin: 0, padding: "8px 16px" }}
            onClick={() => { resetForm(); setIsAdding(true); }}
          >
            <Plus size={16} />
            <span>Add Question</span>
          </button>
        )}
      </div>

      {error && (
        <div className="auth-error-banner" style={{ marginBottom: "16px" }}>
          <span>{error}</span>
        </div>
      )}

      {/* Add / Edit Form */}
      {(isAdding || editingQuestionId !== null) && (
        <div className="auth-card" style={{ maxWidth: "100%", marginBottom: "24px", padding: "24px" }}>
          <h3 style={{ marginTop: 0, fontSize: "16px", fontWeight: "700", display: "flex", justifyContent: "space-between" }}>
            <span>{isAdding ? "New Question Details" : "Edit Question"}</span>
            <button 
              onClick={() => { setIsAdding(false); setEditingQuestionId(null); resetForm(); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
            >
              <X size={18} />
            </button>
          </h3>

          <form onSubmit={isAdding ? handleAddSubmit : handleEditSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className="auth-form-group">
              <label className="auth-label">Question Text</label>
              <textarea
                className="auth-input"
                rows={3}
                placeholder="Type the question here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="auth-form-group">
                <label className="auth-label">Option A</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Answer choice A"
                  value={optionA}
                  onChange={(e) => setOptionA(e.target.value)}
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Option B</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Answer choice B"
                  value={optionB}
                  onChange={(e) => setOptionB(e.target.value)}
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Option C</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Answer choice C"
                  value={optionC}
                  onChange={(e) => setOptionC(e.target.value)}
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Option D</label>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Answer choice D"
                  value={optionD}
                  onChange={(e) => setOptionD(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="auth-form-group">
                <label className="auth-label">Correct Answer</label>
                <select
                  className="auth-input"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  style={{ backgroundColor: "white", color: "#374151" }}
                >
                  <option value="a">A</option>
                  <option value="b">B</option>
                  <option value="c">C</option>
                  <option value="d">D</option>
                </select>
              </div>

              <div className="auth-form-group">
                <label className="auth-label">Points Weight</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  className="auth-input"
                  value={points}
                  onChange={(e) => setPoints(parseFloat(e.target.value) || 1)}
                />
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px" }}>
              <button 
                type="button" 
                className="modal-btn cancel" 
                onClick={() => { setIsAdding(false); setEditingQuestionId(null); resetForm(); }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="modal-btn confirm" 
                disabled={loading}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {loading ? <span className="spinner-mini"></span> : <Check size={16} />}
                <span>{isAdding ? "Create Question" : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        {exam.questions.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
            <p style={{ margin: 0, color: "#64748b" }}>No questions have been added to this exam yet.</p>
          </div>
        ) : (
          exam.questions.map((q, idx) => (
            <div 
              key={q.id} 
              className="question-card-item"
              style={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "20px",
                display: "flex",
                gap: "16px",
                transition: "border-color 0.2s",
                position: "relative"
              }}
            >
              <div 
                style={{ 
                  width: "36px", 
                  height: "36px", 
                  borderRadius: "50%", 
                  backgroundColor: "#f1f5f9", 
                  color: "#475569", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center", 
                  fontWeight: "bold",
                  fontSize: "14px",
                  flexShrink: 0
                }}
              >
                {idx + 1}
              </div>

              <div style={{ flexGrow: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "8px" }}>
                  <p style={{ margin: 0, fontSize: "15px", fontWeight: "600", color: "#1e293b", lineHeight: "1.5" }}>
                    {q.text}
                  </p>
                  <span style={{ fontSize: "11px", fontWeight: "600", color: "#0f6cbf", backgroundColor: "rgba(15, 108, 191, 0.08)", padding: "3px 6px", borderRadius: "4px", whiteSpace: "nowrap" }}>
                    {q.points.toFixed(1)} Pts
                  </span>
                </div>

                {/* Options list */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", margin: "12px 0" }}>
                  {Object.entries(q.options).map(([key, val]) => {
                    const isCorrect = q.correctAnswer === key;
                    return (
                      <div 
                        key={key} 
                        style={{ 
                          fontSize: "13px", 
                          padding: "6px 10px", 
                          borderRadius: "4px",
                          backgroundColor: isCorrect ? "#f0fdf4" : "#f8fafc",
                          border: isCorrect ? "1px solid #bbf7d0" : "1px solid #f1f5f9",
                          color: isCorrect ? "#15803d" : "#475569",
                          display: "flex",
                          gap: "6px",
                          fontWeight: isCorrect ? "600" : "normal"
                        }}
                      >
                        <span style={{ textTransform: "uppercase" }}>{key}.</span>
                        <span>{val}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions row */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid #f1f5f9", paddingTop: "10px", marginTop: "10px" }}>
                  <button 
                    onClick={() => handleEditClick(q)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600", color: "#4b5563" }}
                  >
                    <Edit2 size={12} />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => handleDelete(q.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", fontWeight: "600", color: "#dc2626" }}
                  >
                    <Trash2 size={12} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
