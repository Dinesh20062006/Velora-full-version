/**
 * Velora Award Credits & Incident Reports Persistence Manager
 * Manages user reward credits and local report persistence per specific logged-in user.
 * Rules:
 *  - Submit Report (Query only): +5 Credits
 *  - Submit Report + Upload Evidence: +10 Credits
 */

const CREDITS_KEY = "velora_user_award_credits";
const REPORTS_KEY = "velora_user_submitted_reports";

export function getCurrentUserKey() {
  try {
    const raw = localStorage.getItem("user");
    if (raw) {
      const u = JSON.parse(raw);
      return String(u.userId || u.id || u.email || "default_user");
    }
  } catch {
    // Return default user key on parse failure
  }
  return "default_user";
}

export function getAwardCredits(userKey) {
  const activeKey = userKey || getCurrentUserKey();
  try {
    const stored = localStorage.getItem(`${CREDITS_KEY}_${activeKey}`) || localStorage.getItem(CREDITS_KEY);
    if (stored !== null) {
      const val = parseInt(stored, 10);
      return isNaN(val) ? 15 : val;
    }
  } catch {
    // Return default baseline credits on read error
  }
  return 15; // Baseline credits
}

export function addAwardCredits(points = 5, userKey) {
  const activeKey = userKey || getCurrentUserKey();
  const current = getAwardCredits(activeKey);
  const updated = current + points;
  localStorage.setItem(`${CREDITS_KEY}_${activeKey}`, String(updated));
  localStorage.setItem(CREDITS_KEY, String(updated));
  return updated;
}

export function getLocalReports(userKey) {
  const activeKey = userKey || getCurrentUserKey();
  try {
    const raw = localStorage.getItem(REPORTS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    if (!activeKey) return list;
    return list.filter((r) => !r.userKey || String(r.userKey).toLowerCase() === String(activeKey).toLowerCase());
  } catch {
    return [];
  }
}

export function saveLocalReport(reportData, hasEvidence = false, userKey) {
  const activeKey = userKey || getCurrentUserKey();
  const raw = localStorage.getItem(REPORTS_KEY);
  let reports = raw ? JSON.parse(raw) : [];

  const reportId = reportData.id || reportData.complaintId || Math.floor(100000 + Math.random() * 900000);

  const newReport = {
    id: reportId,
    complaintId: reportId,
    userKey: activeKey,
    reporterUserId: activeKey,
    title: reportData.category || reportData.title || "Reported Incident",
    category: reportData.category || reportData.title || "General Incident",
    description: reportData.description || "Incident reported by user.",
    location: reportData.location || "Location not provided",
    hasEvidence: hasEvidence,
    status: "PENDING",
    createdAt: new Date().toISOString()
  };

  const existingIdx = reports.findIndex((r) => String(r.id) === String(reportId));
  if (existingIdx >= 0) {
    if (hasEvidence && !reports[existingIdx].hasEvidence) {
      reports[existingIdx].hasEvidence = true;
      addAwardCredits(5, activeKey);
    }
  } else {
    reports.unshift(newReport);
    const creditsAwarded = hasEvidence ? 10 : 5;
    addAwardCredits(creditsAwarded, activeKey);
  }

  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
  return newReport;
}
