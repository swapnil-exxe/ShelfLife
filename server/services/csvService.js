/**
 * CSV import and export service for pantry inventory management.
 */

export function exportInventoryToCSV(items = []) {
  const headers = ["name", "category", "quantity", "expirationDate", "notes"];
  const rows = items.map((item) => {
    const escapeField = (val) => {
      const str = String(val ?? "");
      if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    return [
      escapeField(item.name),
      escapeField(item.category || "General"),
      escapeField(item.quantity || 1),
      escapeField(item.expirationDate || ""),
      escapeField(item.notes || "")
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\n");
}

export function parseCSVToInventory(csvText = "") {
  if (!csvText || !csvText.trim()) {
    return [];
  }

  const lines = csvText.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) {
    return [];
  }

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const parsedItems = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map((v) => v.trim().replace(/^"|"$/g, ""));
    const item = {};
    headers.forEach((header, idx) => {
      item[header] = values[idx] || "";
    });

    if (item.name) {
      parsedItems.push({
        name: item.name,
        category: item.category || "General",
        quantity: parseInt(item.quantity, 10) || 1,
        expirationDate: item.expirationDate || "",
        notes: item.notes || ""
      });
    }
  }

  return parsedItems;
}
