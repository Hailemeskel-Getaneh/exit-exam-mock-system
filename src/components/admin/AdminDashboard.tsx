import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Activity, 
  FileSpreadsheet, 
  LogOut, 
  RefreshCw 
} from "lucide-react";
import { OverviewTab } from "./OverviewTab";
import { ExamsTab } from "./ExamsTab";
import { StudentsTab } from "./StudentsTab";
import { LiveMonitorTab } from "./LiveMonitorTab";
import { GradesTab } from "./GradesTab";
import { dbService, type Exam, type Student, type ExamSession, type SavedAnswer } from "../../supabaseClient";

interface AdminDashboardProps {
  onLogout: () => void;
  adminName: string;
}

type AdminTab = "OVERVIEW" | "EXAMS" | "STUDENTS" | "MONITOR" | "GRADES";

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  adminName
}) => {
  const [activeTab, setActiveTab] = useState<AdminTab>("OVERVIEW");
  const [loading, setLoading] = useState(true);

  // Database States
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [answers, setAnswers] = useState<SavedAnswer[]>([]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch exams (which triggers seeding if database is empty)
      const fetchedExams = await dbService.getExams();
      setExams(fetchedExams);

      // 2. Fetch students, sessions, and saved answers
      const fetchedStudents = await dbService.getAllStudents();
      setStudents(fetchedStudents);

      const fetchedSessions = await dbService.getAllSessions();
      setSessions(fetchedSessions);

      // Fetch saved answers. If Supabase is active we do a select, else we fetch local mock answers
      let fetchedAnswers: SavedAnswer[] = [];
      if (dbService.getAnswers) {
        // We can fetch answers for all sessions in parallel, or if offline we read local storage
        // To be safe and clean, we fetch all answers using custom getAnswers or parse localstorage
        const { supabase, isSupabaseConfigured } = await import("../../supabaseClient");
        if (isSupabaseConfigured && supabase) {
          const { data, error } = await supabase.from("saved_answers").select("*");
          if (!error && data) {
            fetchedAnswers = data;
          }
        } else {
          fetchedAnswers = JSON.parse(localStorage.getItem("mock_saved_answers") || "[]");
        }
      }
      setAnswers(fetchedAnswers);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  return (
    <div className="admin-layout" style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f8f9fa", width: "100%" }}>
      {/* Sidebar navigation */}
      <div 
        className="admin-sidebar" 
        style={{ 
          width: "260px", 
          backgroundColor: "#1e293b", 
          color: "#f1f5f9", 
          display: "flex", 
          flexDirection: "column", 
          flexShrink: 0 
        }}
      >
        {/* Brand Header */}
        <div 
          style={{ 
            padding: "24px", 
            borderBottom: "1px solid rgba(255,255,255,0.08)", 
            display: "flex", 
            alignItems: "center", 
            gap: "12px" 
          }}
        >
          <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: "#0f6cbf", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
            A
          </div>
          <div>
            <span style={{ fontSize: "16px", fontWeight: "bold", display: "block" }}>Admin Portal</span>
            <span style={{ fontSize: "11px", color: "#94a3b8" }}>College Exam System</span>
          </div>
        </div>

        {/* Navigation Tabs List */}
        <div style={{ flexGrow: 1, padding: "20px 12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <button 
            onClick={() => setActiveTab("OVERVIEW")}
            className={`admin-nav-item ${activeTab === "OVERVIEW" ? "active" : ""}`}
          >
            <LayoutDashboard size={18} />
            <span>Overview Dashboard</span>
          </button>
          
          <button 
            onClick={() => setActiveTab("EXAMS")}
            className={`admin-nav-item ${activeTab === "EXAMS" ? "active" : ""}`}
          >
            <BookOpen size={18} />
            <span>Manage Exams</span>
          </button>

          <button 
            onClick={() => setActiveTab("STUDENTS")}
            className={`admin-nav-item ${activeTab === "STUDENTS" ? "active" : ""}`}
          >
            <Users size={18} />
            <span>Manage Students</span>
          </button>

          <button 
            onClick={() => setActiveTab("MONITOR")}
            className={`admin-nav-item ${activeTab === "MONITOR" ? "active" : ""}`}
          >
            <Activity size={18} />
            <span>Live Monitor</span>
          </button>

          <button 
            onClick={() => setActiveTab("GRADES")}
            className={`admin-nav-item ${activeTab === "GRADES" ? "active" : ""}`}
          >
            <FileSpreadsheet size={18} />
            <span>Grades & Reports</span>
          </button>
        </div>

        {/* Profile and Logout */}
        <div 
          style={{ 
            padding: "20px", 
            borderTop: "1px solid rgba(255,255,255,0.08)", 
            display: "flex", 
            flexDirection: "column",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#334155", color: "#e2e8f0", display: "flex", alignItems: "center", justifyC: "center", fontWeight: "bold", fontSize: "14px", flexShrink: 0 }}>
              {adminName.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {adminName}
              </span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>System Administrator</span>
            </div>
          </div>
          
          <button 
            onClick={onLogout}
            style={{ 
              width: "100%", 
              backgroundColor: "rgba(220, 38, 38, 0.15)", 
              border: "1px solid rgba(220, 38, 38, 0.25)",
              color: "#fca5a5",
              padding: "10px", 
              borderRadius: "6px", 
              cursor: "pointer", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "8px", 
              fontSize: "13px",
              fontWeight: "600",
              transition: "background-color 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.25)"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.15)"}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content Workspace */}
      <div className="admin-content-shell" style={{ flexGrow: 1, display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" }}>
        {/* Top Header Row */}
        <div 
          style={{ 
            height: "70px", 
            backgroundColor: "white", 
            borderBottom: "1px solid #dee2e6", 
            padding: "0 30px", 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            flexShrink: 0
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
              {activeTab === "OVERVIEW" && "Portal Overview"}
              {activeTab === "EXAMS" && "Manage College Examinations"}
              {activeTab === "STUDENTS" && "Manage Registered Students"}
              {activeTab === "MONITOR" && "Active Session Monitor Feed"}
              {activeTab === "GRADES" && "Grades & Submission Records"}
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button 
              onClick={loadAllData} 
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#64748b",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "13px",
                fontWeight: "600"
              }}
            >
              <RefreshCw size={14} className={loading ? "spin-icon" : ""} />
              <span>Refresh Portal Data</span>
            </button>
          </div>
        </div>

        {/* Tab content container */}
        <div style={{ padding: "30px", flexGrow: 1, position: "relative" }}>
          {loading ? (
            <div style={{ display: "flex", height: "300px", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "12px", color: "#64748b" }}>
              <span className="spinner-mini" style={{ width: "30px", height: "30px", borderWidth: "3px" }}></span>
              <p style={{ margin: 0, fontWeight: "500" }}>Syncing portal records...</p>
            </div>
          ) : (
            <>
              {activeTab === "OVERVIEW" && (
                <OverviewTab 
                  exams={exams} 
                  students={students} 
                  sessions={sessions} 
                  answers={answers} 
                />
              )}
              {activeTab === "EXAMS" && (
                <ExamsTab 
                  exams={exams} 
                  onRefresh={loadAllData} 
                />
              )}
              {activeTab === "STUDENTS" && (
                <StudentsTab 
                  students={students} 
                  sessions={sessions} 
                  exams={exams} 
                  answers={answers} 
                  onRefresh={loadAllData} 
                />
              )}
              {activeTab === "MONITOR" && (
                <LiveMonitorTab 
                  sessions={sessions} 
                  exams={exams} 
                  answers={answers} 
                  onRefresh={loadAllData} 
                />
              )}
              {activeTab === "GRADES" && (
                <GradesTab 
                  sessions={sessions} 
                  exams={exams} 
                  answers={answers} 
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
