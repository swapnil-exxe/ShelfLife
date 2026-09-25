import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const requireAdmin = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.user?.id || decoded.id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.isActive === false) {
      return res.status(403).json({ message: "Your account has been disabled" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin rights required." });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Admin Authorization Error:", error.message);
    return res.status(401).json({ message: "Not authorized, invalid token" });
  }
};
