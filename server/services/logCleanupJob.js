import UserActivityLog from "../models/UserActivityLog.js";
import UserSession from "../models/UserSession.js";

const RETENTION_DAYS = parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS || "365", 10);

export const runLogCleanupJob = async () => {
  try {
    const cutoffDate = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // Delete non-security/non-admin logs older than retention cutoff
    const deletedLogs = await UserActivityLog.deleteMany({
      category: { $nin: ["SECURITY", "ADMIN"] },
      timestamp: { $lt: cutoffDate },
    });

    const deletedSessions = await UserSession.deleteMany({
      status: "ended",
      loginAt: { $lt: cutoffDate },
    });

    if (deletedLogs.deletedCount > 0 || deletedSessions.deletedCount > 0) {
      console.log(`🧹 Log cleanup job: removed ${deletedLogs.deletedCount} old logs and ${deletedSessions.deletedCount} old sessions.`);
    }
  } catch (err) {
    console.error("Log cleanup job error:", err.message);
  }
};
