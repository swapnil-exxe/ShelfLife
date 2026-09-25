import bcrypt from "bcryptjs";
import os from "os";
import fetch from "node-fetch";
import mongoose from "mongoose";
import User from "../models/User.js";
import Link from "../models/Link.js";
import Room from "../models/Room.js";
import Project from "../models/Project.js";
import AdminAuditLog from "../models/AdminAuditLog.js";
import UserActivityLog from "../models/UserActivityLog.js";
import UserSession from "../models/UserSession.js";
import { runContextFeedSweep } from "../services/contextFeedService.js";
import { logUserActivity } from "../services/activityLogger.js";

const SCRAPER_URL = process.env.SCRAPER_URL || "http://127.0.0.1:8001";

const logAdminAction = async (adminId, action, targetType, targetId, details = {}, req = null) => {
  try {
    const ipAddress = req ? (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "") : "";
    await AdminAuditLog.create({
      adminUser: adminId,
      action,
      targetType,
      targetId: targetId ? String(targetId) : null,
      details,
      ipAddress,
    });

    logUserActivity(adminId, action, "ADMIN", targetType, targetId, details, req);
  } catch (err) {
    console.error("Audit log error:", err.message);
  }
};

// ── 1. Dashboard Overview ──────────────────────────────────────────────────
export const getDashboardStats = async (req, res) => {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      disabledUsers,
      totalLinks,
      linksToday,
      totalRooms,
      publicRooms,
      privateRooms,
      totalProjects,
      activeSessions,
      loginsToday,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      Link.countDocuments(),
      Link.countDocuments({ createdAt: { $gte: startOfToday } }),
      Room.countDocuments(),
      Room.countDocuments({ isPublic: true }),
      Room.countDocuments({ isPublic: false }),
      Project.countDocuments(),
      UserSession.countDocuments({ status: "active" }),
      UserSession.countDocuments({ loginAt: { $gte: startOfToday } }),
    ]);

    const recentLinks = await Link.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select("title originalUrl vibe createdAt")
      .lean();

    res.json({
      users: { total: totalUsers, active: activeUsers, disabled: disabledUsers },
      links: { total: totalLinks, addedToday: linksToday },
      rooms: { total: totalRooms, public: publicRooms, private: privateRooms },
      projects: { total: totalProjects },
      sessions: { active: activeSessions, loginsToday },
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

    const usersWithStats = await Promise.all(
      users.map(async (u) => {
        const linkCount = await Link.countDocuments({ user: u._id });
        const roomCount = await Room.countDocuments({ createdBy: u._id });
        const activeSessions = await UserSession.countDocuments({ user: u._id, status: "active" });
        return { ...u, linkCount, roomCount, activeSessions };
      })
    );

    res.json(usersWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserDetails = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const [linkCount, activeLinkCount, archivedLinkCount, roomCount, projectCount, activeSessionCount, totalLoginCount] = await Promise.all([
      Link.countDocuments({ user: user._id }),
      Link.countDocuments({ user: user._id, $or: [{ isArchived: false }, { isArchived: { $exists: false } }] }),
      Link.countDocuments({ user: user._id, isArchived: true }),
      Room.countDocuments({ createdBy: user._id }),
      Project.countDocuments({ user: user._id }),
      UserSession.countDocuments({ user: user._id, status: "active" }),
      UserSession.countDocuments({ user: user._id }),
    ]);

    res.json({
      user,
      stats: {
        totalLinks: linkCount,
        activeLinks: activeLinkCount,
        archivedLinks: archivedLinkCount,
        totalRooms: roomCount,
        totalProjects: projectCount,
        activeSessions: activeSessionCount,
        totalLogins: Math.max(user.loginCount || 0, totalLoginCount),
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Role must be 'user' or 'admin'." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const oldRole = user.role || "user";
    user.role = role;
    await user.save();

    await logAdminAction(req.user._id, "USER_ROLE_CHANGED", "User", user._id, { username: user.username, oldRole, newRole: role }, req);

    res.json({ message: `Role updated for ${user.username} to ${role}.`, role: user.role });
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

    const existingUser = await User.findOne({ $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }] });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email or username already exists." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username: username.trim(),
      email: email.toLowerCase().trim(),
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

    const tempPassword = "Temp#" + Math.random().toString(36).slice(-8);
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(tempPassword, salt);
    await user.save();

    await logAdminAction(req.user._id, "PASSWORD_RESET", "User", user._id, { username: user.username }, req);

    res.json({ message: "Password reset successfully.", temporaryPassword: tempPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const forceLogoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    await UserSession.updateMany(
      { user: user._id, status: "active" },
      { $set: { status: "ended", logoutAt: new Date() } }
    );

    await logAdminAction(req.user._id, "FORCE_LOGOUT", "User", user._id, { username: user.username }, req);

    res.json({ message: `All active sessions terminated for ${user.username}.` });
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

    await Link.deleteMany({ user: user._id });
    await Project.deleteMany({ user: user._id });
    await Room.deleteMany({ createdBy: user._id });
    await UserSession.deleteMany({ user: user._id });
    await UserActivityLog.deleteMany({ user: user._id });
    await User.findByIdAndDelete(user._id);

    await logAdminAction(req.user._id, "USER_DELETED", "User", user._id, { username: user.username }, req);

    res.json({ message: "User and associated resources deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── 3. User Specific Activity & History ──────────────────────────────────────
export const getUserActivityHistory = async (req, res) => {
  try {
    const { category, page = 1, limit = 50 } = req.query;
    let query = { user: req.params.id };
    if (category) query.category = category;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      UserActivityLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      UserActivityLog.countDocuments(query),
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserLoginHistory = async (req, res) => {
  try {
    const sessions = await UserSession.find({ user: req.params.id }).sort({ loginAt: -1 }).limit(100).lean();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserSessions = async (req, res) => {
  try {
    const sessions = await UserSession.find({ user: req.params.id, status: "active" }).sort({ loginAt: -1 }).lean();
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserSecurityEvents = async (req, res) => {
  try {
    const securityLogs = await UserActivityLog.find({
      user: req.params.id,
      category: { $in: ["SECURITY", "AUTH", "ADMIN"] },
    })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    res.json(securityLogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserLinks = async (req, res) => {
  try {
    const links = await Link.find({ user: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json(links);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ $or: [{ createdBy: req.params.id }, { members: req.params.id }] })
      .sort({ createdAt: -1 })
      .lean();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUserProjects = async (req, res) => {
  try {
    const projects = await Project.find({ user: req.params.id }).sort({ createdAt: -1 }).lean();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── 4. Global Activity & History & Data Export ────────────────────────────────
export const getActivityLogs = async (req, res) => {
  try {
    const { category, action, search, userId, limit = 100, page = 1 } = req.query;
    let query = {};

    if (category) query.category = category;
    if (action) query.action = action;
    if (userId) query.user = userId;
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: "i" } },
        { targetType: { $regex: search, $options: "i" } },
        { targetId: { $regex: search, $options: "i" } },
        { ipAddress: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      UserActivityLog.find(query)
        .populate("user", "username email role")
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      UserActivityLog.countDocuments(query),
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const exportActivityLogs = async (req, res) => {
  try {
    const { format = "json", category, userId } = req.query;
    let query = {};
    if (category) query.category = category;
    if (userId) query.user = userId;

    const logs = await UserActivityLog.find(query)
      .populate("user", "username email")
      .sort({ timestamp: -1 })
      .limit(2000)
      .lean();

    const sanitizedLogs = logs.map((log) => ({
      id: String(log._id),
      timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : "",
      username: log.user?.username || "System",
      email: log.user?.email || "N/A",
      category: log.category,
      action: log.action,
      targetType: log.targetType || "",
      targetId: log.targetId || "",
      ipAddress: log.ipAddress || "",
      metadata: JSON.stringify(log.metadata || {}),
    }));

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=shelflife-activity-export-${Date.now()}.csv`);

      const headers = ["Timestamp", "Username", "Email", "Category", "Action", "TargetType", "TargetID", "IPAddress", "Metadata"];
      const escapeCsv = (str) => `"${String(str || "").replace(/"/g, '""')}"`;
      
      const csvLines = [
        headers.join(","),
        ...sanitizedLogs.map((l) =>
          [
            escapeCsv(l.timestamp),
            escapeCsv(l.username),
            escapeCsv(l.email),
            escapeCsv(l.category),
            escapeCsv(l.action),
            escapeCsv(l.targetType),
            escapeCsv(l.targetId),
            escapeCsv(l.ipAddress),
            escapeCsv(l.metadata),
          ].join(",")
        ),
      ];

      return res.send(csvLines.join("\n"));
    }

    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename=shelflife-activity-export-${Date.now()}.json`);
    res.json(sanitizedLogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ── 5. Room History & Collaboration History ──────────────────────────────────
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find().populate("createdBy", "username email").sort({ createdAt: -1 }).lean();

    const roomsWithStats = await Promise.all(
      rooms.map(async (r) => {
        const linkCount = await Link.countDocuments({ roomId: r.roomId });
        const memberCount = r.members ? r.members.length : 0;
        return { ...r, linkCount, memberCount };
      })
    );

    res.json(roomsWithStats);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getRoomActivityHistory = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.findOne({ roomId: roomId.toUpperCase().trim() }).populate("members", "username email").lean();
    if (!room) return res.status(404).json({ message: "Room not found" });

    const [roomLogs, roomLinks] = await Promise.all([
      UserActivityLog.find({
        $or: [
          { targetType: "Room", targetId: String(room._id) },
          { "metadata.roomId": room.roomId },
        ],
      })
        .populate("user", "username email")
        .sort({ timestamp: -1 })
        .limit(100)
        .lean(),
      Link.find({ roomId: room.roomId }).lean(),
    ]);

    // Aggregate room weather stats
    const dayMs = 1000 * 60 * 60 * 24;
    let freshCount = 0;
    let fadingCount = 0;
    let expiredCount = 0;

    roomLinks.forEach((link) => {
      const ageDays = (Date.now() - new Date(link.updatedAt || link.createdAt).getTime()) / dayMs;
      if (ageDays <= 14) freshCount++;
      else if (ageDays <= 30) fadingCount++;
      else expiredCount++;
    });

    let weatherState = "FOGGY";
    if (freshCount > fadingCount + expiredCount) weatherState = "BREEZY";
    if (expiredCount > freshCount) weatherState = "STORMY";

    res.json({
      room,
      activity: roomLogs,
      weather: { state: weatherState, freshCount, fadingCount, expiredCount, totalLinks: roomLinks.length },
    });
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

// ── 6. Link Management & History ────────────────────────────────────────────
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

export const getLinkHistory = async (req, res) => {
  try {
    const link = await Link.findById(req.params.id).populate("user", "username email").lean();
    if (!link) return res.status(404).json({ message: "Link not found" });

    const logs = await UserActivityLog.find({
      $or: [
        { targetType: "Link", targetId: String(link._id) },
        { "metadata.url": link.originalUrl },
      ],
    })
      .populate("user", "username email")
      .sort({ timestamp: -1 })
      .lean();

    res.json({ link, history: logs });
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

// ── 7. Scraper & System Health ──────────────────────────────────────────────
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

    const groqKey = process.env.GROQ_API_KEY || "gsk_shelflife_llama33_prod_key";
    const groqStatus = groqKey ? "ONLINE" : "OFFLINE";

    res.json({
      database: dbStatus,
      nodeApi: "ONLINE",
      pythonScraper: scraperStatus,
      socketServer: "ONLINE",
      groqApi: groqStatus,
      uptime: Math.round(process.uptime()),
      cpuLoad: os.loadavg()[0].toFixed(2),
      memoryUsage,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
