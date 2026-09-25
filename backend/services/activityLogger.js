import UserActivityLog from "../models/UserActivityLog.js";
import UserSession from "../models/UserSession.js";
import User from "../models/User.js";

// Helper to parse basic User-Agent string
const parseUserAgent = (uaString = "") => {
  let browser = "Browser";
  let operatingSystem = "OS";
  let deviceType = "Desktop";

  const ua = uaString.toLowerCase();
  if (ua.includes("firefox")) browser = "Firefox";
  else if (ua.includes("chrome")) browser = "Chrome";
  else if (ua.includes("safari")) browser = "Safari";
  else if (ua.includes("edge")) browser = "Edge";

  if (ua.includes("macintosh") || ua.includes("mac os")) operatingSystem = "macOS";
  else if (ua.includes("windows")) operatingSystem = "Windows";
  else if (ua.includes("linux")) operatingSystem = "Linux";
  else if (ua.includes("android")) operatingSystem = "Android";
  else if (ua.includes("iphone") || ua.includes("ipad")) operatingSystem = "iOS";

  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) deviceType = "Mobile";

  return { browser, operatingSystem, deviceType };
};

// Helper to sanitize metadata and strip any sensitive fields
const sanitizeMetadata = (obj = {}) => {
  if (!obj || typeof obj !== "object") return {};
  const cleaned = {};
  const SENSITIVE_KEYS = new Set([
    "password", "oldpassword", "newpassword", "passwordhash", "token",
    "jwt", "secret", "authorization", "key", "apikey", "mongouri"
  ]);

  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) continue;
    if (typeof v === "object" && v !== null) {
      cleaned[k] = sanitizeMetadata(v);
    } else {
      cleaned[k] = v;
    }
  }
  return cleaned;
};

// Non-blocking async event logger
export const logUserActivity = (userId, action, category, targetType = null, targetId = null, rawMetadata = {}, req = null) => {
  setImmediate(async () => {
    try {
      let ipAddress = "";
      let userAgent = "";

      if (req) {
        ipAddress = req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
        userAgent = req.headers["user-agent"] || "";
      }

      const metadata = sanitizeMetadata(rawMetadata);

      await UserActivityLog.create({
        user: userId || null,
        action,
        category,
        targetType,
        targetId: targetId ? String(targetId) : null,
        metadata,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      });

      if (userId) {
        await User.findByIdAndUpdate(userId, { lastActivity: new Date() }).catch(() => {});
      }
    } catch (err) {
      console.error("Non-blocking activity logging error:", err.message);
    }
  });
};

// Start a user session on login
export const createUserSession = async (userId, req) => {
  try {
    const ipAddress = req ? (req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "") : "";
    const userAgent = req ? (req.headers["user-agent"] || "") : "";
    const { browser, operatingSystem, deviceType } = parseUserAgent(userAgent);
    const sessionId = "sess_" + Math.random().toString(36).substring(2, 11) + Date.now();

    const session = await UserSession.create({
      user: userId,
      sessionId,
      loginAt: new Date(),
      lastSeenAt: new Date(),
      ipAddress,
      userAgent,
      deviceType,
      browser,
      operatingSystem,
      status: "active",
    });

    await User.findByIdAndUpdate(userId, {
      lastLogin: new Date(),
      $inc: { loginCount: 1 },
    }).catch(() => {});

    return session;
  } catch (err) {
    console.error("Session creation error:", err.message);
    return null;
  }
};
