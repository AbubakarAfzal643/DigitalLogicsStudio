import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Navbar } from "../Home/Navbar";
import Footer from "../Home/Footer";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import useLearningProgress from "../../hooks/useLearningProgress";
import coreTopics from "../../data/coreTopics";
import problemsCatalog from "../Problems/problemCatalog";
import progressService from "../../services/progressService";
import apiClient from "../../services/apiClient";
// Removed duplicate Footer import
import "./Auth.css";
import "./DashboardProfile.css";
import "./ProfileDashboard.css";
// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, accent }) {
  return (
    <div className="pd-stat-card" style={{ "--accent": accent }}>
      <div className="pd-stat-icon">{icon}</div>
      <div className="pd-stat-body">
        <span className="pd-stat-value">{value}</span>
        <span className="pd-stat-label">{label}</span>
        {sub && <span className="pd-stat-sub">{sub}</span>}
        {trend !== undefined && (
          <span className={`pd-stat-trend ${trend >= 0 ? "pd-stat-trend--up" : "pd-stat-trend--down"}`}>
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}% vs last week
          </span>
        )}
      </div>
    </div>
  );
}

function SkillBar({ label, pct, color }) {
  return (
    <div className="pd-skill-row">
      <div className="pd-skill-meta">
        <span className="pd-skill-label">{label}</span>
        <span className="pd-skill-pct">{pct}%</span>
      </div>
      <div className="pd-skill-track">
        <div className="pd-skill-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

function Badge({ icon, title, desc, earned, progress, rarity }) {
  const getRarityColor = (r) => {
    switch (r) {
      case "legendary": return "#f59e0b";
      case "epic": return "#a855f7";
      case "rare": return "#3b82f6";
      default: return "#10b981";
    }
  };
  
  const accent = getRarityColor(rarity);

  return (
    <div className={`pd-badge-premium ${earned ? "pd-badge-premium--earned" : "pd-badge-premium--locked"}`} style={{ "--badge-accent": accent }}>
      <div className="pd-badge-premium-glow"></div>
      <div className="pd-badge-premium-icon-ring">
        <div className="pd-badge-premium-icon">{icon}</div>
      </div>
      <div className="pd-badge-premium-content">
        <div className="pd-badge-premium-header">
          <h3 className="pd-badge-premium-title">{title}</h3>
          {rarity && <span className="pd-badge-premium-rarity" style={{ color: accent, border: `1px solid ${accent}40`, background: `${accent}15` }}>{rarity}</span>}
        </div>
        <p className="pd-badge-premium-desc">{desc}</p>
        <div className="pd-badge-premium-progress-wrapper">
          <div className="pd-badge-premium-progress-bar">
            <div className="pd-badge-premium-progress-fill" style={{ width: `${Math.min(progress, 100)}%`, background: accent }}></div>
          </div>
          <span className="pd-badge-premium-progress-text">{earned ? "Completed" : `${Math.min(progress, 100)}%`}</span>
        </div>
      </div>
    </div>
  );
}

function ActivityDot({ intensity, date }) {
  const labels = ["No activity", "Low", "Medium", "High", "Very high"];
  return (
    <div
      className={`pd-cal-dot pd-cal-dot--${intensity}`}
      title={`${date}: ${labels[intensity] || "No activity"}`}
    />
  );
}

function TrackCard({ trackType, title, progress, lessonsCount, totalLessons, xp, totalXp, streak, saved, nextLesson, accent, link }) {
  return (
    <div className="pd-track-card">
      <div className="pd-track-header">
        <span className="pd-track-type" style={{ color: accent }}>{trackType}</span>
        <span className="pd-track-pct" style={{ color: accent }}>{progress}%</span>
      </div>
      <h3 className="pd-track-title">{title}</h3>
      <div className="pd-track-stats">
        <div className="pd-track-stat">
          <span className="pd-track-stat-label">LESSONS</span>
          <span className="pd-track-stat-val">{lessonsCount}/{totalLessons}</span>
        </div>
        <div className="pd-track-stat">
          <span className="pd-track-stat-label">XP</span>
          <span className="pd-track-stat-val">{xp}/{totalXp}</span>
        </div>
        <div className="pd-track-stat">
          <span className="pd-track-stat-label">STREAK</span>
          <span className="pd-track-stat-val">{streak} days</span>
        </div>
        <div className="pd-track-stat">
          <span className="pd-track-stat-label">SAVED</span>
          <span className="pd-track-stat-val">{saved}</span>
        </div>
      </div>
      <div className="pd-track-footer">
        <div className="pd-track-next">
          <span className="pd-track-next-label">NEXT LESSON</span>
          <span className="pd-track-next-title">{nextLesson}</span>
        </div>
        <Link to={link} className="pd-btn pd-track-btn" style={{ backgroundColor: accent, color: '#000' }}>
          Continue
        </Link>
      </div>
    </div>
  );
}

// ─── Notifications Panel ──────────────────────────────────────────────────────
function NotificationsPanel({ notifications, onDismiss, onDismissAll }) {
  return (
    <div className="pd-notif-panel">
      <div className="pd-notif-header">
        <span className="pd-notif-title">Notifications</span>
        {notifications.length > 0 && (
          <button type="button" className="pd-notif-clear" onClick={onDismissAll}>Clear all</button>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="pd-empty" style={{ padding: "1rem" }}>You're all caught up 🎉</p>
      ) : (
        <ul className="pd-notif-list">
          {notifications.map(n => (
            <li key={n.id} className={`pd-notif-item pd-notif-item--${n.type}`}>
              <span className="pd-notif-icon">{n.icon}</span>
              <div className="pd-notif-body">
                <span className="pd-notif-msg">{n.message}</span>
                <span className="pd-notif-time">{n.time}</span>
              </div>
              <button type="button" className="pd-notif-dismiss" onClick={() => onDismiss(n.id)} aria-label="Dismiss">✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Feedback Widget ──────────────────────────────────────────────────────────
function FeedbackWidget({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!rating) return;
    onSubmit({ rating, comment });
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="pd-feedback-thanks">
        <span className="pd-feedback-thanks-icon">🙏</span>
        <span>Thanks for your feedback!</span>
      </div>
    );
  }

  return (
    <form className="pd-feedback-form" onSubmit={handleSubmit}>
      <p className="pd-feedback-prompt">Rate your learning experience</p>
      <div className="pd-feedback-stars">
        {[1, 2, 3, 4, 5].map(s => (
          <button
            key={s} type="button"
            className={`pd-feedback-star${s <= (hovered || rating) ? " pd-feedback-star--active" : ""}`}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
            aria-label={`${s} star`}
          >★</button>
        ))}
      </div>
      <textarea
        className="pd-feedback-textarea"
        placeholder="Any comments? (optional)"
        value={comment}
        onChange={e => setComment(e.target.value)}
        rows={2}
      />
      <button type="submit" className="pd-btn pd-btn--primary pd-btn--sm" disabled={!rating}>
        Submit Feedback
      </button>
    </form>
  );
}

// ─── Custom Tooltip for charts ────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="pd-chart-tooltip">
      <p className="pd-chart-tooltip-label">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="pd-chart-tooltip-val">
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ─── Recommendation engine ────────────────────────────────────────────────────
function getRecommendations(topicStats) {
  const recs = [];
  if (topicStats.booleanAlgebra < 50)
    recs.push({ title: "Boolean Algebra", path: "/boolean/overview", reason: "Core foundation — start here", color: COLORS.blue });
  if (topicStats.kmap < 50)
    recs.push({ title: "K-Map Studio", path: "/kmapgenerator", reason: "Simplify logic expressions visually", color: COLORS.purple });
  if (topicStats.sequential < 50)
    recs.push({ title: "Sequential Circuits", path: "/sequential/intro", reason: "Flip-flops, latches & state machines", color: COLORS.green });
  if (recs.length === 0)
    recs.push({ title: "Circuit Forge", path: "/boolforge", reason: "Build and simulate custom circuits", color: COLORS.amber });
  return recs.slice(0, 3);
}

// ─── Event meta ───────────────────────────────────────────────────────────────
const EVENT_META = {
  problem_solved:   { label: "Solved a problem",   color: COLORS.green,  icon: "✓" },
  problem_attempted:{ label: "Attempted a problem", color: COLORS.blue,   icon: "⚡" },
  topic_opened:     { label: "Started a topic",     color: COLORS.purple, icon: "📖" },
  topic_completed:  { label: "Completed a topic",   color: COLORS.amber,  icon: "🏆" },
};

// ─── Build weekly trend data from calendar ────────────────────────────────────
function buildWeeklyTrend(calendar) {
  if (!calendar || calendar.length === 0) return [];
  const weeks = [];
  for (let i = 0; i < calendar.length; i += 7) {
    const chunk = calendar.slice(i, i + 7);
    const solved = chunk.reduce((s, d) => s + (d.solved || 0), 0);
    const attempts = chunk.reduce((s, d) => s + (d.attempts || 0), 0);
    const label = chunk[0]?.date ? getWeekLabel(chunk[0].date) : `W${Math.floor(i / 7) + 1}`;
    weeks.push({ week: label, solved, attempts });
  }
  return weeks;
}

// ─── Build daily activity for last 7 days ────────────────────────────────────
function buildDailyActivity(calendar) {
  if (!calendar || calendar.length === 0) return [];
  return calendar.slice(-7).map(d => ({
    day: d.date ? getDayName(d.date) : "?",
    solved: d.solved || 0,
    attempts: d.attempts || 0,
    topics: (d.topicsCompleted || 0) + (d.topicsOpened || 0),
  }));
}

// ─── Build pie data ───────────────────────────────────────────────────────────
function buildPieData(topicStats) {
  return [
    { name: "Boolean Algebra", value: topicStats.booleanAlgebra || 0 },
    { name: "K-Map",           value: topicStats.kmap || 0 },
    { name: "Sequential",      value: topicStats.sequential || 0 },
    { name: "Number Systems",  value: topicStats.numberSystems || 0 },
    { name: "Arithmetic",      value: topicStats.arithmetic || 0 },
  ].filter(d => d.value > 0);
}

// ─── Build radar data ─────────────────────────────────────────────────────────
function buildRadarData(topicStats) {
  return [
    { subject: "Boolean",    A: topicStats.booleanAlgebra || 0 },
    { subject: "K-Map",      A: topicStats.kmap || 0 },
    { subject: "Sequential", A: topicStats.sequential || 0 },
    { subject: "Numbers",    A: topicStats.numberSystems || 0 },
    { subject: "Arithmetic", A: topicStats.arithmetic || 0 },
  ];
}

// ─── Build notifications from progress data ───────────────────────────────────
function buildNotifications(summary, topicStats, badges) {
  const notifs = [];
  const { streaks, solvedProblems, completedTopics } = summary;

  if (streaks?.current >= 3)
    notifs.push({ id: "streak", type: "achievement", icon: "🔥", message: `${streaks.current}-day streak! Keep it up!`, time: "Now" });

  const weakest = Object.entries(topicStats).sort((a, b) => a[1] - b[1])[0];
  if (weakest && weakest[1] < 30)
    notifs.push({ id: "weak", type: "reminder", icon: "📚", message: `${weakest[0].replace(/([A-Z])/g, " $1").trim()} needs attention — only ${weakest[1]}% complete`, time: "Tip" });

  const justEarned = badges.filter(b => b.earned).slice(-1)[0];
  if (justEarned)
    notifs.push({ id: "badge", type: "badge", icon: justEarned.icon, message: `Badge unlocked: "${justEarned.title}"`, time: "Recent" });

  if (solvedProblems === 0)
    notifs.push({ id: "start", type: "info", icon: "💡", message: "Start solving problems to track your progress!", time: "Tip" });

  if (completedTopics > 0 && completedTopics % 3 === 0)
    notifs.push({ id: "milestone", type: "achievement", icon: "🏆", message: `Milestone: ${completedTopics} topics completed!`, time: "Today" });

  return notifs;
}

// ─── Most active day ─────────────────────────────────────────────────────────
function getMostActiveDay(calendar) {
  if (!calendar || calendar.length === 0) return "—";
  const byDay = {};
  calendar.forEach(d => {
    if (!d.date) return;
    const day = new Date(d.date).toLocaleDateString("en-US", { weekday: "long" });
    byDay[day] = (byDay[day] || 0) + (d.solved || 0) + (d.attempts || 0);
  });
  const sorted = Object.entries(byDay).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] || "—";
}

// ─── Week-over-week comparison ────────────────────────────────────────────────
function getWeekComparison(calendar) {
  if (!calendar || calendar.length < 14) return { thisWeek: 0, lastWeek: 0, delta: 0 };
  const last7 = calendar.slice(-7);
  const prev7 = calendar.slice(-14, -7);
  const thisWeek = last7.reduce((s, d) => s + (d.solved || 0) + (d.attempts || 0), 0);
  const lastWeek = prev7.reduce((s, d) => s + (d.solved || 0) + (d.attempts || 0), 0);
  const delta = lastWeek === 0 ? 0 : Math.round(((thisWeek - lastWeek) / lastWeek) * 100);
  return { thisWeek, lastWeek, delta };
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { theme, toggle: toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const [progressData, setProgressData] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [backendOk, setBackendOk] = useState(null); // null=checking, true, false
  const [activeTab, setActiveTab] = useState("overview");

  // ── Load progress snapshot ──────────────────────────────────────────────────
  const loadProgress = useCallback(async () => {
    if (!user) return;
    setLoadingProgress(true);
    try {
      const userKey = progressService.getUserKey(user);
      await progressService.loadFromDB(userKey);
      const snap = progressService.getSnapshot(userKey);
      setProgressData(snap);
      setBackendOk(true);
    } catch {
      setBackendOk(false);
    } finally {
      setLoadingProgress(false);
    }
  }, [user]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // ── Backend health check ────────────────────────────────────────────────────
  useEffect(() => {
    const check = async () => {
      try { await apiClient.get("/health"); setBackendOk(true); }
      catch { setBackendOk(false); }
    };
    check();
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError("");
    try {
      await logout();
      navigate("/", { replace: true });
    } catch (error) {
      setLogoutError(
        error.response?.data?.message || "Unable to log out right now.",
      );
    } finally {
      setIsLoggingOut(false);
    }
  };

  // ── Derived stats ───────────────────────────────────────────────────────────
  const summary = progressData?.summary || {};
  const recentEvents = progressData?.recentEvents || [];
  const calendarDots = progressData?.calendar || [];
  const state = progressData?.state || {};

  const solvedCount     = summary.solvedProblems || 0;
  const attemptedCount  = summary.attemptedProblems || 0;
  const completedTopics = summary.completedTopics || 0;
  const streakCurrent = summary.streaks?.current || 0;
  const streakLongest = summary.streaks?.longest || 0;
  const activeDays = summary.streaks?.activeDays || 0;

  // Topic-level completion percentages (map topicId prefixes to categories)
  const topicEntries = Object.entries(state.topics || {});
  const booleanTopics = topicEntries.filter(([id]) => id.startsWith("boolean"));
  const kmapTopics = topicEntries.filter(
    ([id]) => id.startsWith("kmap") || id.includes("kmap"),
  );
  const seqTopics = topicEntries.filter(
    ([id]) => id.startsWith("seq") || id.startsWith("sequential"),
  );
  const numTopics = topicEntries.filter(
    ([id]) => id.startsWith("number") || id.startsWith("ns"),
  );
  const arithTopics = topicEntries.filter(
    ([id]) => id.startsWith("arith") || id.startsWith("arithmetic"),
  );

  const avgPct = (arr) => {
    if (!arr.length) return 0;
    return Math.round(
      arr.reduce((s, [, v]) => s + (v.completionPercentage || 0), 0) /
        arr.length,
    );
  };

  const topicStats = {
    booleanAlgebra: avgPct(booleanTopics),
    kmap: avgPct(kmapTopics),
    sequential: avgPct(seqTopics),
    numberSystems: avgPct(numTopics),
    arithmetic: avgPct(arithTopics),
  };

  // Badges
  const badges = [
    {
      icon: "🧠",
      title: "Logic Master",
      desc: "Solve 20+ problems",
      earned: solvedCount >= 20,
      progress: Math.min((solvedCount / 20) * 100, 100),
    },
    {
      icon: "⚡",
      title: "Circuit Creator",
      desc: "Visit Circuit Forge",
      earned: recentEvents.some((e) => e.type === "topic_opened"),
      progress: recentEvents.some((e) => e.type === "topic_opened") ? 100 : 0,
    },
    {
      icon: "🗺️",
      title: "K-Map Pro",
      desc: "Complete K-Map topics",
      earned: topicStats.kmap >= 80,
      progress: topicStats.kmap,
    },
    {
      icon: "🔥",
      title: "Streak Keeper",
      desc: "Maintain a 7-day streak",
      earned: streakCurrent >= 7,
      progress: Math.min((streakCurrent / 7) * 100, 100),
    },
    {
      icon: "🏆",
      title: "Topic Champion",
      desc: "Complete 3+ topics",
      earned: completedTopics >= 3,
      progress: Math.min((completedTopics / 3) * 100, 100),
    },
    {
      icon: "🎯",
      title: "Problem Solver",
      desc: "Attempt 10+ problems",
      earned: attemptedCount >= 10,
      progress: Math.min((attemptedCount / 10) * 100, 100),
    },
  ];

  const recommendations = useMemo(() => getRecommendations(topicStats), [topicStats]);

  const joinDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
    : "—";
  const lastLogin = recentEvents[0]?.createdAt
    ? timeAgo(recentEvents[0].createdAt)
    : "—";

  return (
    <div className="auth-page-shell">
      <div className="grid-background" />
      <Navbar toggleTheme={toggleTheme} theme={theme} />

      <main className="pd-main">
        {/* ── Hero banner ── */}
        <section className="pd-hero">
          <div className="pd-hero-left">
            <div className="pd-avatar" aria-hidden="true">
              {(user?.name || "U").charAt(0).toUpperCase()}
            </div>
            <div className="pd-hero-info">
              <div className="pd-hero-badges-row">
                <span className="auth-eyebrow">Authenticated session</span>
                <span
                  className={`pd-status-badge pd-status-badge--${backendOk === false ? "warn" : "ok"}`}
                >
                  {backendOk === null
                    ? "Checking…"
                    : backendOk
                      ? "● Active"
                      : "⚠ Offline"}
                </span>
              </div>
              <h1 className="pd-hero-name">{user?.name || "Learner"}</h1>
              <p className="pd-hero-email">{user?.email}</p>
              <div className="pd-hero-meta">
                <span>Joined {joinDate}</span>
                <span className="pd-dot">·</span>
                <span>Last active {lastLogin}</span>
                <span className="pd-dot">·</span>
                <span className="pd-role-chip">Student</span>
              </div>
            </div>
          </div>
          <div className="pd-hero-actions">
            <button
              type="button"
              className="pd-btn pd-btn--primary"
              onClick={() => navigate("/boolforge")}
            >
              Circuit Forge
            </button>
            <button
              type="button"
              className="pd-btn pd-btn--ghost"
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out…" : "Logout"}
            </button>

            <button className="db-icon-btn" title="Notifications">
              <Bell size={18} />
            </button>
            <button className="db-icon-btn" title="Help Guide">
              <HelpCircle size={18} />
            </button>

            <div className="db-header-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : "L"}
            </div>
          </div>
        </header>

        {/* Dashboard Body Panel */}
        <div className="db-body">
          {/* Welcome Intro */}
          <div className="db-hero">
            <h1>Welcome Back, {user?.name || "Learner"}.</h1>
            <p>Your interactive learning dashboard and real-time exercise milestones.</p>
          </div>

        {/* ── Tab nav ── */}
        <nav className="pd-tabs" aria-label="Dashboard sections">
          {["overview", "skills", "activity", "achievements", "saved"].map(
            (tab) => (
              <button
                key={tab}
                type="button"
                className={`pd-tab${activeTab === tab ? " pd-tab--active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ),
          )}
        </nav>

          {logoutError && <p className="auth-error pd-error">{logoutError}</p>}

        {/* ══════════════ OVERVIEW TAB ══════════════ */}
        {activeTab === "overview" && (
          <div className="pd-section">
            {/* Stat cards */}
            <div className="pd-stats-grid">
              <StatCard
                icon="✅"
                label="Problems Solved"
                value={solvedCount}
                sub={`of ${summary.totalProblems || "—"} total`}
                accent="#10b981"
              />
              <StatCard
                icon="⚡"
                label="Attempts Made"
                value={attemptedCount}
                sub="total attempts"
                accent="#3b82f6"
              />
              <StatCard
                icon="📚"
                label="Topics Completed"
                value={completedTopics}
                sub="modules finished"
                accent="#8b5cf6"
              />
              <StatCard
                icon="🔥"
                label="Current Streak"
                value={`${streakCurrent}d`}
                sub={`Longest: ${streakLongest}d`}
                accent="#f59e0b"
              />
              <StatCard
                icon="📅"
                label="Active Days"
                value={activeDays}
                sub="days with activity"
                accent="#06b6d4"
              />
              <StatCard
                icon="🎯"
                label="Completion Rate"
                value={`${summary.completionRate || 0}%`}
                sub="problems solved"
                accent="#ec4899"
              />
            </div>

            {/* Two-column: Performance + Recent Activity */}
            <div className="pd-two-col">
              {/* Performance Insights */}
              <div className="pd-card">
                <h2 className="pd-card-title">Performance Insights</h2>
                <div className="pd-insight-list">
                  <div className="pd-insight-row">
                    <span className="pd-insight-label">Avg. Quiz Score</span>
                    <span className="pd-insight-val pd-insight-val--blue">
                      {solvedCount > 0
                        ? `${Math.round((solvedCount / Math.max(attemptedCount, 1)) * 100)}%`
                        : "—"}
                    </span>
                  </div>
                  <div className="pd-insight-row">
                    <span className="pd-insight-label">Accuracy Trend</span>
                    <span className="pd-insight-val pd-insight-val--green">
                      {solvedCount >= attemptedCount * 0.7 && solvedCount > 0
                        ? "↑ Improving"
                        : solvedCount > 0
                          ? "→ Steady"
                          : "—"}
                    </span>
                  </div>
                  <div className="pd-insight-row">
                    <span className="pd-insight-label">Strongest Area</span>
                    <span className="pd-insight-val pd-insight-val--purple">
                      {Object.entries(topicStats)
                        .sort((a, b) => b[1] - a[1])[0]?.[0]
                        ?.replace(/([A-Z])/g, " $1")
                        .trim() || "—"}
                    </span>
                  </div>
                  <div className="pd-insight-row">
                    <span className="pd-insight-label">Needs Attention</span>
                    <span className="pd-insight-val pd-insight-val--amber">
                      {Object.entries(topicStats)
                        .sort((a, b) => a[1] - b[1])[0]?.[0]
                        ?.replace(/([A-Z])/g, " $1")
                        .trim() || "—"}
                    </span>
                  </div>
                  <div className="pd-insight-row">
                    <span className="pd-insight-label">Session Status</span>
                    <span className="pd-insight-val pd-insight-val--green">
                      JWT Active
                    </span>
                  </div>
                  <div className="pd-insight-row">
                    <span className="pd-insight-label">Backend</span>
                    <span
                      className={`pd-insight-val ${backendOk ? "pd-insight-val--green" : "pd-insight-val--amber"}`}
                    >
                      {backendOk === null
                        ? "Checking…"
                        : backendOk
                          ? "Connected"
                          : "Offline"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="pd-card">
                <h2 className="pd-card-title">Recent Activity</h2>
                {loadingProgress ? (
                  <div className="pd-loading">Loading activity…</div>
                ) : recentEvents.length === 0 ? (
                  <p className="pd-empty">
                    No activity yet. Start solving problems!
                  </p>
                ) : (
                  <ul className="pd-feed">
                    {recentEvents.slice(0, 8).map((ev) => {
                      const meta = EVENT_META[ev.type] || {
                        label: ev.type,
                        color: "#94a3b8",
                        icon: "•",
                      };
                      return (
                        <li
                          key={ev.id || ev.createdAt}
                          className="pd-feed-item"
                        >
                          <span
                            className="pd-feed-dot"
                            style={{ background: meta.color }}
                          >
                            {meta.icon}
                          </span>
                          <div className="pd-feed-body">
                            <span className="pd-feed-label">{meta.label}</span>
                            {ev.title && (
                              <span className="pd-feed-title">
                                "{ev.title}"
                              </span>
                            )}
                          </div>
                          <span className="pd-feed-time">
                            {timeAgo(ev.createdAt)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>

            {/* Recommendations */}
            <div className="pd-card">
              <h2 className="pd-card-title">Recommended for You</h2>
              <div className="pd-recs-grid">
                {recommendations.map((rec) => (
                  <Link
                    key={rec.path}
                    to={rec.path}
                    className="pd-rec-card"
                    style={{ "--rec-color": rec.color }}
                  >
                    <span className="pd-rec-title">{rec.title}</span>
                    <span className="pd-rec-reason">{rec.reason}</span>
                    <span className="pd-rec-arrow">→</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ SKILLS TAB ══════════════ */}
        {activeTab === "skills" && (
          <div className="pd-section">
            <div className="pd-two-col">
              <div className="pd-card">
                <h2 className="pd-card-title">Skill Progress Tracker</h2>
                <p className="pd-card-sub">
                  Topic completion across all learning areas
                </p>
                <div className="pd-skills-list">
                  <SkillBar
                    label="Boolean Algebra"
                    pct={topicStats.booleanAlgebra}
                    color="#3b82f6"
                  />
                  <SkillBar
                    label="K-Map Simplification"
                    pct={topicStats.kmap}
                    color="#8b5cf6"
                  />
                  <SkillBar
                    label="Sequential Circuits"
                    pct={topicStats.sequential}
                    color="#10b981"
                  />
                  <SkillBar
                    label="Number Systems"
                    pct={topicStats.numberSystems}
                    color="#f59e0b"
                  />
                  <SkillBar
                    label="Arithmetic Functions"
                    pct={topicStats.arithmetic}
                    color="#ec4899"
                  />
                </div>
              </div>

              <div className="pd-card">
                <h2 className="pd-card-title">Topic Breakdown</h2>
                <p className="pd-card-sub">Detailed status per topic</p>
                {topicEntries.length === 0 ? (
                  <p className="pd-empty">
                    No topics started yet. Explore the Problems section!
                  </p>
                ) : (
                  <ul className="pd-topic-list">
                    {topicEntries.slice(0, 10).map(([id, t]) => (
                      <li key={id} className="pd-topic-item">
                        <div className="pd-topic-header">
                          <span className="pd-topic-name">{t.title || id}</span>
                          <span
                            className={`pd-topic-status pd-topic-status--${t.status}`}
                          >
                            {t.status?.replace("_", " ")}
                          </span>
                        </div>
                        <div className="pd-skill-track">
                          <div
                            className="pd-skill-fill"
                            style={{
                              width: `${t.completionPercentage || 0}%`,
                              background:
                                t.status === "completed"
                                  ? "#10b981"
                                  : "#3b82f6",
                            }}
                          />
                        </div>
                        <span className="pd-topic-pct">
                          {t.completionPercentage || 0}%
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ ACTIVITY TAB ══════════════ */}
        {activeTab === "activity" && (
          <div className="pd-section">
            <div className="pd-card">
              <h2 className="pd-card-title">Activity Calendar</h2>
              <p className="pd-card-sub">
                Your learning activity over the past month
              </p>
              <div className="pd-cal-legend">
                <span>Less</span>
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className={`pd-cal-dot pd-cal-dot--${i}`} />
                ))}
                <span>More</span>
              </div>
              <div className="pd-cal-grid">
                {calendarDots.map((day) => (
                  <ActivityDot
                    key={day.date}
                    intensity={day.intensity}
                    date={day.date}
                  />
                ))}
              </div>
              <div className="pd-cal-stats">
                <span>
                  🔥 Current streak: <strong>{streakCurrent} days</strong>
                </span>
                <span>
                  🏆 Longest streak: <strong>{streakLongest} days</strong>
                </span>
                <span>
                  📅 Active days: <strong>{activeDays}</strong>
                </span>
              </div>
            </div>

            <div className="pd-card">
              <h2 className="pd-card-title">Full Activity Feed</h2>
              {loadingProgress ? (
                <div className="pd-loading">Loading…</div>
              ) : recentEvents.length === 0 ? (
                <p className="pd-empty">No activity recorded yet.</p>
              ) : (
                <ul className="pd-feed pd-feed--full">
                  {recentEvents.map((ev) => {
                    const meta = EVENT_META[ev.type] || {
                      label: ev.type,
                      color: "#94a3b8",
                      icon: "•",
                    };
                    return (
                      <li key={ev.id || ev.createdAt} className="pd-feed-item">
                        <span
                          className="pd-feed-dot"
                          style={{ background: meta.color }}
                        >
                          {meta.icon}
                        </span>
                        <div className="pd-feed-body">
                          <span className="pd-feed-label">{meta.label}</span>
                          {ev.title && (
                            <span className="pd-feed-title">"{ev.title}"</span>
                          )}
                        </div>
                        <span className="pd-feed-time">
                          {timeAgo(ev.createdAt)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* ══════════════ ACHIEVEMENTS TAB ══════════════ */}
        {activeTab === "achievements" && (
          <div className="pd-section">
            <div className="pd-card">
              <h2 className="pd-card-title">Achievements & Badges</h2>
              <p className="pd-card-sub">
                {badges.filter((b) => b.earned).length} of {badges.length}{" "}
                badges earned
              </p>
              <div className="pd-badges-grid">
                {badges.map((b) => (
                  <Badge key={b.title} {...b} />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════ SAVED TAB ══════════════ */}
        {activeTab === "saved" && (
          <div className="pd-section">
            <div className="pd-card">
              <div className="pd-saved-header">
                <h2 className="pd-card-title">Saved Work</h2>
                <div className="pd-saved-actions">
                  <button
                    type="button"
                    className="pd-btn pd-btn--primary pd-btn--sm"
                    onClick={() => navigate("/boolforge")}
                  >
                    + New Circuit
                  </button>
                  <button
                    type="button"
                    className="pd-btn pd-btn--ghost pd-btn--sm"
                    onClick={() => navigate("/kmapgenerator")}
                  >
                    + New K-Map
                  </button>
                </div>
              </div>
              <div className="pd-saved-grid">
                <div
                  className="pd-saved-card"
                  onClick={() => navigate("/boolforge")}
                >
                  <div className="pd-saved-thumb pd-saved-thumb--circuit">
                    <span>⚡</span>
                  </div>
                  <div className="pd-saved-info">
                    <span className="pd-saved-name">Circuit Forge</span>
                    <span className="pd-saved-type">Logic circuit builder</span>
                  </div>
                  <button
                    type="button"
                    className="pd-btn pd-btn--ghost pd-btn--sm"
                  >
                    Open
                  </button>
                </div>
                <div
                  className="pd-saved-card"
                  onClick={() => navigate("/kmapgenerator")}
                >
                  <div className="pd-saved-thumb pd-saved-thumb--kmap">
                    <span>🗺️</span>
                  </div>
                  <div className="pd-saved-info">
                    <span className="pd-saved-name">K-Map Studio</span>
                    <span className="pd-saved-type">
                      Karnaugh map simplifier
                    </span>
                  </div>
                  <button
                    type="button"
                    className="pd-btn pd-btn--ghost pd-btn--sm"
                  >
                    Open
                  </button>
                </div>
                <div
                  className="pd-saved-card"
                  onClick={() => navigate("/problems")}
                >
                  <div className="pd-saved-thumb pd-saved-thumb--problems">
                    <span>📝</span>
                  </div>
                  <div className="pd-saved-info">
                    <span className="pd-saved-name">Problem Sets</span>
                    <span className="pd-saved-type">
                      {solvedCount} solved · {attemptedCount} attempted
                    </span>
                  </div>
                  <button
                    type="button"
                    className="pd-btn pd-btn--ghost pd-btn--sm"
                  >
                    Open
                  </button>
                </div>
              </div>
            </div>

            {/* System Status */}
            <div className="pd-card">
              <h2 className="pd-card-title">System Status</h2>
              <div className="pd-sys-grid">
                <div className="pd-sys-row">
                  <span className="pd-sys-label">Session</span>
                  <span className="pd-sys-val pd-sys-val--ok">JWT Active</span>
                </div>
                <div className="pd-sys-row">
                  <span className="pd-sys-label">Backend Connection</span>
                  <span
                    className={`pd-sys-val ${backendOk ? "pd-sys-val--ok" : "pd-sys-val--warn"}`}
                  >
                    {backendOk === null
                      ? "Checking…"
                      : backendOk
                        ? "Connected"
                        : "Offline"}
                  </span>
                </div>
                <div className="pd-sys-row">
                  <span className="pd-sys-label">Last Activity</span>
                  <span className="pd-sys-val">{lastLogin}</span>
                </div>
                <div className="pd-sys-row">
                  <span className="pd-sys-label">Account Created</span>
                  <span className="pd-sys-val">{joinDate}</span>
                </div>
                <div className="pd-sys-row">
                  <span className="pd-sys-label">Email</span>
                  <span className="pd-sys-val">{user?.email}</span>
                </div>
                <div className="pd-sys-row">
                  <span className="pd-sys-label">Role</span>
                  <span className="pd-sys-val">Student</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
