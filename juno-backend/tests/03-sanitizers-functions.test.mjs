import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { sanitizeRichHtml } from "../../src/utils/sanitizeHtml.js";
import { normalizeBriefKey } from "../grantBriefService.js";
import stripeWebhook from "../../website/netlify/functions/stripe-webhook.mjs";
import checkoutFn from "../../website/netlify/functions/checkout.mjs";

test("client sanitizeRichHtml strips XSS vectors while keeping safe formatting", () => {
  const dirty =
    '<h2 onclick="evil()">Scope</h2><p onmouseover=alert(1) style="background:url(javascript:alert(2))">Hello <strong>World</strong> <em>Team</em></p><script>fetch("https://evil.com")</script><iframe src="https://evil.com"></iframe><svg onload=alert(3)></svg>';
  const clean = sanitizeRichHtml(dirty);
  assert.equal(clean.includes("script"), false);
  assert.equal(clean.includes("iframe"), false);
  assert.equal(clean.includes("svg"), false);
  assert.equal(clean.includes("onmouseover"), false);
  assert.equal(clean.includes("onclick"), false);
  assert.equal(clean.includes("javascript:"), false);
  assert.equal(clean.includes("style="), false);
  assert.equal(clean.includes("<h2>Scope</h2>"), true);
  assert.equal(clean.includes("<p>Hello <strong>World</strong> <em>Team</em></p>"), true);
});

test("grantBriefService normalizeBriefKey sanitizes path traversal attempts", () => {
  const k = normalizeBriefKey("../../etc", "../passwd?foo=1");
  assert.equal(k.includes("/"), false);
  assert.equal(k.includes("\\"), false);
  assert.throws(() => normalizeBriefKey("grants", ""), /opportunityId is required/i);
});

test("stripe-webhook rejects invalid signatures, non-POST, and malformed JSON", async () => {
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test_secret_123";

  const rMethod = await stripeWebhook(new Request("https://junorfp.com/api/stripe-webhook", { method: "GET" }));
  assert.equal(rMethod.status, 405);

  const rBadSig = await stripeWebhook(
    new Request("https://junorfp.com/api/stripe-webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=123,v1=deadbeef" },
      body: "{}",
    }),
  );
  assert.equal(rBadSig.status, 400);

  // Valid signature but malformed JSON -> must return 400, not 500
  const ts = Math.floor(Date.now() / 1000);
  const badJson = "{not valid json";
  const sigBadJson = crypto
    .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${ts}.${badJson}`, "utf8")
    .digest("hex");
  const rMalformed = await stripeWebhook(
    new Request("https://junorfp.com/api/stripe-webhook", {
      method: "POST",
      headers: { "stripe-signature": `t=${ts}, v1=${sigBadJson}` },
      body: badJson,
    }),
  );
  assert.equal(rMalformed.status, 400);

  // Valid signed event -> 200
  const goodBody = JSON.stringify({
    id: "evt_test_1",
    type: "customer.subscription.updated",
    data: { object: { id: "sub_1", customer: "cus_1", status: "active" } },
  });
  const sigGood = crypto
    .createHmac("sha256", process.env.STRIPE_WEBHOOK_SECRET)
    .update(`${ts}.${goodBody}`, "utf8")
    .digest("hex");
  const rGood = await stripeWebhook(
    new Request("https://junorfp.com/api/stripe-webhook", {
      method: "POST",
      headers: { "stripe-signature": `t=${ts}, v1=${sigGood}` },
      body: goodBody,
    }),
  );
  assert.equal(rGood.status, 200);
});

test("checkout function enforces method, origin allowlist, and valid plan", async () => {
  process.env.STRIPE_SECRET_KEY = "sk_test_dummy";
  process.env.URL = "https://junorfp.com";

  const rGet = await checkoutFn(new Request("https://junorfp.com/api/checkout", { method: "GET" }));
  assert.equal(rGet.status, 405);

  const rOrigin = await checkoutFn(
    new Request("https://junorfp.com/api/checkout", {
      method: "POST",
      headers: { origin: "https://evil.example.com", "content-type": "application/json" },
      body: JSON.stringify({ plan: "team", period: "monthly" }),
    }),
  );
  assert.equal(rOrigin.status, 403);

  const rPlan = await checkoutFn(
    new Request("https://junorfp.com/api/checkout", {
      method: "POST",
      headers: { origin: "https://junorfp.com", "content-type": "application/json" },
      body: JSON.stringify({ plan: "nonexistent", period: "monthly" }),
    }),
  );
  assert.equal(rPlan.status, 400);
});
