// POST /api/checkout {plan, period}: creates a Stripe-hosted Checkout Session and returns its URL.
// Card details are entered on Stripe's page, never on this site. Only allow-listed price IDs can be sold.
// Env vars: STRIPE_SECRET_KEY, the STRIPE_PRICE_* IDs (see plans.mjs), optional STRIPE_AUTOMATIC_TAX=true.
const json = (b, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });
export default async (req) => {
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return json({ error: "not_configured" }, 503);
  const site = process.env.URL; // set by Netlify to your primary site URL; never trust the Host header
  const origin = req.headers.get("origin");
  const allowed = [site, process.env.DEPLOY_PRIME_URL, process.env.DEPLOY_URL].filter(Boolean);
  if (allowed.length && origin && !allowed.includes(origin)) return json({ error: "origin_not_allowed" }, 403);
  let b; try { b = await req.json(); } catch { return json({ error: "bad_json" }, 400); }
  const map = {
    team: { monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY, annual: process.env.STRIPE_PRICE_TEAM_ANNUAL },
    pro: { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY, annual: process.env.STRIPE_PRICE_PRO_ANNUAL },
  ent: { monthly: process.env.STRIPE_PRICE_ENT_MONTHLY, annual: process.env.STRIPE_PRICE_ENT_ANNUAL },
  };
  const price = map[b && b.plan] && map[b.plan][b && b.period];
  if (!price || !/^price_[A-Za-z0-9]+$/.test(price)) return json({ error: "unknown_plan" }, 400);
  const c = (b && b.customer) || {};
  const clean = (v, n = 100) => String(v || "").replace(/[\u0000-\u001f]/g, "").trim().slice(0, n);
  const email = clean(c.email, 200);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: "bad_email" }, 400);
  const base = site || origin;
  const f = new URLSearchParams({
    mode: "subscription",
    "line_items[0][price]": price,
    "line_items[0][quantity]": "1",
    success_url: `${base}/#checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/#checkout-cancel`,
    allow_promotion_codes: "true",
    billing_address_collection: "auto",
    "tax_id_collection[enabled]": "true",
    "metadata[plan]": b.plan,
    "metadata[period]": b.period,
  });
  if (email) f.set("customer_email", email);
  const meta = { name: clean(`${clean(c.first, 50)} ${clean(c.last, 50)}`), organization: clean(c.org), title: clean(c.title), country: clean(c.country, 60), org_type: clean(c.orgtype, 60), team_size: clean(c.size, 20) };
  for (const [k, v] of Object.entries(meta)) if (v) { f.set(`metadata[${k}]`, v); f.set(`subscription_data[metadata][${k}]`, v); }
  f.set("subscription_data[metadata][plan]", b.plan);
  if (meta.organization) f.set("custom_text[submit][message]", `Subscription for ${meta.organization}. You can cancel anytime from the billing portal.`);
  if (process.env.STRIPE_AUTOMATIC_TAX === "true") f.set("automatic_tax[enabled]", "true");
  const r = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/x-www-form-urlencoded", "idempotency-key": crypto.randomUUID() },
    body: f,
  });
  const s = await r.json();
  if (!r.ok) { console.error("stripe checkout error", s.error && s.error.type, s.error && s.error.code); return json({ error: "stripe_error" }, 502); }
  return json({ url: s.url });
};
export const config = { path: "/api/checkout" };
