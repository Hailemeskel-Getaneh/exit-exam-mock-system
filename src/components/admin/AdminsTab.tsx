import React, { useState } from "react";
import { Plus, Trash2, KeyRound, ShieldCheck, AlertTriangle, CheckCircle } from "lucide-react";
import { dbService, type Admin } from "../../supabaseClient";

interface AdminsTabProps {
  admins: Admin[];
  currentAdminId: string;
  onRefresh: () => void;
}

export const AdminsTab: React.FC<AdminsTabProps> = ({ admins, currentAdminId, onRefresh }) => {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [pwdAdminId, setPwdAdminId] = useState<string | null>(null);
  const [pwdAdminName, setPwdAdminName] = useState("");

  // Create form
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  // Password change form
  const [newPwd, setNewPwd] = useState("");
  const [newPwdConfirm, setNewPwdConfirm] = useState("");
  const [pwdError, setPwdError] = useState("");
  const [pwdSuccess, setPwdSuccess] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword) { setCreateError("All fields are required."); return; }
    if (newPassword !== newPasswordConfirm) { setCreateError("Passwords do not match."); return; }
    if (newPassword.length < 4) { setCreateError("Password must be at least 4 characters."); return; }
    setCreateLoading(true); setCreateError("");
    try {
      await dbService.createAdmin(newUsername.trim(), newPassword);
      setCreateSuccess("Admin account created!");
      setNewUsername(""); setNewPassword(""); setNewPasswordConfirm("");
      setTimeout(() => { setIsCreateOpen(false); setCreateSuccess(""); onRefresh(); }, 900);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create admin.");
    } finally { setCreateLoading(false); }
  };

  const handleDelete = async (admin: Admin) => {
    if (admin.id === currentAdminId) { alert("You cannot delete your own account."); return; }
    if (!confirm(`Delete admin account "${admin.username}"? This action cannot be undone.`)) return;
    try {
      await dbService.deleteAdmin(admin.id);
      onRefresh();
    } catch (err: any) {
      alert("Failed to delete: " + err.message);
    }
  };

  const openPwdModal = (admin: Admin) => {
    setPwdAdminId(admin.id);
    setPwdAdminName(admin.username);
    setNewPwd(""); setNewPwdConfirm(""); setPwdError(""); setPwdSuccess("");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPwd) { setPwdError("Password cannot be empty."); return; }
    if (newPwd !== newPwdConfirm) { setPwdError("Passwords do not match."); return; }
    if (newPwd.length < 4) { setPwdError("Password must be at least 4 characters."); return; }
    setPwdLoading(true); setPwdError("");
    try {
      await dbService.updateAdminPassword(pwdAdminId!, newPwd);
      setPwdSuccess("Password updated successfully!");
      setTimeout(() => { setPwdAdminId(null); setPwdSuccess(""); }, 1000);
    } catch (err: any) {
      setPwdError(err.message || "Failed to update password.");
    } finally { setPwdLoading(false); }
  };

  return (
    <div style={{ textAlign: "left" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>
            Admin accounts have full system access. Manage them carefully. You cannot delete your own account.
          </p>
        </div>
        <button
          className="auth-btn"
          style={{ width: "auto", margin: 0, padding: "10px 20px" }}
          onClick={() => { setNewUsername(""); setNewPassword(""); setNewPasswordConfirm(""); setCreateError(""); setCreateSuccess(""); setIsCreateOpen(true); }}
        >
          <Plus size={16} />
          <span>Add Admin Account</span>
        </button>
      </div>

      {/* Admins Table */}
      <div style={{ backgroundColor: "white", border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
        <table className="summary-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: "12px 16px" }}>Username</th>
              <th>Role</th>
              <th>Created</th>
              <th style={{ textAlign: "right", paddingRight: "16px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No admin accounts found.</td>
              </tr>
            ) : (
              admins.map(admin => {
                const isMe = admin.id === currentAdminId;
                return (
                  <tr key={admin.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{
                          width: "34px", height: "34px", borderRadius: "50%",
                          backgroundColor: isMe ? "#0f6cbf20" : "#f1f5f9",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontWeight: "700", fontSize: "13px", color: isMe ? "#0f6cbf" : "#475569"
                        }}>
                          {admin.username.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span style={{ fontWeight: "600", color: "#1e293b", fontSize: "14px" }}>{admin.username}</span>
                          {isMe && <span style={{ marginLeft: "8px", fontSize: "11px", color: "#0f6cbf", fontWeight: "600" }}>(You)</span>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: "5px",
                        padding: "3px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "600",
                        color: "#7c3aed", backgroundColor: "#f5f3ff", border: "1px solid #ddd6fe"
                      }}>
                        <ShieldCheck size={12} />
                        System Administrator
                      </span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "13px" }}>
                      {new Date(admin.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ paddingRight: "16px" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                        <button
                          onClick={() => openPwdModal(admin)}
                          style={{
                            border: "1px solid #ced4da", backgroundColor: "#f8f9fa",
                            color: "#495057", padding: "6px 10px", borderRadius: "4px",
                            cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", fontSize: "12px"
                          }}
                        >
                          <KeyRound size={13} />
                          <span>Change Password</span>
                        </button>
                        <button
                          onClick={() => handleDelete(admin)}
                          disabled={isMe}
                          style={{
                            border: isMe ? "1px solid #e2e8f0" : "1px solid #fecaca",
                            backgroundColor: isMe ? "#f8f9fa" : "#fff5f5",
                            color: isMe ? "#cbd5e1" : "#dc2626",
                            padding: "6px 8px", borderRadius: "4px",
                            cursor: isMe ? "not-allowed" : "pointer",
                            display: "flex", alignItems: "center"
                          }}
                          title={isMe ? "Cannot delete your own account" : "Delete admin"}
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

      {/* Create Admin Modal */}
      {isCreateOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "420px" }}>
            <h3 className="modal-title">Create Admin Account</h3>
            <p className="modal-body-text">This account will have full access to the admin portal.</p>

            {createError && <div className="auth-error-banner" style={{ margin: 0 }}><AlertTriangle size={14} /><span>{createError}</span></div>}
            {createSuccess && <div className="auth-info-banner" style={{ margin: 0 }}><CheckCircle size={14} /><span>{createSuccess}</span></div>}

            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="auth-form-group">
                <label className="auth-label">Username *</label>
                <input type="text" className="auth-input" placeholder="e.g. dr.haile" value={newUsername} onChange={e => setNewUsername(e.target.value)} autoComplete="off" />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Password *</label>
                <input type="password" className="auth-input" placeholder="Minimum 4 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Confirm Password *</label>
                <input type="password" className="auth-input" placeholder="Re-enter password" value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="modal-actions" style={{ marginTop: 0 }}>
                <button type="button" className="modal-btn cancel" onClick={() => setIsCreateOpen(false)}>Cancel</button>
                <button type="submit" className="modal-btn confirm" disabled={createLoading}>
                  {createLoading ? "Creating..." : "Create Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {pwdAdminId && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "400px" }}>
            <h3 className="modal-title">Change Password</h3>
            <p className="modal-body-text">Setting new password for admin: <strong>{pwdAdminName}</strong></p>

            {pwdError && <div className="auth-error-banner" style={{ margin: 0 }}><AlertTriangle size={14} /><span>{pwdError}</span></div>}
            {pwdSuccess && <div className="auth-info-banner" style={{ margin: 0 }}><CheckCircle size={14} /><span>{pwdSuccess}</span></div>}

            <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="auth-form-group">
                <label className="auth-label">New Password *</label>
                <input type="password" className="auth-input" placeholder="Minimum 4 characters" value={newPwd} onChange={e => setNewPwd(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="auth-form-group">
                <label className="auth-label">Confirm New Password *</label>
                <input type="password" className="auth-input" placeholder="Re-enter new password" value={newPwdConfirm} onChange={e => setNewPwdConfirm(e.target.value)} autoComplete="new-password" />
              </div>
              <div className="modal-actions" style={{ marginTop: 0 }}>
                <button type="button" className="modal-btn cancel" onClick={() => setPwdAdminId(null)}>Cancel</button>
                <button type="submit" className="modal-btn confirm" disabled={pwdLoading}>
                  {pwdLoading ? "Updating..." : "Update Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
