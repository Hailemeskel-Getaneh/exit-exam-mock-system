import React from "react";
import { Users, BookOpen, Activity, Award } from "lucide-react";
import { computeRealTimeRemaining } from "../../supabaseClient";
import type { Exam, Student, ExamSession, SavedAnswer, Department } from "../../supabaseClient";

interface OverviewTabProps {
  exams: Exam[];
  students: Student[];
  sessions: ExamSession[];
  answers: SavedAnswer[];
  departments: Department[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  exams,
  students,
  sessions,
  answers,
  departments
}) => {
  // 1. Calculations
  const totalStudents = students.length;
  const totalExams = exams.filter(e => e.is_active !== false).length;
  const activeSessions = sessions.filter((s) => !s.submitted && computeRealTimeRemaining(s) > 0).length;
  const completedSessions = sessions.filter((s) => s.submitted || (!s.submitted && computeRealTimeRemaining(s) === 0));
  
  // Calculate average scores and pass rates
  let totalPassed = 0;
  let scoreSum = 0;
  let gradedCount = 0;

  completedSessions.forEach((session) => {
    const exam = exams.find((e) => e.title === session.exam_name);
    if (!exam) return;

    const sessionAnswers = answers.filter((a) => a.session_id === session.id);
    let pointsEarned = 0;
    let maxPoints = 0;

    exam.questions.forEach((q: Exam["questions"][0]) => {
      maxPoints += q.points;
      const ans = sessionAnswers.find((a) => a.question_id === q.id);
      if (ans && ans.selected_option === q.correctAnswer) {
        pointsEarned += q.points;
      }
    });

    const percent = maxPoints > 0 ? (pointsEarned / maxPoints) * 100 : 0;
    scoreSum += percent;
    gradedCount++;
    if (percent >= 50) {
      totalPassed++;
    }
  });

  const passRate = gradedCount > 0 ? (totalPassed / gradedCount) * 100 : 0;
  const averageScore = gradedCount > 0 ? scoreSum / gradedCount : 0;

  // 2. Department statistics for SVG Chart
  const deptList = departments.length > 0 ? departments.map(d => d.name) : ["Information Technology", "Mathematics", "General Science", "English"];
  const deptStats = deptList.map((dept) => {
    const deptStudents = students.filter((s) => s.department === dept).length;
    const deptSessions = completedSessions.filter((s) => s.student?.department === dept || students.find(st => st.id === s.student_id)?.department === dept);
    
    let deptScoreSum = 0;
    let deptGradedCount = 0;

    deptSessions.forEach((session) => {
      const exam = exams.find((e) => e.title === session.exam_name);
      if (!exam) return;

      const sessionAnswers = answers.filter((a) => a.session_id === session.id);
      let pointsEarned = 0;
      let maxPoints = 0;

      exam.questions.forEach((q: Exam["questions"][0]) => {
        maxPoints += q.points;
        const ans = sessionAnswers.find((a) => a.question_id === q.id);
        if (ans && ans.selected_option === q.correctAnswer) {
          pointsEarned += q.points;
        }
      });

      const percent = maxPoints > 0 ? (pointsEarned / maxPoints) * 100 : 0;
      deptScoreSum += percent;
      deptGradedCount++;
    });

    return {
      name: dept,
      studentCount: deptStudents,
      avgScore: deptGradedCount > 0 ? Math.round(deptScoreSum / deptGradedCount) : 0
    };
  });

  return (
    <div className="admin-overview-container">
      {/* 4 Stats Cards in Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card gradient-blue">
          <div className="stat-card-header">
            <Users size={20} className="stat-icon" />
            <span className="stat-label">Total Students</span>
          </div>
          <span className="stat-value">{totalStudents}</span>
          <span className="stat-subtext">Registered college students</span>
        </div>

        <div className="admin-stat-card gradient-purple">
          <div className="stat-card-header">
            <BookOpen size={20} className="stat-icon" />
            <span className="stat-label">Active Exams</span>
          </div>
          <span className="stat-value">{totalExams}</span>
          <span className="stat-subtext">Available in the portal</span>
        </div>

        <div className="admin-stat-card gradient-amber">
          <div className="stat-card-header">
            <Activity size={20} className="stat-icon" />
            <span className="stat-label">Active Sessions</span>
          </div>
          <span className="stat-value pulse-text">{activeSessions}</span>
          <span className="stat-subtext">Students taking exams now</span>
        </div>

        <div className="admin-stat-card gradient-emerald">
          <div className="stat-card-header">
            <Award size={20} className="stat-icon" />
            <span className="stat-label">Average Pass Rate</span>
          </div>
          <span className="stat-value">{passRate.toFixed(1)}%</span>
          <span className="stat-subtext">Avg score: {averageScore.toFixed(1)}%</span>
        </div>
      </div>

      {/* SVG Analytics Charts */}
      <div className="admin-charts-section">
        <div className="admin-chart-card">
          <h3 className="chart-card-title">Average Performance by Department</h3>
          <p className="chart-card-subtitle">Mean percentage score achieved by students in completed exam sessions</p>
          
          <div className="chart-bar-container">
            {deptStats.map((dept) => (
              <div className="chart-bar-row" key={dept.name}>
                <span className="chart-row-label">{dept.name}</span>
                <div className="chart-row-progress-outer">
                  <div 
                    className="chart-row-progress-inner" 
                    style={{ 
                      width: `${dept.avgScore || 2}%`, 
                      backgroundImage: `linear-gradient(90deg, var(--moodle-primary) 0%, rgb(99, 102, 241) 100%)` 
                    }}
                  >
                    <span className="chart-bar-value">{dept.avgScore}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-chart-card">
          <h3 className="chart-card-title">Student Distribution by Department</h3>
          <p className="chart-card-subtitle">Total enrolled students in each academic discipline</p>
          
          {/* Beautiful SVG Donut or custom styled list */}
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", height: "180px" }}>
            <svg width="150" height="150" viewBox="0 0 42 42" className="donut-svg">
              <circle className="donut-hole" cx="21" cy="21" r="15.91549430918954" fill="#fff"></circle>
              <circle className="donut-ring" cx="21" cy="21" r="15.91549430918954" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5"></circle>
              
              {(() => {
                let accumulatedPercent = 0;
                const colors = ["#0f6cbf", "#8b5cf6", "#f59e0b", "#10b981"];
                
                return deptStats.map((dept, idx) => {
                  const percent = totalStudents > 0 ? (dept.studentCount / totalStudents) * 100 : 25;
                  const strokeDasharray = `${percent} ${100 - percent}`;
                  const strokeDashoffset = 100 - accumulatedPercent + 25; // 25 to start at top
                  accumulatedPercent += percent;
                  
                  return (
                    <circle
                      key={dept.name}
                      className="donut-segment"
                      cx="21"
                      cy="21"
                      r="15.91549430918954"
                      fill="transparent"
                      stroke={colors[idx % colors.length]}
                      strokeWidth="4.5"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                    ></circle>
                  );
                });
              })()}
            </svg>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left" }}>
              {deptStats.map((dept, idx) => {
                const colors = ["#0f6cbf", "#8b5cf6", "#f59e0b", "#10b981"];
                return (
                  <div key={dept.name} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "3px", backgroundColor: colors[idx % colors.length] }}></div>
                    <span style={{ fontWeight: 600, color: "#334155" }}>{dept.studentCount}</span>
                    <span style={{ color: "#64748b" }}>{dept.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
