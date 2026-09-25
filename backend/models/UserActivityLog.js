import mongoose from "mongoose";

const userActivityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      default: null,
    },
    action: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "AUTH",
        "USER",
        "LINK",
        "PROJECT",
        "ROOM",
        "COLLABORATION",
        "SECURITY",
        "ADMIN",
        "SCRAPER",
        "SYSTEM",
      ],
      required: true,
    },
    targetType: {
      type: String,
      default: null,
    },
    targetId: {
      type: String,
      default: null,
    },
    metadata: {
      type: Object,
      default: {},
    },
    ipAddress: {
      type: String,
      default: "",
    },
    userAgent: {
      type: String,
      default: "",
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Performance Indexes
userActivityLogSchema.index({ user: 1, timestamp: -1 });
userActivityLogSchema.index({ action: 1, timestamp: -1 });
userActivityLogSchema.index({ category: 1, timestamp: -1 });
userActivityLogSchema.index({ targetType: 1, targetId: 1 });

export default mongoose.model("UserActivityLog", userActivityLogSchema);
