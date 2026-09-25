import express from "express";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import {
  getDashboardStats,
  getUsers,
  getUserDetails,
  updateUserRole,
  createUser,
  toggleUserStatus,
  resetUserPassword,
  forceLogoutUser,
  deleteUser,
  getUserActivityHistory,
  getUserLoginHistory,
  getUserSessions,
  getUserSecurityEvents,
  getUserLinks,
  getUserRooms,
  getUserProjects,
  getActivityLogs,
  exportActivityLogs,
  getRooms,
  getRoomActivityHistory,
  deleteRoom,
  toggleRoomPrivacy,
  getLinks,
  getLinkHistory,
  deleteLink,
  rescrapeLink,
  getScraperStatus,
  triggerContextSweep,
  getSystemHealth,
} from "../controllers/adminController.js";

const router = express.Router();

// Enforce admin authorization on all routes
router.use(requireAdmin);

// Dashboard Overview Stats
router.get("/dashboard", getDashboardStats);

// User Management & Details
router.get("/users", getUsers);
router.post("/users", createUser);
router.get("/users/:id", getUserDetails);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/disable", toggleUserStatus);
router.post("/users/:id/reset-password", resetUserPassword);
router.post("/users/:id/force-logout", forceLogoutUser);
router.delete("/users/:id", deleteUser);

// User Specific History & Activity
router.get("/users/:id/activity", getUserActivityHistory);
router.get("/users/:id/login-history", getUserLoginHistory);
router.get("/users/:id/sessions", getUserSessions);
router.get("/users/:id/security-events", getUserSecurityEvents);
router.get("/users/:id/links", getUserLinks);
router.get("/users/:id/rooms", getUserRooms);
router.get("/users/:id/projects", getUserProjects);

// Global Activity Logging & Export
router.get("/activity", getActivityLogs);
router.get("/activity/export", exportActivityLogs);

// Room Management & History
router.get("/rooms", getRooms);
router.get("/rooms/:roomId/activity", getRoomActivityHistory);
router.put("/rooms/:id/privacy", toggleRoomPrivacy);
router.delete("/rooms/:id", deleteRoom);

// Link Management & History
router.get("/links", getLinks);
router.get("/links/:id/history", getLinkHistory);
router.post("/links/:id/rescrape", rescrapeLink);
router.delete("/links/:id", deleteLink);

// Scraper & Context Control
router.get("/scraper/status", getScraperStatus);
router.post("/context-feed/run", triggerContextSweep);

// System Health
router.get("/system/health", getSystemHealth);

export default router;
