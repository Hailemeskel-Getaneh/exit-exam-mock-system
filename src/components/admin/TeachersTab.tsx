import React, { useState } from "react";
import { Search, Trash2, UserPlus, X, Eye, EyeOff } from "lucide-react";
import { dbService, type Teacher, type Department } from "../../supabaseClient";

interface TeachersTabProps {
  teachers: Teacher[];
  departments: Department[];
  onRefresh: () => void;
}

export const TeachersTab: React.FC<TeachersTabProps> = ({
  teachers,
  departments,
  onRefresh,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Create form state
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newDept, setNewDept] = useState(departments[0]?.name || "");

  const filteredTeachers = teachers.filter((t) => {
    const matchesSearch = t.username.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "" || t.department === deptFilter;
    return matchesSearch && matchesDept;
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim() || !newDept) {
      setError("Please fill out all fields.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await dbService.registerTeacher(newUsername.trim(), newPassword.trim(), newDept);
      setNewUsername("");
      setNewPassword("");
      setNewDept(departments[0]?.name || "");
      setIsCreating(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to create teacher account.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teacherId: string, username: string) => {
    if (!confirm(`Are you sure you want to delete teacher "${username}"? This action cannot be undone.`)) return;
    try {
      await dbService.deleteTeacher(teacherId);
      onRefresh();
    } catch {
      alert("Failed to delete teacher account.");
    }
  };

  return (
    <div className="admin-teachers-tab" style={{ textAlign: "left" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flexGrow: 1, maxWidth: "400px" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search teachers by username..."
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
          {departments.map((d) => (
            <option key={d.id} value={d.name}>{d.name}</option>
          ))}
        </select>
        <button
          className="auth-btn"
          style={{ width: "auto", margin: 0, padding: "8px 16px", display: "flex", alignItems: "center", gap: "8px" }}
          onClick={() => { setIsCreating(true); setError(""); }}
        >
          <UserPlus size={16} />
          <span>Add Teacher</span>
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
        <div style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 20px", minWidth: "150px" }}>
          <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px" }}>Total Teachers</div>
          <div style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b" }}>{teachers.length}</div>
        </div>
        {departments.slice(0, 3).map((dept) => (
          <div key={dept.id} style={{ backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "14px 20px", minWidth: "150px" }}>
            <div style={{ fontSize: "11px", fontWeight: "600", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "120px" }}>{dept.name}</div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b" }}>
              {teachers.filter((t) => t.department === dept.name).length}
            </div>
          </div>
        ))}
      </div>

      {/* Create Teacher Modal */}
      {isCreating && (
        <div className="auth-card" style={{ maxWidth: "520px", marginBottom: "24px", padding: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Create Teacher Account</h3>
            <button onClick={() => { setIsCreating(false); setError(""); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
              <X size={18} />
            </button>
          </div>

          {error && (
            <div className="auth-error-banner" style={{ marginBottom: "14px" }}>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="auth-form-group">
              <label className="auth-label">Username</label>
              <input
                type="text"
                className="auth-input"
                placeholder="e.g. dr.bekele"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                autoFocus
              />
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  className="auth-input"
                  placeholder="Set a secure password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  style={{ paddingRight: "42px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="auth-form-group">
              <label className="auth-label">Department</label>
              <select
                className="auth-input"
                value={newDept}
                onChange={(e) => setNewDept(e.target.value)}
                style={{ backgroundColor: "white" }}
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "4px" }}>
              <button type="button" className="modal-btn cancel" onClick={() => { setIsCreating(false); setError(""); }}>
                Cancel
              </button>
              <button type="submit" className="modal-btn confirm" disabled={loading} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                {loading ? <span className="spinner-mini" /> : <UserPlus size={15} />}
                <span>Create Teacher</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Teachers Table */}
      <div className="table-responsive" style={{ backgroundColor: "white", border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
        <table className="summary-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: "12px 16px" }}>Username</th>
              <th>Department</th>
              <th>Member Since</th>
              <th style={{ textAlign: "right", paddingRight: "24px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredTeachers.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  {searchTerm || deptFilter ? "No teachers match the current filter." : "No teacher accounts have been created yet."}
                </td>
              </tr>
            ) : (
              filteredTeachers.map((teacher) => (
                <tr key={teacher.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "14px 16px", fontWeight: "600", color: "#1e293b" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "34px", height: "34px", borderRadius: "50%",
                        background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: "700", fontSize: "13px", color: "white", flexShrink: 0
                      }}>
                        {teacher.username.substring(0, 2).toUpperCase()}
                      </div>
                      {teacher.username}
                    </div>
                  </td>
                  <td>
                    <span className="exam-card-dept" style={{ margin: 0, backgroundColor: "#f1f5f9", color: "#475569" }}>
                      {teacher.department}
                    </span>
                  </td>
                  <td style={{ color: "#64748b", fontSize: "13px" }}>
                    {new Date(teacher.created_at).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric"
                    })}
                  </td>
                  <td style={{ textAlign: "right", paddingRight: "16px" }}>
                    <button
                      onClick={() => handleDelete(teacher.id, teacher.username)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "4px",
                        fontSize: "12px", fontWeight: "600", color: "#dc2626",
                        marginLeft: "auto"
                      }}
                    >
                      <Trash2 size={13} />
                      <span>Remove</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
