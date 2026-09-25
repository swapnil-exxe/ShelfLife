import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Link from "../models/Link.js";
import UserSession from "../models/UserSession.js";
import { logUserActivity, createUserSession } from "../services/activityLogger.js";

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();

  try {
    // Check if user already exists
    let user = await User.findOne({ email: normalizedEmail });
    if (user) {
      logUserActivity(null, "LOGIN_FAILED", "AUTH", "User", null, { email: normalizedEmail, reason: "Already registered" }, req);
      return res.status(400).json({ message: "User already exists" });
    }

    // Create new user instance
    user = new User({
      username: username?.trim(),
      email: normalizedEmail,
      password,
    });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    // Save user to database
    await user.save();

    logUserActivity(user._id, "ACCOUNT_CREATED", "USER", "User", user._id, { username: user.username, email: user.email }, req);
    logUserActivity(user._id, "LOGIN_SUCCESS", "AUTH", "User", user._id, { username: user.username }, req);
    const session = await createUserSession(user._id, req);

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
      sessionId: session?.sessionId || null,
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role || "user" } });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/users/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email?.toLowerCase().trim();

  try {
    // Check if user exists
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      logUserActivity(null, "LOGIN_FAILED", "AUTH", "User", null, { email: normalizedEmail, reason: "Email not registered" }, req);
      return res.status(400).json({ message: "Email is not registered. Please sign up first." });
    }

    if (user.isActive === false) {
      logUserActivity(user._id, "LOGIN_FAILED", "AUTH", "User", user._id, { email: normalizedEmail, reason: "Account disabled" }, req);
      return res.status(403).json({ message: "Your account has been disabled. Contact admin." });
    }

    // Compare entered password with hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      logUserActivity(user._id, "LOGIN_FAILED", "AUTH", "User", user._id, { email: normalizedEmail, reason: "Incorrect password" }, req);
      return res.status(400).json({ message: "Incorrect password." });
    }

    logUserActivity(user._id, "LOGIN_SUCCESS", "AUTH", "User", user._id, { username: user.username }, req);
    const session = await createUserSession(user._id, req);

    // Create JWT payload
    const payload = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
      sessionId: session?.sessionId || null,
    };

    // Sign token
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: "5h" },
      (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role || "user" } });
      },
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
export const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const totalUrlsPosted = await Link.countDocuments({ user: req.user.id });
    const activeUrls = await Link.countDocuments({
      user: req.user.id,
      $or: [{ isArchived: false }, { isArchived: { $exists: false } }],
    });
    const archivedUrls = await Link.countDocuments({
      user: req.user.id,
      isArchived: true,
    });

    return res.json({
      user,
      stats: {
        totalUrlsPosted,
        activeUrls,
        archivedUrls,
      },
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server error");
  }
};

// @desc    Get current user object
// @route   GET /api/users/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password").lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

// @desc    Update current user profile (username, email, password)
// @route   PUT /api/users/profile
// @access  Private
export const updateMyProfile = async (req, res) => {
  const { username, email, currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If updating password or email, verify current password
    if (newPassword || (email && email.toLowerCase().trim() !== user.email)) {
      if (!currentPassword) {
        return res.status(400).json({ message: "Current password is required to update security credentials." });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: "Incorrect current password." });
      }
    }

    // Update username if provided
    if (username && username.trim() !== user.username) {
      user.username = username.trim();
    }

    // Update email if provided
    if (email && email.toLowerCase().trim() !== user.email) {
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already taken by another account." });
      }
      user.email = normalizedEmail;
    }

    // Update password if newPassword provided
    if (newPassword) {
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long." });
      }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      logUserActivity(user._id, "PASSWORD_CHANGED", "SECURITY", "User", user._id, {}, req);
    }

    await user.save();
    logUserActivity(user._id, "PROFILE_UPDATED", "USER", "User", user._id, { username: user.username, email: user.email }, req);

    const userObj = user.toObject();
    delete userObj.password;
    res.json({ message: "Profile updated successfully!", user: userObj });
  } catch (err) {
    console.error("Update profile error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

