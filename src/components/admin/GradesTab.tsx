import React, { useState } from "react";
import { Search, Download, CheckCircle2, XCircle } from "lucide-react";
import type { ExamSession, Exam, SavedAnswer, Department } from "../../supabaseClient";

interface GradesTabProps {
  sessions: ExamSession[];
  exams: Exam[];
  answers: SavedAnswer[];
  departments: Department[];
}

export const GradesTab: React.FC<GradesTabProps> = ({
  sessions,
  exams,
  answers
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [examFilter, setExamFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "PASS", "FAIL"

  const completedSessions = sessions.filter((s) => s.submitted);

  // Compute detailed results for completed sessions
  const gradedSessions = completedSessions.map((session) => {
    const studentName = session.student?.username || "Unknown Student";
    const studentDept = session.student?.department || "N/A";
    
    // Find exam details
    const exam = exams.find((e) => e.title === session.exam_name);
    
    // Calculate score
    const sessionAnswers = answers.filter((a) => a.session_id === session.id);
    let pointsEarned = 0;
    let maxPoints = 0;

    if (exam) {
      exam.questions.forEach((q: Exam["questions"][0]) => {
        maxPoints += q.points;
        const ans = sessionAnswers.find((a) => a.question_id === q.id);
        if (ans && ans.selected_option === q.correctAnswer) {
          pointsEarned += q.points;
        }
      });
    }

    const percentage = maxPoints > 0 ? (pointsEarned / maxPoints) * 100 : 0;
    const isPass = percentage >= 50;

    // Calculate time taken
    let timeTakenStr = "N/A";
    if (session.ended_at) {
      const msDiff = new Date(session.ended_at).getTime() - new Date(session.started_at).getTime();
      const secDiff = Math.floor(msDiff / 1000);
      const m = Math.floor(secDiff / 60);
      const s = secDiff % 60;
      timeTakenStr = `${m}m ${s}s`;
    }

    return {
      id: session.id,
      studentName,
      studentDept,
      examName: session.exam_name,
      startedAt: session.started_at,
      endedAt: session.ended_at,
      pointsEarned,
      maxPoints,
      percentage,
      isPass,
      timeTakenStr
    };
  });

  // Filter completed/graded sessions
  const filteredGrades = gradedSessions.filter((row) => {
    const matchesSearch = row.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesExam = examFilter === "" || row.examName === examFilter;
    const matchesDept = deptFilter === "" || row.studentDept === deptFilter;
    const matchesStatus = 
      statusFilter === "" || 
      (statusFilter === "PASS" && row.isPass) || 
      (statusFilter === "FAIL" && !row.isPass);
    
    return matchesSearch && matchesExam && matchesDept && matchesStatus;
  });

  // CSV Export logic
  const handleExportCSV = () => {
    if (filteredGrades.length === 0) {
      alert("No data available to export.");
      return;
    }

    // CSV Headers
    const headers = ["Student", "Department", "Exam Title", "Date", "Time Taken", "Points", "Percentage", "Result"];
    
    // CSV Rows
    const rows = filteredGrades.map((g) => [
      g.studentName,
      g.studentDept,
      `"${g.examName.replace(/"/g, '""')}"`, // escape quotes
      new Date(g.startedAt).toLocaleDateString(),
      g.timeTakenStr,
      `${g.pointsEarned.toFixed(1)}/${g.maxPoints.toFixed(1)}`,
      `${g.percentage.toFixed(1)}%`,
      g.isPass ? "PASS" : "FAIL"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Online_Exam_Grades_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get list of unique exam titles for the filter dropdown
  const uniqueExamNames = Array.from(new Set(completedSessions.map((s) => s.exam_name)));

  return (
    <div className="admin-grades-tab" style={{ textAlign: "left" }}>
      {/* Search and Filters panel */}
      <div 
        style={{ 
          display: "flex", 
          flexDirection: "column", 
          gap: "12px", 
          backgroundColor: "white", 
          border: "1px solid #dee2e6", 
          borderRadius: "8px", 
          padding: "20px", 
          marginBottom: "20px" 
        }}
      >
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {/* Search bar */}
          <div style={{ position: "relative", flexGrow: 1, minWidth: "240px" }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input 
              type="text" 
              placeholder="Search by student username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="auth-input"
              style={{ paddingLeft: "36px", width: "100%", margin: 0 }}
            />
          </div>

          {/* Export button */}
          <button 
            onClick={handleExportCSV}
            className="auth-btn"
            style={{ width: "auto", margin: 0, padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Filter dropdowns row */}
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
          <select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            className="auth-input"
            style={{ flexGrow: 1, minWidth: "160px", margin: 0, backgroundColor: "white", cursor: "pointer" }}
          >
            <option value="">All Exams</option>
            {uniqueExamNames.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

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

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="auth-input"
            style={{ width: "140px", margin: 0, backgroundColor: "white", cursor: "pointer" }}
          >
            <option value="">All Results</option>
            <option value="PASS">Passes (&gt;= 50%)</option>
            <option value="FAIL">Failures (&lt; 50%)</option>
          </select>
        </div>
      </div>

      {/* Grades Table */}
      <div className="table-responsive" style={{ backgroundColor: "white", border: "1px solid #dee2e6", borderRadius: "8px", overflow: "hidden" }}>
        <table className="summary-table" style={{ margin: 0 }}>
          <thead>
            <tr>
              <th style={{ padding: "12px 16px" }}>Student</th>
              <th>Department</th>
              <th>Exam Title</th>
              <th>Submitted Date</th>
              <th>Time Taken</th>
              <th>Score Marks</th>
              <th>Percentage</th>
              <th style={{ textAlign: "right", paddingRight: "24px" }}>Result</th>
            </tr>
          </thead>
          <tbody>
            {filteredGrades.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
                  No graded student submissions found.
                </td>
              </tr>
            ) : (
              filteredGrades.map((row) => (
                <tr key={row.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "16px", fontWeight: "600", color: "#1e293b" }}>
                    {row.studentName}
                  </td>
                  <td>
                    <span className="exam-card-dept" style={{ margin: 0, backgroundColor: "#f1f5f9", color: "#475569" }}>
                      {row.studentDept}
                    </span>
                  </td>
                  <td style={{ color: "#334155", fontWeight: "500" }}>{row.examName}</td>
                  <td style={{ color: "#64748b", fontSize: "13px" }}>
                    {new Date(row.endedAt || row.startedAt).toLocaleDateString()}
                  </td>
                  <td style={{ color: "#475569", fontWeight: "500", fontSize: "13px" }}>{row.timeTakenStr}</td>
                  <td style={{ color: "#475569", fontWeight: "600" }}>
                    {row.pointsEarned.toFixed(1)} / {row.maxPoints.toFixed(1)}
                  </td>
                  <td style={{ fontWeight: "700", color: "#1e293b" }}>
                    {row.percentage.toFixed(1)}%
                  </td>
                  <td style={{ textAlign: "right", paddingRight: "24px" }}>
                    {row.isPass ? (
                      <span 
                        style={{ 
                          color: "#16a34a", 
                          backgroundColor: "#f0fdf4", 
                          border: "1px solid #bbf7d0", 
                          padding: "4px 10px", 
                          borderRadius: "20px", 
                          fontSize: "12px", 
                          fontWeight: "bold",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <CheckCircle2 size={12} />
                        <span>PASS</span>
                      </span>
                    ) : (
                      <span 
                        style={{ 
                          color: "#dc2626", 
                          backgroundColor: "#fef2f2", 
                          border: "1px solid #fecaca", 
                          padding: "4px 10px", 
                          borderRadius: "20px", 
                          fontSize: "12px", 
                          fontWeight: "bold",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                      >
                        <XCircle size={12} />
                        <span>FAIL</span>
                      </span>
                    )}
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
