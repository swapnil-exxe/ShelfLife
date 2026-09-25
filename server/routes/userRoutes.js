import express from "express";
const router = express.Router();

import {
  registerUser,
  loginUser,
  getMyProfile,
  getMe,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

// Define routes
router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/profile", authMiddleware, getMyProfile);
router.get("/me", authMiddleware, getMe);

export default router;
