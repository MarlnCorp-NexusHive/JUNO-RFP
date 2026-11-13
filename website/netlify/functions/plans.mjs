// GET /api/plans: returns live prices from Stripe so the website never hard-codes them.
// Env vars: STRIPE_SECRET_KEY (use a restricted key with read access to Prices),
// STRIPE_PRICE_TEAM_MONTHLY, STRIPE_PRICE_TEAM_ANNUAL, STRIPE_PRICE_PRO_MONTHLY, STRIPE_PRICE_PRO_ANNUAL, STRIPE_PRICE_ENT_MONTHLY, STRIPE_PRICE_ENT_ANNUAL,
// optional STRIPE_PORTAL_URL (your Stripe customer portal login link) and STRIPE_PER_SEAT=true.
const json = (b, s = 200, extra = {}) => new Response(JSON.stringify(b), { status: s, headers: { "content-type": "application/json", ...extra } });
const IDS = () => ({
  team: { monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY, annual: process.env.STRIPE_PRICE_TEAM_ANNUAL },
  pro: { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY, annual: process.env.STRIPE_PRICE_PRO_ANNUAL },
  ent: { monthly: process.env.STRIPE_PRICE_ENT_MONTHLY, annual: process.env.STRIPE_PRICE_ENT_ANNUAL },
});
export default async (req) => {
  if (req.method !== "GET") return json({ error: "method_not_allowed" }, 405);
  const key = process.env.STRIPE_SECRET_KEY;
  const portal = /^https:\/\/billing\.stripe\.com\//.test(process.env.STRIPE_PORTAL_URL || "") ? process.env.STRIPE_PORTAL_URL : null;
  if (!key) return json({ configured: false, plans: {}, portal }, 200, { "cache-control": "no-store" });
  const plans = {};
  for (const [plan, periods] of Object.entries(IDS())) {
    for (const [period, id] of Object.entries(periods)) {
      if (!id || !/^price_[A-Za-z0-9]+$/.test(id)) continue;
      const r = await fetch(`https://api.stripe.com/v1/prices/${id}`, { headers: { authorization: `Bearer ${key}` } });
      if (!r.ok) continue;
      const p = await r.json();
      if (!p.active || !p.recurring) continue;
      (plans[plan] ||= {})[period] = { amount: p.unit_amount, currency: p.currency, interval: p.recurring.interval, interval_count: p.recurring.interval_count, per_seat: process.env.STRIPE_PER_SEAT === "true" };
    }
  }
  return json({ configured: Object.keys(plans).length > 0, plans, portal }, 200, { "cache-control": "public, max-age=300" });
};
export const config = { path: "/api/plans" };
