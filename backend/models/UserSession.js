import mongoose from "mongoose";

const userSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    loginAt: {
      type: Date,
      default: Date.now,
    },
    logoutAt: {
      type: Date,
      default: null,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    deviceType: {
      type: String,
      default: "Desktop",
    },
    browser: {
      type: String,
      default: "Browser",
    },
    operatingSystem: {
      type: String,
      default: "OS",
    },
    status: {
      type: String,
      enum: ["active", "ended"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

userSessionSchema.index({ user: 1, loginAt: -1 });
userSessionSchema.index({ sessionId: 1 });
userSessionSchema.index({ status: 1 });

export default mongoose.model("UserSession", userSessionSchema);
