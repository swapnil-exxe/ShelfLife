import express from "express";
import { requireAdmin } from "../middlewares/adminMiddleware.js";
import {
  getDashboardStats,
  getUsers,
  createUser,
  toggleUserStatus,
  resetUserPassword,
  deleteUser,
  getRooms,
  deleteRoom,
  toggleRoomPrivacy,
  getLinks,
  deleteLink,
  rescrapeLink,
  getScraperStatus,
  triggerContextSweep,
  getSystemHealth,
  getActivityLogs,
} from "../controllers/adminController.js";

const router = express.Router();

// Enforce admin authorization on all routes
router.use(requireAdmin);

// Dashboard
router.get("/dashboard", getDashboardStats);

// User Management
router.get("/users", getUsers);
router.post("/users", createUser);
router.put("/users/:id/disable", toggleUserStatus);
router.post("/users/:id/reset-password", resetUserPassword);
router.delete("/users/:id", deleteUser);

// Room Management
router.get("/rooms", getRooms);
router.put("/rooms/:id/privacy", toggleRoomPrivacy);
router.delete("/rooms/:id", deleteRoom);

// Link Management
router.get("/links", getLinks);
router.post("/links/:id/rescrape", rescrapeLink);
router.delete("/links/:id", deleteLink);

// Scraper & Context Control
router.get("/scraper/status", getScraperStatus);
router.post("/context-feed/run", triggerContextSweep);

// System Health & Audit Logs
router.get("/system/health", getSystemHealth);
router.get("/activity", getActivityLogs);

export default router;
