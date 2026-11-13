// POST /api/stripe-webhook: Stripe calls this after payments. The signature is verified before anything is trusted.
// Env var: STRIPE_WEBHOOK_SECRET (whsec_..., from Stripe Dashboard > Developers > Webhooks).
import { createHmac, timingSafeEqual } from "node:crypto";
const TOLERANCE = 300; // seconds
function verify(payload, header, secret) {
  if (!header || !secret) return false;
  const t = Number((header.split(",").find((x) => x.startsWith("t=")) || "").slice(2));
  const sigs = header.split(",").filter((x) => x.startsWith("v1=")).map((x) => x.slice(3));
  if (!t || !sigs.length || Math.abs(Date.now() / 1000 - t) > TOLERANCE) return false;
  const expected = createHmac("sha256", secret).update(`${t}.${payload}`, "utf8").digest("hex");
  const e = Buffer.from(expected, "hex");
  return sigs.some((s) => { const b = Buffer.from(s, "hex"); return b.length === e.length && timingSafeEqual(b, e); });
}
export default async (req) => {
  if (req.method !== "POST") return new Response("method not allowed", { status: 405 });
  const payload = await req.text();
  if (!verify(payload, req.headers.get("stripe-signature"), process.env.STRIPE_WEBHOOK_SECRET)) return new Response("invalid signature", { status: 400 });
  const evt = JSON.parse(payload);
  const o = evt.data && evt.data.object;
  switch (evt.type) {
    case "checkout.session.completed":
      console.log("New subscription", { session: o.id, customer: o.customer, email: o.customer_details && o.customer_details.email, plan: o.metadata && o.metadata.plan, period: o.metadata && o.metadata.period });
      break; // next step: create the customer's workspace or alert your team here
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
