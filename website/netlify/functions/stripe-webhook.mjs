// POST /api/stripe-webhook: Stripe calls this after payments. The signature is verified before anything is trusted.
// Env var: STRIPE_WEBHOOK_SECRET (whsec_..., from Stripe Dashboard > Developers > Webhooks).
import { createHmac, timingSafeEqual } from "node:crypto";

const TOLERANCE = 300; // seconds
const HEX_RE = /^[0-9a-f]+$/i;

function verify(payload, header, secret) {
  if (!header || !secret) return false;
  const parts = header.split(",").map((x) => x.trim());
  const t = Number((parts.find((x) => x.startsWith("t=")) || "").slice(2));
  const sigs = parts.filter((x) => x.startsWith("v1=")).map((x) => x.slice(3).trim());
  if (!Number.isFinite(t) || !t || !sigs.length || Math.abs(Date.now() / 1000 - t) > TOLERANCE) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`, "utf8").digest("hex");
  const e = Buffer.from(expected, "hex");
  return sigs.some((s) => {
    if (!HEX_RE.test(s) || s.length % 2 !== 0) return false;
    const b = Buffer.from(s, "hex");
    return b.length === e.length && timingSafeEqual(b, e);
  });
}

async function markProcessedIfNew(eventId) {
  if (!eventId) return true;
  try {
    const { getStore } = await import("@netlify/blobs");
    const st = getStore({ name: "stripe-events", consistency: "strong" });
    const existing = await st.get(eventId);
    if (existing) return false;
    await st.set(eventId, new Date().toISOString());
    return true;
  } catch {
    // If Blobs is unavailable in local dev/test, proceed without blocking webhook ack.
    return true;
  }
}

export default async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const payload = await req.text();
  if (!verify(payload, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET)) {
    return new Response("invalid signature", { status: 400 });
  }
  let evt;
  try {
    evt = JSON.parse(payload);
  } catch {
    return new Response("invalid json", { status: 400 });
  }
  const o = evt?.data?.object;
  if (!evt?.type || !o || typeof o !== "object") {
    return new Response("invalid event payload", { status: 400 });
  }

  const isNew = await markProcessedIfNew(evt.id);
  if (!isNew) {
    return new Response(JSON.stringify({ received: true, duplicate: true }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  switch (evt.type) {
    case "checkout.session.completed":
      console.log("New subscription", {
        session: o.id,
        customer: o.customer,
        email: o.customer_details?.email,
        plan: o.metadata?.plan,
        period: o.metadata?.period,
      });
      break;
    case "customer.subscription.updated":
      console.log("Subscription updated", {
        subscription: o.id,
        customer: o.customer,
        status: o.status,
        cancel_at_period_end: o.cancel_at_period_end,
      });
      break;
    case "invoice.paid":
      console.log("Invoice paid", { invoice: o.id, customer: o.customer, amount: o.amount_paid, currency: o.currency });
      break;
    case "invoice.payment_failed":
      console.log("Payment failed", { invoice: o.id, customer: o.customer });
      break;
    case "customer.subscription.deleted":
      console.log("Subscription canceled", { subscription: o.id, customer: o.customer });
      break;
  }
  return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "content-type": "application/json" } });
};
export const config = { path: "/api/stripe-webhook" };
