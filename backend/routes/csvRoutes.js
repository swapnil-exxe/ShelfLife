import express from "express";
import { exportInventoryToCSV, parseCSVToInventory } from "../services/csvService.js";

const router = express.Router();

/**
 * POST /api/inventory/export-csv
 * Exports JSON inventory payload to downloadable CSV content.
 */
router.post("/export-csv", (req, res) => {
  const { items } = req.body || {};
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: "Invalid items array." });
  }

  const csvContent = exportInventoryToCSV(items);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", 'attachment; filename="pantry_inventory.csv"');
  return res.status(200).send(csvContent);
});

/**
 * POST /api/inventory/import-csv
 * Parses uploaded/raw CSV payload into structured inventory JSON.
 */
router.post("/import-csv", (req, res) => {
  const { csvText } = req.body || {};
  if (typeof csvText !== "string") {
    return res.status(400).json({ error: "Missing or invalid csvText string." });
  }

  const parsedItems = parseCSVToInventory(csvText);
  return res.status(200).json({
    success: true,
    importedCount: parsedItems.length,
    items: parsedItems
  });
});

export default router;
