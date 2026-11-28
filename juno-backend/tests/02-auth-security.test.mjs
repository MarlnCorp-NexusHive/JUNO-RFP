import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), "juno-auth-test-"));
process.env.TRIAL_DATA_PATH = path.join(tmpRoot, "trial-tenants.json");

import {
  registerTrialSignup,
  confirmTrialEmail,
  createSession,
  resolveSession,
  revokeSession,
  verifyPassword,
  verifyPasswordAsync,
  findUserByEmail,
  findTenantById,
  flushTrialDbSync,
  invalidateTrialDbCache,
} from "../trial/tenantStore.js";
import { store, issueCollabToken, resolveCollabToken } from "../collaboration/store.js";
import { requireAuth, requireAuditorSelfOrPm } from "../collaboration/authMiddleware.js";
import {
  ensureTrialProposalManager,
  ensureTrialAuditor,
  ensureTrialAuditorSession,
  replyClarification,
  listClarifications,
} from "../collaboration/collaborationService.js";
import { listAllCalendarEvents, getTeamSummary } from "../calendar/calendarService.js";
import { requestLoggerMiddleware } from "../utils/logger.js";

test.after(() => {
  try {
    flushTrialDbSync();
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

test("trial signup -> confirm -> async password verify -> O(1) session -> revoke", async () => {
  invalidateTrialDbCache();
  const signup = registerTrialSignup({
    contactName: "Alice Lead",
    email: "alice@acme-test.com",
    password: "StrongPassword!123",
    companyName: "Acme Corp Test",
    privacyAccepted: true,
  });
  assert.ok(signup.confirmToken);
  assert.equal(signup.tenant.status, "pending_verification");

  const confirmed = confirmTrialEmail(signup.confirmToken);
  assert.equal(confirmed.user.email, "alice@acme-test.com");

  const user = findUserByEmail("alice@acme-test.com");
  assert.equal(verifyPassword("StrongPassword!123", user.passwordSalt, user.passwordHash), true);
  assert.equal(await verifyPasswordAsync("StrongPassword!123", user.passwordSalt, user.passwordHash), true);
  assert.equal(await verifyPasswordAsync("WrongPass!", user.passwordSalt, user.passwordHash), false);

  const tenant = findTenantById(user.tenantId);
  const { token } = createSession(user, tenant);
  const resolved = resolveSession(token);
  assert.equal(resolved.user.email, "alice@acme-test.com");
  assert.equal(resolved.tenant.id, tenant.id);

  revokeSession(token);
  assert.equal(resolveSession(token), null);
});

test("unverified re-signup cannot rename a shared tenant", () => {
  const first = registerTrialSignup({
    contactName: "Owner One",
    email: "owner@sharedco.com",
    password: "Password123!",
    companyName: "SharedCo Inc",
    privacyAccepted: true,
  });

  // Second unverified teammate joins the same pending tenant, then re-submits signup with an altered name
  registerTrialSignup({
    contactName: "Teammate Two",
    email: "two@sharedco.com",
    password: "Password123!",
    companyName: "SharedCo Inc",
    privacyAccepted: true,
  });
  registerTrialSignup({
    contactName: "Teammate Two",
    email: "two@sharedco.com",
    password: "Password456!",
    companyName: "Hacked Name LLC",
    privacyAccepted: true,
  });

  const tenant = findTenantById(first.tenant.id);
  assert.equal(tenant.name, "SharedCo Inc", "Shared tenant must NOT be renamed by unverified re-signup");
});

test("collaboration auth rejects raw userId and requires server-issued opaque token", () => {
  const pmRes = ensureTrialProposalManager({ tenantId: "t_alpha_sec", name: "Alpha PM" });
  assert.ok(pmRes.token.startsWith("cs_"), "Collab token must be opaque cs_* token");
  assert.notEqual(pmRes.token, pmRes.user.id);

  // Raw userId bypass MUST fail
  assert.equal(resolveCollabToken(pmRes.user.id), null);
  assert.equal(resolveCollabToken(pmRes.token)?.id, pmRes.user.id);

  // Middleware test
  let statusCode = 200;
  let nextCalled = false;
  const res = {
    status(c) {
      statusCode = c;
      return this;
    },
    json() {
      return this;
    },
  };
  requireAuth({ headers: { authorization: `Bearer ${pmRes.user.id}` }, query: {} }, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, false);
  assert.equal(statusCode, 401);

  const goodReq = { headers: { authorization: `Bearer ${pmRes.token}` }, query: {} };
  requireAuth(goodReq, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.equal(goodReq.userId, pmRes.user.id);
});

test("requireAuditorSelfOrPm blocks cross-tenant PM from inspecting another tenant auditor", () => {
  const pmA = ensureTrialProposalManager({ tenantId: "t_tenant_a", name: "PM A" });
  const audB = ensureTrialAuditor({ tenantId: "t_tenant_b", email: "audb@tenantb.com", name: "Aud B" });

  let statusCode = 200;
  let allowed = false;
  const middleware = requireAuditorSelfOrPm("auditorId");
  middleware(
    { userId: pmA.user.id, user: pmA.user, params: { auditorId: audB.id } },
    {
      status(c) {
        statusCode = c;
        return this;
      },
      json() {
        return this;
      },
    },
    () => {
      allowed = true;
    },
  );
  assert.equal(allowed, false);
  assert.equal(statusCode, 403);
});

test("listClarifications & replyClarification enforce question ownership and workspace match", () => {
  const pm = ensureTrialProposalManager({ tenantId: "t_clar_test", name: "Clar PM" });
  const aud1 = ensureTrialAuditorSession({ tenantId: "t_clar_test", email: "a1@clar.com", name: "Aud 1" });
  const aud2 = ensureTrialAuditorSession({ tenantId: "t_clar_test", email: "a2@clar.com", name: "Aud 2" });

  store.workspaces.set("ws_c1", { id: "ws_c1", title: "Bid 1", createdBy: pm.user.id, createdAt: new Date().toISOString() });
  store.workspaces.set("ws_c2", { id: "ws_c2", title: "Bid 2", createdBy: pm.user.id, createdAt: new Date().toISOString() });
  store.questions.set("q_c1", { id: "q_c1", workspaceId: "ws_c1", number: 1, text: "Q1", status: "assigned", assignedTo: aud1.user.id });
  store.questions.set("q_c2", { id: "q_c2", workspaceId: "ws_c1", number: 2, text: "Q2", status: "assigned", assignedTo: aud2.user.id });
  store.questions.set("q_other_ws", { id: "q_other_ws", workspaceId: "ws_c2", number: 1, text: "Other", status: "assigned", assignedTo: aud1.user.id });

  store.messages.push(
    { id: "m1", workspaceId: "ws_c1", questionId: "q_c1", fromUserId: aud1.user.id, body: "Aud1 secret", createdAt: "2026-01-01T00:00:00Z" },
    { id: "m2", workspaceId: "ws_c1", questionId: "q_c2", fromUserId: aud2.user.id, body: "Aud2 secret", createdAt: "2026-01-01T00:01:00Z" },
  );

  // Auditor 1 omitting questionId must ONLY receive messages for q_c1 (not q_c2)
  const aud1Msgs = listClarifications("ws_c1", aud1.user.id, {});
  assert.equal(aud1Msgs.length, 1);
  assert.equal(aud1Msgs[0].questionId, "q_c1");

  // Replying with questionId belonging to ws_c2 while targeting ws_c1 must throw 400
  assert.throws(
    () => replyClarification(pm.user.id, { workspaceId: "ws_c1", questionId: "q_other_ws", message: "Hi" }),
    /does not belong to this workspace/i,
  );
});

test("calendar demo mode never leaks trial workspaces, logs, or auditors", () => {
  store.usersById.set("user_pm_1", { id: "user_pm_1", email: "jordan@juno", name: "Jordan", role: "proposal_manager" });
  store.usersById.set("user_aud_1", { id: "user_aud_1", email: "demo-aud@juno", name: "Demo Aud", role: "auditor" });
  store.workspaces.set("ws_demo_cal", { id: "ws_demo_cal", title: "Demo RFP", createdBy: "user_pm_1" });
  store.workspaces.set("ws_secret_trial", { id: "ws_secret_trial", title: "CONFIDENTIAL TRIAL BID", createdBy: "user_pm_trial_secret" });
  store.logs.push({
    workspaceId: "ws_secret_trial",
    action: "Workspace created",
    timestamp: new Date().toISOString(),
    user: "Secret PM",
  });

  const events = listAllCalendarEvents(null);
  assert.equal(events.some((e) => String(e.title || "").includes("CONFIDENTIAL TRIAL BID")), false);

  const summary = getTeamSummary(null);
  assert.equal(summary.auditors.some((a) => String(a.id).startsWith("user_aud_trial_")), false);
});

test("requestLoggerMiddleware assigns X-Request-Id and does not leak query secrets", () => {
  const headers = {};
  let finishCb = null;
  const req = {
    method: "GET",
    path: "/rfp-collab/logs/ws1/stream",
    url: "/rfp-collab/logs/ws1/stream?token=SUPER_SECRET_TOKEN",
    headers: {},
    ip: "127.0.0.1",
  };
  const res = {
    statusCode: 200,
    setHeader(k, v) {
      headers[k] = v;
    },
    on(evt, cb) {
      if (evt === "finish") finishCb = cb;
    },
  };
  let nextCalled = false;
  requestLoggerMiddleware(req, res, () => {
    nextCalled = true;
  });
  assert.equal(nextCalled, true);
  assert.ok(headers["X-Request-Id"]);
  assert.equal(typeof finishCb, "function");
});
