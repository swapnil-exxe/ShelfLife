import assert from "node:assert";
import test from "node:test";
import { exportInventoryToCSV, parseCSVToInventory } from "../services/csvService.js";

test("exportInventoryToCSV formats inventory items into valid CSV string", () => {
  const items = [
    { name: "Apples", category: "Fruit", quantity: 5, expirationDate: "2026-09-20", notes: "Fresh" },
    { name: "Milk, Whole", category: "Dairy", quantity: 2, expirationDate: "2026-09-18", notes: 'Contains "dairy"' }
  ];

  const csvOutput = exportInventoryToCSV(items);
  assert.strictEqual(typeof csvOutput, "string");
  assert.ok(csvOutput.includes("name,category,quantity,expirationDate,notes"));
  assert.ok(csvOutput.includes("Apples,Fruit,5,2026-09-20,Fresh"));
  assert.ok(csvOutput.includes('"Milk, Whole"'));
});

test("parseCSVToInventory parses valid CSV string into item objects", () => {
  const csvText = `name,category,quantity,expirationDate,notes\nRice,Grains,10,2026-12-31,Bulk bag\nEggs,Dairy,12,2026-09-25,Organic`;

  const items = parseCSVToInventory(csvText);
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0].name, "Rice");
  assert.strictEqual(items[0].quantity, 10);
  assert.strictEqual(items[1].name, "Eggs");
  assert.strictEqual(items[1].category, "Dairy");
});
