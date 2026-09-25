import bcrypt from "bcryptjs";
import os from "os";
import fetch from "node-fetch";
import mongoose from "mongoose";
import User from "../models/User.js";
import Link from "../models/Link.js";
import Room from "../models/Room.js";
import Project from "../models/Project.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import { runContextFeedSweep } from "../services/contextFeedService.js";

const SCRAPER_URL = process.env.SCRAPER_URL || "http://127.0.0.1:8001";

const logAdminAction = async (adminId, action, targetType, targetId, details = {}, req = null) => {
  try {
    const ipAddress = req ? (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "") : "";
    await AdminAuditLog.create({
      adminUser: adminId,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      details,
      ipAddress,
    });
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

// ── 1. Dashboard Overview ──────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const [userCount, linkCount, roomCount, projectCount, activeUsersCount] = await Promise.all([
      User.countDocuments(),
      Link.countDocuments(),
      Room.countDocuments(),
      Project.countDocuments(),
      User.countDocuments({ isActive: true }),
    ]);

    const recentLinks = await Link.find().sort({ createdAt: -1 }).limit(5).select("title originalUrl vibe createdAt").lean();

    res.json({
      users: userCount,
      activeUsers: activeUsersCount,
      links: linkCount,
      rooms: roomCount,
      projects: projectCount,
      recentLinks,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── 2. User Management ──────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    const { search, role, status } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    if (role) query.role = role;
    if (status === "active") query.isActive = true;
    if (status === "disabled") query.isActive = false;

    // CRITICAL: Exclude password field
    const users = await User.find(query).select("-password").sort({ createdAt: -1 }).lean();

    // Attach stats per user
    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const linkCount = await Link.countDocuments({ user: u._id });
        const roomCount = await Room.countDocuments({ createdBy: u._id });
        return { ...u, linkCount, roomCount };
      })
    );

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, email, and password are required." });
    }

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role === "admin" ? "admin" : "user",
      isActive: true,
    });

    await newUser.save();

    await logAdminAction(req.user._id, "ADMIN_CREATED_USER", "User", newUser._id, { username, email, role }, req);

    const userRes = newUser.toObject();
    delete userRes.password;
    res.status(201).json(userRes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = !user.isActive;
    await user.save();

    const actionName = user.isActive ? "USER_ENABLED" : "USER_DISABLED";
    await logAdminAction(req.user._id, actionName, "User", user._id, { username: user.username }, req);

    res.json({ message: `User status changed to ${user.isActive ? "active" : "disabled"}.`, isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate temporary password
    const tempPassword = "Temp#" + Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);
    await user.save();

    await logAdminAction(req.user._id, "PASSWORD_RESET", "User", user._id, { username: user.username }, req);

    // Only show temporary password once to admin
    res.json({ message: "Password reset successfully.", temporaryPassword: tempPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (String(user._id) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot delete your own admin account." });
    }

    // Clean user resources
    await Link.deleteMany({ user: user._id });
    await Project.deleteMany({ user: user._id });
    await Room.deleteMany({ createdBy: user._id });
    await User.findByIdAndDelete(user._id);

    await logAdminAction(req.user._id, "USER_DELETED", "User", user._id, { username: user.username }, req);

    res.json({ message: "User and associated resources deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── 3. Room Management ──────────────────────────────────────────────────────
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate("createdBy", "username email").sort({ createdAt: -1 }).lean();
    
    const roomsWithStats = await Promise.all(
      rooms.map(async (r) => {
        const linkCount = await Link.countDocuments({ roomId: r.roomId });
        return { ...r, linkCount };
      })
    );

    res.json(roomsWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    await Link.deleteMany({ roomId: room.roomId });
    await Project.deleteMany({ roomId: room.roomId });
    await Room.findByIdAndDelete(room._id);

    await logAdminAction(req.user._id, "ROOM_DELETED", "Room", room._id, { roomId: room.roomId }, req);

    res.json({ message: "Room and contained links deleted." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const toggleRoomPrivacy = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.isPublic = !room.isPublic;
    await room.save();

    await logAdminAction(req.user._id, "ROOM_PRIVACY_TOGGLED", "Room", room._id, { isPublic: room.isPublic }, req);

    res.json({ message: `Room is now ${room.isPublic ? "public" : "private"}.`, isPublic: room.isPublic });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── 4. Link Management ──────────────────────────────────────────────────────
export const getLinks = async (req, res) => {
  try {
    const { search, vibe, archived } = req.query;
    let query = {};

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { originalUrl: { $regex: search, $options: "i" } },
      ];
    }
    if (vibe) query.vibe = vibe;
    if (archived === "true") query.isArchived = true;
    if (archived === "false") query.isArchived = false;

    const links = await Link.find(query).populate("user", "username email").sort({ createdAt: -1 }).limit(100).lean();
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteLink = async (req, res) => {
  try {
    const link = await Link.findByIdAndDelete(req.params.id);
    if (!link) return res.status(404).json({ message: "Link not found" });

    await logAdminAction(req.user._id, "LINK_DELETED", "Link", link._id, { title: link.title, url: link.originalUrl }, req);

    res.json({ message: "Link deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rescrapeLink = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id);
    if (!link) return res.status(404).json({ message: "Link not found" });

    // Call Python Scraper
    const scrapeRes = await fetch(`${SCRAPER_URL}/scrape`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: link.originalUrl }),
    });

    const scrapeData = await scrapeRes.json();
    if (scrapeData.success && scrapeData.data) {
      const data = scrapeData.data;
      link.title = data.title || link.title;
      link.content = data.text || link.content;
      await link.save();

      await logAdminAction(req.user._id, "LINK_RESCRAPED", "Link", link._id, { url: link.originalUrl, quality: data.quality_score }, req);
      return res.json({ message: "Link rescraped successfully.", link, scrapeData: data });
    }

    res.status(500).json({ message: "Scraper service failed to parse URL." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── 5. Scraper & Context Feed Control ───────────────────────────────────────
export const getScraperStatus = async (req, res) => {
  try {
    const [healthRes, statsRes] = await Promise.all([
      fetch(`${SCRAPER_URL}/health`).then((r) => r.json()).catch(() => ({ status: "OFFLINE" })),
      fetch(`${SCRAPER_URL}/stats`).then((r) => r.json()).catch(() => ({ total_scrapes: 0 })),
    ]);

    res.json({ health: healthRes, stats: statsRes });
  } catch (err) {
    res.json({ health: { status: "OFFLINE" }, stats: {} });
  }
};

export const triggerContextSweep = async (req, res) => {
  try {
    const result = await runContextFeedSweep({ limit: 10 });
    await logAdminAction(req.user._id, "CONTEXT_SWEEP_STARTED", "System", null, result, req);
    res.json({ message: "Context feed sweep triggered successfully.", result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── 6. System Health & Logs ──────────────────────────────────────────────────
export const getSystemHealth = async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState === 1 ? "ONLINE" : "OFFLINE";
    let scraperStatus = "OFFLINE";

    try {
      const scraperRes = await fetch(`${SCRAPER_URL}/health`, { timeout: 3000 });
      if (scraperRes.ok) scraperStatus = "ONLINE";
    } catch {}

    const freeMemMb = Math.round(os.freemem() / (1024 * 1024));
    const totalMemMb = Math.round(os.totalmem() / (1024 * 1024));
    const memoryUsage = `${totalMemMb - freeMemMb} MB / ${totalMemMb} MB`;

    res.json({
      database: dbStatus,
      nodeApi: "ONLINE",
      pythonScraper: scraperStatus,
      socketServer: "ONLINE",
      groqApi: process.env.GROQ_API_KEY ? "ONLINE" : "OFFLINE",
      uptime: Math.round(process.uptime()),
      cpuLoad: os.loadavg()[0].toFixed(2),
      memoryUsage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getActivityLogs = async (req, res) => {
  try {
    const logs = await AdminAuditLog.find().populate("adminUser", "username email").sort({ createdAt: -1 }).limit(100).lean();
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
