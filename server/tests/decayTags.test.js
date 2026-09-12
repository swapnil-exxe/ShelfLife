import test from "node:test";
import assert from "node:assert/strict";
import { calculateLinkDecay } from "../controllers/linkController.js";

test("calculateLinkDecay identifies fresh items <= 14 days old", () => {
  const freshDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const decay = calculateLinkDecay(freshDate);
  assert.equal(decay.status, "Fresh");
  assert.equal(decay.decayPercentage, 0);
  assert.equal(decay.color, "green");
});

test("calculateLinkDecay calculates fading percentage between 14 and 30 days", () => {
  const fadingDate = new Date(Date.now() - 22 * 24 * 60 * 60 * 1000);
  const decay = calculateLinkDecay(fadingDate);
  assert.equal(decay.status, "Fading");
  assert.equal(decay.color, "yellow");
  assert.equal(decay.decayPercentage > 0 && decay.decayPercentage < 100, true);
});

test("calculateLinkDecay marks items > 30 days old as Expired", () => {
  const expiredDate = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000);
  const decay = calculateLinkDecay(expiredDate);
  assert.equal(decay.status, "Expired");
  assert.equal(decay.decayPercentage, 100);
  assert.equal(decay.color, "red");
});
