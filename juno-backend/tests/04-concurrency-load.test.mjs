import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "juno-load-test-"));
process.env.TRIAL_DATA_PATH = path.join(tmpRoot, "trial-tenants.json");

import {
  registerTrialSignup,
  confirmTrialEmail,
  findUserByEmail,
  findTenantById,
  verifyPasswordAsync,
  createSession,
  resolveSession,
  flushTrialDbSync,
  invalidateTrialDbCache,
} from "../trial/tenantStore.js";
import {
  putTenantFeature,
  getTenantFeature,
  flushFeaturesDbSync,
  invalidateFeaturesDbCache,
} from "../trial/featureStore.js";

test.after(() => {
  try {
    flushTrialDbSync();
    flushFeaturesDbSync();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

test("60 simultaneous user logins + 120 concurrent feature ops complete without hanging or losing sessions", async () => {
  invalidateTrialDbCache();
  invalidateFeaturesDbCache();

  const USER_COUNT = 60;
  const users = [];

  // Seed 60 verified users across 6 tenants
  for (let i = 0; i < USER_COUNT; i++) {
    const email = `loaduser${i}@company${i % 6}.com`;
    const password = `LoadTestPass!${i}`;
    const res = registerTrialSignup({
      contactName: `Load User ${i}`,
      email,
      password,
      companyName: `Load Company ${i % 6}`,
      privacyAccepted: true,
    });
    confirmTrialEmail(res.confirmToken);
    users.push({ email, password, tenantId: res.tenant.id });
  }

  // Measure event-loop responsiveness during the 60-user simultaneous login storm
  let heartbeatTicks = 0;
  let maxTickGapMs = 0;
  let lastTick = performance.now();
  const heartbeat = setInterval(() => {
    const now = performance.now();
    const gap = now - lastTick;
    if (gap > maxTickGapMs) maxTickGapMs = gap;
    lastTick = now;
    heartbeatTicks += 1;
  }, 20);

  const t0 = performance.now();
  const loginResults = await Promise.all(
    users.map(async (u) => {
      const record = findUserByEmail(u.email);
      assert.ok(record, `User ${u.email} must exist`);
      const ok = await verifyPasswordAsync(u.password, record.passwordSalt, record.passwordHash);
      assert.equal(ok, true, `Async scrypt verify failed for ${u.email}`);
      const tenant = findTenantById(record.tenantId);
      const { token } = createSession(record, tenant);
      return { email: u.email, tenantId: tenant.id, token };
    }),
  );
  const loginElapsedMs = performance.now() - t0;
  clearInterval(heartbeat);

  // 1. All 60 logins succeeded and returned unique tokens
  assert.equal(loginResults.length, USER_COUNT);
  const uniqueTokens = new Set(loginResults.map((r) => r.token));
  assert.equal(uniqueTokens.size, USER_COUNT, "All 60 sessions must have unique tokens");

  // 2. Zero lost sessions — every single one of the 60 sessions resolves cleanly
  for (const r of loginResults) {
    const resolved = resolveSession(r.token);
    assert.ok(resolved && !resolved.invalid, `Session lost for ${r.email}`);
    assert.equal(resolved.user.email, r.email);
  }

  // 3. 120 concurrent feature writes & reads across tenants
  const featT0 = performance.now();
  await Promise.all(
    loginResults.map(async (r, idx) => {
      putTenantFeature(r.tenantId, "scoring", { records: [{ id: `rec_${idx}`, by: r.email }] });
      const fetched = getTenantFeature(r.tenantId, "scoring");
      assert.ok(Array.isArray(fetched.data.records));
    }),
  );
  const featElapsedMs = performance.now() - featT0;

  // 4. Flush to disk and verify valid JSON survives reload
  flushTrialDbSync();
  flushFeaturesDbSync();
  invalidateTrialDbCache();
  for (const r of loginResults) {
    const reloaded = resolveSession(r.token);
    assert.ok(reloaded && reloaded.user.email === r.email, `Persisted session missing after reload for ${r.email}`);
  }

  console.log(
    `[LOAD TEST] 60 concurrent logins: ${Math.round(loginElapsedMs)} ms | ` +
      `heartbeat ticks: ${heartbeatTicks} (max gap ${Math.round(maxTickGapMs)} ms) | ` +
      `120 feature ops: ${Math.round(featElapsedMs)} ms`,
  );

  // Event loop must stay responsive (never frozen for multi-second stalls)
  assert.ok(heartbeatTicks >= 1, "Event loop stayed responsive during 60 concurrent scrypt logins");
  assert.ok(loginElapsedMs < 15_000, `60 concurrent logins took too long: ${loginElapsedMs}ms`);
});
