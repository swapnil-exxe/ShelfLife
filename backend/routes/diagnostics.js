import express from "express";

const router = express.Router();

/**
 * GET /api/health/diagnostics
 * Returns system uptime, process memory metrics, and runtime health status.
 */
router.get("/", (req, res) => {
  const memoryUsage = process.memoryUsage();
  res.json({
    status: "healthy",
    uptime_sec: Math.floor(process.uptime()),
    memory: {
      rss_mb: (memoryUsage.rss / (1024 * 1024)).toFixed(2),
      heapTotal_mb: (memoryUsage.heapTotal / (1024 * 1024)).toFixed(2),
      heapUsed_mb: (memoryUsage.heapUsed / (1024 * 1024)).toFixed(2)
    },
    node_version: process.version
  });
});

export default router;
