import React, { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Users, 
  Activity, 
  FileSpreadsheet, 
  LogOut, 
  RefreshCw,
  Building2,
  CalendarClock,
  ShieldCheck,
  GraduationCap
} from "lucide-react";
import { OverviewTab } from "./OverviewTab";
import { ExamsTab } from "./ExamsTab";
import { StudentsTab } from "./StudentsTab";
import { LiveMonitorTab } from "./LiveMonitorTab";
import { GradesTab } from "./GradesTab";
import { DepartmentsTab } from "./DepartmentsTab";
import { ScheduleTab } from "./ScheduleTab";
import { AdminsTab } from "./AdminsTab";
import { TeachersTab } from "./TeachersTab";
import { dbService, isSupabaseConfigured, supabase, type Exam, type Student, type ExamSession, type SavedAnswer, type Admin, type Department, type Teacher } from "../../supabaseClient";

interface AdminDashboardProps {
  onLogout: () => void;
  adminName: string;
  adminId: string;
  role?: "ADMIN" | "TEACHER";
  teacherDepartment?: string;
}

type AdminTab = "OVERVIEW" | "EXAMS" | "STUDENTS" | "MONITOR" | "GRADES" | "DEPARTMENTS" | "SCHEDULE" | "ADMINS" | "TEACHERS";

const ADMIN_NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { id: "OVERVIEW" as AdminTab, label: "Overview Dashboard", icon: <LayoutDashboard size={17} /> },
    ]
  },
  {
    label: "Exam Management",
    items: [
      { id: "EXAMS" as AdminTab, label: "Manage Exams", icon: <BookOpen size={17} /> },
      { id: "SCHEDULE" as AdminTab, label: "Exam Schedule", icon: <CalendarClock size={17} /> },
    ]
  },
  {
    label: "People",
    items: [
      { id: "STUDENTS" as AdminTab, label: "Manage Students", icon: <Users size={17} /> },
      { id: "TEACHERS" as AdminTab, label: "Manage Teachers", icon: <GraduationCap size={17} /> },
      { id: "ADMINS" as AdminTab, label: "Admin Accounts", icon: <ShieldCheck size={17} /> },
    ]
  },
  {
    label: "Academic",
    items: [
      { id: "DEPARTMENTS" as AdminTab, label: "Departments", icon: <Building2 size={17} /> },
      { id: "MONITOR" as AdminTab, label: "Live Monitor", icon: <Activity size={17} /> },
      { id: "GRADES" as AdminTab, label: "Grades & Reports", icon: <FileSpreadsheet size={17} /> },
    ]
  },
];

const TEACHER_NAV_SECTIONS = [
  {
    label: "Main",
    items: [
      { id: "OVERVIEW" as AdminTab, label: "Department Overview", icon: <LayoutDashboard size={17} /> },
    ]
  },
  {
    label: "Exam Management",
    items: [
      { id: "EXAMS" as AdminTab, label: "Manage Exams", icon: <BookOpen size={17} /> },
      { id: "SCHEDULE" as AdminTab, label: "Exam Schedule", icon: <CalendarClock size={17} /> },
    ]
  },
  {
    label: "Academic",
    items: [
      { id: "MONITOR" as AdminTab, label: "Live Monitor", icon: <Activity size={17} /> },
      { id: "GRADES" as AdminTab, label: "Grades & Reports", icon: <FileSpreadsheet size={17} /> },
    ]
  },
];

const TAB_TITLES: Record<AdminTab, string> = {
  OVERVIEW: "Portal Overview",
  EXAMS: "Manage CTE Examinations",
  STUDENTS: "Manage Registered Students",
  MONITOR: "Active Session Monitor",
  GRADES: "Grades & Submission Records",
  DEPARTMENTS: "Manage Departments",
  SCHEDULE: "Exam Scheduling & Availability",
  ADMINS: "Admin Account Management",
  TEACHERS: "Manage Teacher Accounts",
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onLogout,
  adminName,
  adminId,
  role = "ADMIN",
  teacherDepartment,
}) => {
  const isTeacher = role === "TEACHER";
  const navSections = isTeacher ? TEACHER_NAV_SECTIONS : ADMIN_NAV_SECTIONS;
  const [activeTab, setActiveTab] = useState<AdminTab>("OVERVIEW");
  const [loading, setLoading] = useState(true);

  // Database States
  const [exams, setExams] = useState<Exam[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<ExamSession[]>([]);
  const [answers, setAnswers] = useState<SavedAnswer[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Use Promise.allSettled so one failing table (e.g. missing 'teachers') 
      // doesn't prevent all other data from loading
      const results = await Promise.allSettled([
        dbService.getExams(isTeacher ? teacherDepartment : undefined),
        dbService.getAllStudents(),
        dbService.getAllSessions(),
        dbService.getDepartments(),
        dbService.getAllAdmins(),
        dbService.getAllTeachers(),
        dbService.getAllAnswers(),
      ]);

      const getValue = <T,>(result: PromiseSettledResult<T>, fallback: T, label: string): T => {
        if (result.status === "fulfilled") return result.value;
        console.warn(`Failed to load ${label}:`, (result as PromiseRejectedResult).reason);
        return fallback;
      };

      const fetchedExams = getValue(results[0], [], "exams");
      const fetchedStudents = getValue(results[1], [], "students");
      const fetchedSessions = getValue(results[2], [], "sessions");
      const fetchedDepts = getValue(results[3], [], "departments");
      const fetchedAdmins = getValue(results[4], [], "admins");
      const fetchedTeachers = getValue(results[5], [], "teachers");
      const fetchedAnswers = getValue(results[6], [], "answers");

      // Scope lists for teachers
      const filteredStudents = isTeacher && teacherDepartment
        ? fetchedStudents.filter(s => s.department === teacherDepartment)
        : fetchedStudents;

      const filteredSessions = isTeacher && teacherDepartment
        ? fetchedSessions.filter(s => s.student?.department === teacherDepartment)
        : fetchedSessions;

      const filteredDepts = isTeacher && teacherDepartment
        ? fetchedDepts.filter(d => d.name === teacherDepartment)
        : fetchedDepts;

      setExams(fetchedExams);
      setStudents(filteredStudents);
      setSessions(filteredSessions);
      setDepartments(filteredDepts);
      setAdmins(fetchedAdmins);
      setTeachers(fetchedTeachers);
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
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#f1f5f9", width: "100%" }}>
      {/* Sidebar */}
      <div style={{
        width: "260px", backgroundColor: "#0f172a", color: "#f1f5f9",
        display: "flex", flexDirection: "column", flexShrink: 0,
        overflowY: "auto"
      }}>
        {/* Brand Header */}
        <div style={{
          padding: "20px 20px 16px", borderBottom: "1px solid rgba(255,255,255,0.07)",
          display: "flex", alignItems: "center", gap: "10px"
        }}>
          <div style={{
            width: "34px", height: "34px", borderRadius: "8px",
            background: "linear-gradient(135deg, #0f6cbf, #2563eb)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: "16px", color: "white", flexShrink: 0
          }}>
            A
          </div>
          <div>
            <span style={{ fontSize: "15px", fontWeight: "700", display: "block", color: "#f8fafc" }}>Admin Portal</span>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Debre Birhan CTE</span>
          </div>
        </div>

        {/* Navigation */}
        <div style={{ flexGrow: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: "4px" }}>
          {navSections.map(section => (
            <div key={section.label} style={{ marginBottom: "8px" }}>
              <div style={{ fontSize: "10px", fontWeight: "700", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", padding: "6px 10px 4px" }}>
                {section.label}
              </div>
              {section.items.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: "10px",
                    padding: "9px 12px", borderRadius: "6px", border: "none", cursor: "pointer",
                    fontSize: "13px", fontWeight: activeTab === item.id ? "600" : "500",
                    backgroundColor: activeTab === item.id ? "rgba(15, 108, 191, 0.2)" : "transparent",
                    color: activeTab === item.id ? "#60a5fa" : "#94a3b8",
                    transition: "all 0.15s", textAlign: "left",
                  }}
                  onMouseOver={e => { if (activeTab !== item.id) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                  onMouseOut={e => { if (activeTab !== item.id) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {activeTab === item.id && (
                    <div style={{ marginLeft: "auto", width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "#60a5fa" }} />
                  )}
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Profile & Logout */}
        <div style={{ padding: "14px", borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "50%",
              background: "linear-gradient(135deg, #334155, #1e293b)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "700", fontSize: "13px", color: "#e2e8f0", flexShrink: 0
            }}>
              {adminName.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: "hidden" }}>
              <span style={{ fontSize: "13px", fontWeight: "600", display: "block", color: "#f1f5f9", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {adminName}
              </span>
              <span style={{ fontSize: "11px", color: "#64748b" }}>{isTeacher ? "Teacher" : "System Administrator"}</span>
            </div>
          </div>
          <button
            onClick={onLogout}
            style={{
              width: "100%", backgroundColor: "rgba(220, 38, 38, 0.12)", border: "1px solid rgba(220, 38, 38, 0.2)",
              color: "#fca5a5", padding: "9px", borderRadius: "6px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: "7px", fontSize: "13px", fontWeight: "600", transition: "background-color 0.2s"
            }}
            onMouseOver={e => e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.22)"}
            onMouseOut={e => e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.12)"}
          >
            <LogOut size={13} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", overflowY: "auto", height: "100vh" }}>
        {/* Top Header */}
        <div style={{
          height: "64px", backgroundColor: "white", borderBottom: "1px solid #e2e8f0",
          padding: "0 28px", display: "flex", justifyContent: "space-between",
          alignItems: "center", flexShrink: 0, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}>
          <h1 style={{ margin: 0, fontSize: "17px", fontWeight: "700", color: "#1e293b" }}>
            {TAB_TITLES[activeTab]}
          </h1>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </div>
            <button
              onClick={loadAllData}
              disabled={loading}
              style={{
                background: "none", border: "1px solid #e2e8f0", borderRadius: "6px",
                padding: "6px 12px", cursor: "pointer", color: "#64748b",
                display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600"
              }}
            >
              <RefreshCw size={13} className={loading ? "spin-icon" : ""} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div style={{ padding: "28px", flexGrow: 1, position: "relative" }}>
          {loading ? (
            <div style={{ display: "flex", height: "300px", justifyContent: "center", alignItems: "center", flexDirection: "column", gap: "14px", color: "#64748b" }}>
              <span className="spinner-mini" style={{ width: "32px", height: "32px", borderWidth: "3px" }} />
              <p style={{ margin: 0, fontWeight: "500" }}>Loading portal data...</p>
            </div>
          ) : (
            <>
              {activeTab === "OVERVIEW" && (
                <OverviewTab exams={exams} students={students} sessions={sessions} answers={answers} departments={departments} />
              )}
              {activeTab === "EXAMS" && (
                <ExamsTab exams={exams} departments={departments} onRefresh={loadAllData} />
              )}
              {!isTeacher && activeTab === "STUDENTS" && (
                <StudentsTab students={students} sessions={sessions} exams={exams} answers={answers} departments={departments} onRefresh={loadAllData} />
              )}
              {activeTab === "MONITOR" && (
                <LiveMonitorTab sessions={sessions} exams={exams} answers={answers} onRefresh={loadAllData} />
              )}
              {activeTab === "GRADES" && (
                <GradesTab sessions={sessions} exams={exams} answers={answers} departments={departments} />
              )}
              {!isTeacher && activeTab === "DEPARTMENTS" && (
                <DepartmentsTab departments={departments} onRefresh={loadAllData} />
              )}
              {activeTab === "SCHEDULE" && (
                <ScheduleTab exams={exams} onRefresh={loadAllData} />
              )}
              {!isTeacher && activeTab === "ADMINS" && (
                <AdminsTab admins={admins} currentAdminId={adminId} onRefresh={loadAllData} />
              )}
              {!isTeacher && activeTab === "TEACHERS" && (
                <TeachersTab teachers={teachers} departments={departments} onRefresh={loadAllData} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
