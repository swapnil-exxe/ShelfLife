import rateLimit from "express-rate-limit";

// ── Rate Limiters ───────────────────────────────────────────────────────────

export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { message: "Too many requests from this IP, please try again after 15 minutes" },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many login or registration attempts. Please try again after 15 minutes" },
});

// ── Input Sanitization & Validation Middleware ───────────────────────────────

export const sanitizeAndValidateInput = (req, res, next) => {
  // Helper to escape HTML characters (prevents XSS)
  const escapeHtml = (str) => {
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;");
  };

  // Helper to recursively traverse and sanitize/validate object properties
  const processObject = (obj) => {
    if (!obj || typeof obj !== "object") return true;

    for (const key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

      // 1. Prevent NoSQL Injection: delete properties starting with $ or containing .
      if (key.startsWith("$") || key.includes(".")) {
        delete obj[key];
        continue;
      }

      const value = obj[key];

      if (typeof value === "string") {
        const trimmed = value.trim();

        // 1. Rejects oversized strings to mitigate memory bloating / DoS
        if (trimmed.length > 2048) {
          res.status(400).json({ message: `Field '${key}' exceeds maximum length of 2048 characters.` });
          return false;
        }

        // 2. Format Validations
        if (key === "email") {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(trimmed)) {
            res.status(400).json({ message: "Invalid email format." });
            return false;
          }
        }

        if (key === "url" || key === "originalUrl") {
          try {
            const parsedUrl = new URL(trimmed);
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
              res.status(400).json({ message: "URL protocol must be HTTP or HTTPS." });
              return false;
            }
          } catch {
            res.status(400).json({ message: "Invalid URL format." });
            return false;
          }
        }

        if (key === "username" && (trimmed.length < 2 || trimmed.length > 30)) {
          res.status(400).json({ message: "Username must be between 2 and 30 characters." });
          return false;
        }

        if (key === "password" && trimmed.length < 6) {
          res.status(400).json({ message: "Password must be at least 6 characters." });
          return false;
        }

        // 3. HTML Sanitization for fields rendered in UI
        // We do NOT escape sensitive system strings (passwords, emails, raw urls)
        const isUrlField = key === "url" || key === "originalUrl" || key === "successorUrl" || key.toLowerCase().endsWith("url");
        if (key !== "password" && key !== "email" && !isUrlField) {
          obj[key] = escapeHtml(trimmed);
        } else {
          obj[key] = trimmed;
        }
      } else if (typeof value === "object" && value !== null) {
        if (!processObject(value)) return false;
      }
    }
    return true;
  };

  // Process HTTP inputs
  if (!processObject(req.body)) return;
  if (!processObject(req.query)) return;
  if (!processObject(req.params)) return;

  next();
};
