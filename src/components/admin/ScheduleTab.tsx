import React, { useState } from "react";
import { Calendar, Power, Clock, CheckCircle2, XCircle } from "lucide-react";
import { dbService, type Exam } from "../../supabaseClient";

interface ScheduleTabProps {
  exams: Exam[];
  onRefresh: () => void;
}

export const ScheduleTab: React.FC<ScheduleTabProps> = ({ exams, onRefresh }) => {
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [schedulingExam, setSchedulingExam] = useState<Exam | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [untilDate, setUntilDate] = useState("");
  const [schedError, setSchedError] = useState("");
  const [schedLoading, setSchedLoading] = useState(false);

  const handleToggleActive = async (exam: Exam) => {
    setTogglingId(exam.id);
    try {
      const newState = !(exam as any).is_active;
      await dbService.toggleExamActive(exam.id, newState);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to toggle: ${err.message}\n\nIf you are using a live Supabase database, please make sure you have run the SQL migrations from the bottom of supabase_schema.sql.`);
    } finally {
      setTogglingId(null);
    }
  };

  const openScheduleModal = (exam: Exam) => {
    setSchedulingExam(exam);
    setFromDate((exam as any).available_from ? (exam as any).available_from.substring(0, 16) : "");
    setUntilDate((exam as any).available_until ? (exam as any).available_until.substring(0, 16) : "");
    setSchedError("");
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingExam) return;
    if (fromDate && untilDate && new Date(fromDate) >= new Date(untilDate)) {
      setSchedError("'Available Until' must be after 'Available From'.");
      return;
    }
    setSchedLoading(true);
    try {
      await dbService.setExamSchedule(
        schedulingExam.id,
        fromDate ? new Date(fromDate).toISOString() : null,
        untilDate ? new Date(untilDate).toISOString() : null,
      );
      setSchedulingExam(null);
      onRefresh();
    } catch (err: any) {
      setSchedError(`${err.message || "Failed to save schedule."} (If using Supabase, please run the migrations at the bottom of supabase_schema.sql)`);
    } finally {
      setSchedLoading(false);
    }
  };

  const getStatusBadge = (exam: Exam) => {
    const isActive = (exam as any).is_active !== false; // default true if not set
    const availFrom: string | null = (exam as any).available_from || null;
    const availUntil: string | null = (exam as any).available_until || null;
    const now = new Date();

    if (!isActive) {
      return { label: "Inactive", color: "#6b7280", bg: "#f3f4f6", icon: <XCircle size={13} /> };
    }
    if (availFrom && new Date(availFrom) > now) {
      return { label: "Scheduled", color: "#d97706", bg: "#fffbeb", icon: <Clock size={13} /> };
    }
    if (availUntil && new Date(availUntil) < now) {
      return { label: "Expired", color: "#dc2626", bg: "#fef2f2", icon: <XCircle size={13} /> };
    }
    return { label: "Active", color: "#16a34a", bg: "#f0fdf4", icon: <CheckCircle2 size={13} /> };
  };

  // Sort: active first
  const sortedExams = [...exams].sort((a, b) => {
    const aActive = (a as any).is_active !== false;
    const bActive = (b as any).is_active !== false;
    if (aActive && !bActive) return -1;
    if (!aActive && bActive) return 1;
    return 0;
  });

  return (
    <div style={{ textAlign: "left" }}>
      <div style={{ marginBottom: "20px" }}>
        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
          Control which exams are accessible to students. Toggle exams on/off, or set precise date-time windows for exam availability.
        </p>
      </div>

      <div style={{ backgroundColor: "white", border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
        <table className="summary-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: "12px 16px" }}>Exam Title</th>
              <th>Department</th>
              <th>Duration</th>
              <th>Available From</th>
              <th>Available Until</th>
              <th>Status</th>
              <th style={{ textAlign: "right", paddingRight: "16px" }}>Controls</th>
            </tr>
          </thead>
          <tbody>
            {sortedExams.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  No exams created yet. Go to Manage Exams to add exams.
                </td>
              </tr>
            ) : (
              sortedExams.map((exam) => {
                const badge = getStatusBadge(exam);
                const isActive = (exam as any).is_active !== false;
                const availFrom: string | null = (exam as any).available_from || null;
                const availUntil: string | null = (exam as any).available_until || null;
                const isToggling = togglingId === exam.id;

                return (
                  <tr key={exam.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: isActive ? 1 : 0.65 }}>
                    <td style={{ padding: "14px 16px", fontWeight: "600", color: "#1e293b" }}>
                      {exam.title}
                    </td>
                    <td>
                      <span className="exam-card-dept" style={{ margin: 0 }}>{exam.department}</span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "13px" }}>{exam.durationMinutes} mins</td>
                    <td style={{ fontSize: "13px", color: availFrom ? "#334155" : "#94a3b8" }}>
                      {availFrom ? new Date(availFrom).toLocaleString() : "—  No restriction"}
                    </td>
                    <td style={{ fontSize: "13px", color: availUntil ? "#334155" : "#94a3b8" }}>
                      {availUntil ? new Date(availUntil).toLocaleString() : "—  No restriction"}
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                        color: badge.color, backgroundColor: badge.bg, border: `1px solid ${badge.color}30`
                      }}>
                        {badge.icon}
                        {badge.label}
                      </span>
                    </td>
                    <td style={{ paddingRight: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        {/* Schedule button */}
                        <button
                          onClick={() => openScheduleModal(exam)}
                          style={{
                            border: "1px solid #ced4da", backgroundColor: "#f8f9fa",
                            color: "#495057", padding: "6px 10px", borderRadius: "4px",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px"
                          }}
                          title="Set schedule"
                        >
                          <Calendar size={13} />
                          <span>Schedule</span>
                        </button>
                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(exam)}
                          disabled={isToggling}
                          style={{
                            border: isActive ? "1px solid #fecaca" : "1px solid #bbf7d0",
                            backgroundColor: isActive ? "#fff5f5" : "#f0fdf4",
                            color: isActive ? "#dc2626" : "#16a34a",
                            padding: "6px 10px", borderRadius: "4px",
                            cursor: isToggling ? "wait" : "pointer",
                            display: "flex", alignItems: "center", gap: "4px", fontSize: "12px"
                          }}
                        >
                          <Power size={13} />
                          <span>{isToggling ? "..." : isActive ? "Deactivate" : "Activate"}</span>
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

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", marginTop: "16px", flexWrap: "wrap" }}>
        {[
          { label: "Active — exam is open to eligible students", color: "#16a34a", bg: "#f0fdf4" },
          { label: "Scheduled — will open at the set date", color: "#d97706", bg: "#fffbeb" },
          { label: "Expired — availability window has passed", color: "#dc2626", bg: "#fef2f2" },
          { label: "Inactive — manually disabled", color: "#6b7280", bg: "#f3f4f6" },
        ].map(s => (
          <span key={s.label} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#64748b" }}>
            <span style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: s.color, flexShrink: 0 }} />
            {s.label}
          </span>
        ))}
      </div>

      {/* Schedule Modal */}
      {schedulingExam && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px" }}>
            <h3 className="modal-title">Set Exam Schedule</h3>
            <p className="modal-body-text">
              Setting availability for: <strong>{schedulingExam.title}</strong>
            </p>
            <div style={{ padding: "12px", backgroundColor: "#f8fafc", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "13px", color: "#64748b" }}>
              Leave both fields empty for always-available. Set only "Available Until" to auto-close at a deadline.
            </div>

            {schedError && (
              <div className="auth-error-banner" style={{ margin: 0 }}>
                <span>{schedError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSchedule} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="auth-form-group">
                <label className="auth-label">Available From (optional)</label>
                <input
                  type="datetime-local"
                  className="auth-input"
                  value={fromDate}
                  onChange={e => setFromDate(e.target.value)}
                />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Available Until (optional)</label>
                <input
                  type="datetime-local"
                  className="auth-input"
                  value={untilDate}
                  onChange={e => setUntilDate(e.target.value)}
                />
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  style={{
                    flex: 1, padding: "8px", border: "1px solid #fecaca", backgroundColor: "#fff5f5",
                    color: "#dc2626", borderRadius: "6px", cursor: "pointer", fontSize: "13px", fontWeight: "600"
                  }}
                  onClick={() => { setFromDate(""); setUntilDate(""); }}
                >
                  Clear Dates
                </button>
              </div>
              <div className="modal-actions" style={{ marginTop: 0 }}>
                <button type="button" className="modal-btn cancel" onClick={() => setSchedulingExam(null)}>Cancel</button>
                <button type="submit" className="modal-btn confirm" disabled={schedLoading}>
                  {schedLoading ? "Saving..." : "Save Schedule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
