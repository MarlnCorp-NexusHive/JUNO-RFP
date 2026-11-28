import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { writeJsonAtomic, writeJsonAtomicAsync, readJsonSafe } from "../utils/atomicFile.js";
import { splitTableRow, storeStructuredData, getStructuredDataForWorkspace } from "../tableExtractionService.js";
import {
  putTenantFeature,
  getTenantFeature,
  deleteTenantFeature,
  flushFeaturesDbSync,
  invalidateFeaturesDbCache,
} from "../trial/featureStore.js";

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "juno-persist-test-"));
process.env.TRIAL_DATA_PATH = path.join(tmpRoot, "trial-tenants.json");

test.after(() => {
  try {
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

test("writeJsonAtomic writes valid JSON with zero leftover .tmp files", () => {
  const file = path.join(tmpRoot, "atomic-sync.json");
  const bytes = writeJsonAtomic(file, { ok: true, count: 42 }, { pretty: true, backup: true });
  assert.ok(bytes > 0);
  const { exists, data } = readJsonSafe(file, "test");
  assert.equal(exists, true);
  assert.deepEqual(data, { ok: true, count: 42 });
  const leftoverTmp = fs.readdirSync(tmpRoot).filter((n) => n.endsWith(".tmp"));
  assert.equal(leftoverTmp.length, 0);
});

test("writeJsonAtomicAsync writes valid JSON asynchronously without corruption", async () => {
  const file = path.join(tmpRoot, "atomic-async.json");
  await writeJsonAtomicAsync(file, { step: 1 }, { backup: true });
  await writeJsonAtomicAsync(file, { step: 2, items: [1, 2, 3] }, { backup: true });
  const { data } = readJsonSafe(file, "test");
  assert.deepEqual(data, { step: 2, items: [1, 2, 3] });
  assert.equal(fs.existsSync(`${file}.bak`), true);
});

test("readJsonSafe preserves corrupt file and automatically recovers from .bak", () => {
  const file = path.join(tmpRoot, "recover.json");
  writeJsonAtomic(file, { version: "good-v1" }, { backup: true });
  writeJsonAtomic(file, { version: "good-v2" }, { backup: true });
  // Simulate truncated/corrupt primary file
  fs.writeFileSync(file, '{"version": "broken', "utf8");

  const res = readJsonSafe(file, "test");
  assert.equal(res.recoveredFromBackup, true);
  assert.deepEqual(res.data, { version: "good-v1" });

  const corruptCopies = fs.readdirSync(tmpRoot).filter((n) => n.startsWith("recover.json.corrupt."));
  assert.ok(corruptCopies.length >= 1, "Corrupt primary file should be preserved");
});

test("featureStore isolates tenants and persists across cache invalidation", () => {
  invalidateFeaturesDbCache();
  putTenantFeature("t_alpha", "scoring", { records: [{ id: "a1", score: 92 }] });
  putTenantFeature("t_beta", "scoring", { records: [{ id: "b1", score: 77 }] });
  flushFeaturesDbSync();

  invalidateFeaturesDbCache();
  const alpha = getTenantFeature("t_alpha", "scoring");
  const beta = getTenantFeature("t_beta", "scoring");
  assert.deepEqual(alpha.data.records, [{ id: "a1", score: 92 }]);
  assert.deepEqual(beta.data.records, [{ id: "b1", score: 77 }]);

  const cleared = deleteTenantFeature("t_alpha", "scoring");
  assert.deepEqual(cleared.data, { records: [] });
});

test("tableExtractionService parses rows and persists extracted tables", () => {
  assert.deepEqual(splitTableRow("| Col A | Col B | Col C |"), ["Col A", "Col B", "Col C"]);
  assert.deepEqual(splitTableRow("Alpha\tBeta\tGamma"), ["Alpha", "Beta", "Gamma"]);

  storeStructuredData("ws_test_1", "doc_1", {
    tables: [{ id: "t1", headers: ["Item", "Cost"], rows: [["Cloud", "$10k"]] }],
    figures: [{ id: "f1", caption: "Figure 1", description: "Architecture" }],
  });
  const loaded = getStructuredDataForWorkspace("ws_test_1");
  assert.equal(loaded.workspaceId, "ws_test_1");
  assert.equal(loaded.documents.length, 1);
  assert.equal(loaded.documents[0].tables[0].headers[0], "Item");
});
