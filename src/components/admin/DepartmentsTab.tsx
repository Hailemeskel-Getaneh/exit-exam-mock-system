import React, { useState } from "react";
import { Plus, Edit, Trash2, Building2, AlertTriangle, CheckCircle } from "lucide-react";
import { dbService, type Department } from "../../supabaseClient";

interface DepartmentsTabProps {
  departments: Department[];
  onRefresh: () => void;
}

export const DepartmentsTab: React.FC<DepartmentsTabProps> = ({ departments, onRefresh }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState<Department | null>(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [head, setHead] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setName(""); setDescription(""); setHead(""); setError(""); setSuccess("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setError("Department name is required."); return; }
    setLoading(true); setError("");
    try {
      await dbService.createDepartment(name.trim(), description.trim(), head.trim());
      setSuccess("Department created successfully!");
      resetForm();
      setTimeout(() => { setIsCreateOpen(false); setSuccess(""); onRefresh(); }, 1000);
    } catch (err: any) {
      setError(`${err.message || "Failed to create department."} (If using Supabase, check migrations in supabase_schema.sql)`);
    } finally { setLoading(false); }
  };

  const handleEditClick = (dept: Department) => {
    setDeptToEdit(dept);
    setName(dept.name);
    setDescription(dept.description || "");
    setHead(dept.head || "");
    setError(""); setSuccess("");
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptToEdit || !name.trim()) { setError("Department name is required."); return; }
    setLoading(true); setError("");
    try {
      await dbService.updateDepartment(deptToEdit.id, name.trim(), description.trim(), head.trim());
      setSuccess("Department updated!");
      setTimeout(() => { setIsEditOpen(false); resetForm(); onRefresh(); }, 800);
    } catch (err: any) {
      setError(`${err.message || "Failed to update department."} (If using Supabase, check migrations in supabase_schema.sql)`);
    } finally { setLoading(false); }
  };

  const handleDelete = async (dept: Department) => {
    if (!confirm(`Delete department "${dept.name}"? This does NOT delete exams or students, but they'll lose this department association.`)) return;
    try {
      await dbService.deleteDepartment(dept.id);
      onRefresh();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const deptColors = [
    { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" },
    { bg: "#f0fdf4", border: "#bbf7d0", text: "#15803d" },
    { bg: "#fdf4ff", border: "#e9d5ff", text: "#7e22ce" },
    { bg: "#fff7ed", border: "#fed7aa", text: "#c2410c" },
    { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" },
  ];

  return (
    <div style={{ textAlign: "left" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Departments are used to group exams and students. Changes reflect immediately across the system.
          </p>
        </div>
        <button
          className="auth-btn"
          style={{ width: "auto", margin: 0, padding: "10px 20px" }}
          onClick={() => { resetForm(); setIsCreateOpen(true); }}
        >
          <Plus size={16} />
          <span>Add Department</span>
        </button>
      </div>

      {/* Departments Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
        {departments.map((dept, i) => {
          const color = deptColors[i % deptColors.length];
          return (
            <div
              key={dept.id}
              style={{
                backgroundColor: "white",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                transition: "box-shadow 0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: "40px", height: "40px", borderRadius: "8px",
                    backgroundColor: color.bg, border: `1px solid ${color.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <Building2 size={20} color={color.text} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1e293b" }}>{dept.name}</h3>
                    {dept.head && (
                      <span style={{ fontSize: "12px", color: "#64748b" }}>Head: {dept.head}</span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => handleEditClick(dept)}
                    style={{ border: "1px solid #ced4da", backgroundColor: "#f8f9fa", color: "#495057", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                    title="Edit department"
                  >
                    <Edit size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(dept)}
                    style={{ border: "1px solid #fecaca", backgroundColor: "#fff5f5", color: "#dc2626", padding: "5px 8px", borderRadius: "4px", cursor: "pointer", display: "flex", alignItems: "center" }}
                    title="Delete department"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>

              {dept.description && (
                <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>{dept.description}</p>
              )}

              <div style={{ marginTop: "auto", paddingTop: "8px", borderTop: "1px solid #f1f5f9" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                  Created {new Date(dept.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          );
        })}

        {departments.length === 0 && (
          <div style={{ gridColumn: "span 3", textAlign: "center", padding: "60px 20px", backgroundColor: "white", border: "1px solid #e2e8f0", borderRadius: "10px" }}>
            <Building2 size={40} color="#cbd5e1" style={{ marginBottom: "12px" }} />
            <p style={{ color: "#64748b", margin: 0 }}>No departments yet. Add one to get started.</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <h3 className="modal-title">Add New Department</h3>

            {error && <div className="auth-error-banner" style={{ margin: 0 }}><AlertTriangle size={14} /><span>{error}</span></div>}
            {success && <div className="auth-info-banner" style={{ margin: 0 }}><CheckCircle size={14} /><span>{success}</span></div>}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="auth-form-group">
                <label className="auth-label">Department Name *</label>
                <input type="text" className="auth-input" placeholder="e.g. Computer Science" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Description</label>
                <textarea className="auth-input" placeholder="Brief description of this department..." rows={2} value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "none" }} />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Department Head / Coordinator</label>
                <input type="text" className="auth-input" placeholder="e.g. Dr. Abebe Kebede" value={head} onChange={e => setHead(e.target.value)} />
              </div>
              <div className="modal-actions" style={{ marginTop: "4px" }}>
                <button type="button" className="modal-btn cancel" onClick={() => { setIsCreateOpen(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="modal-btn confirm" disabled={loading}>{loading ? "Creating..." : "Create Department"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditOpen && deptToEdit && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "460px" }}>
            <h3 className="modal-title">Edit Department</h3>

            {error && <div className="auth-error-banner" style={{ margin: 0 }}><AlertTriangle size={14} /><span>{error}</span></div>}
            {success && <div className="auth-info-banner" style={{ margin: 0 }}><CheckCircle size={14} /><span>{success}</span></div>}

            <form onSubmit={handleEdit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="auth-form-group">
                <label className="auth-label">Department Name *</label>
                <input type="text" className="auth-input" value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Description</label>
                <textarea className="auth-input" rows={2} value={description} onChange={e => setDescription(e.target.value)} style={{ resize: "none" }} />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Department Head / Coordinator</label>
                <input type="text" className="auth-input" placeholder="e.g. Dr. Abebe Kebede" value={head} onChange={e => setHead(e.target.value)} />
              </div>
              <div className="modal-actions" style={{ marginTop: "4px" }}>
                <button type="button" className="modal-btn cancel" onClick={() => { setIsEditOpen(false); resetForm(); }}>Cancel</button>
                <button type="submit" className="modal-btn confirm" disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
