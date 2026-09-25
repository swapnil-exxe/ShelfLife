import assert from "node:assert";
import test from "node:test";
import diagnosticsRouter from "../routes/diagnostics.js";

test("Diagnostics route exports express router", () => {
  assert.strictEqual(typeof diagnosticsRouter, "function");
});
