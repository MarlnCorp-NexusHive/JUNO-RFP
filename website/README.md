# JunoRFP website, payments and Juno Workspace on Netlify

This folder deploys:
- `/`: the JunoRFP website. It includes the Solutions sections, Pricing with Stripe checkout and the Help Center.
- `/workspace/`: the full JunoRFP and Juno Workspace app.
- `/api/*`: secure server functions for checkout, plan prices, Stripe webhooks and the AI Copilot.

## 1. Deploy
To use payments and AI, deploy from Git or the Netlify command line, not drag-and-drop.
1. Push this folder to a private GitHub repo.
2. In Netlify, choose **Add new site → Import an existing project** and pick the repo. No build command is needed; Netlify publishes the folder as it is.

## 2. Set up Stripe
1. Create an account at https://dashboard.stripe.com/register using MARLN Corporation's legal details.
2. Activate payments: go to **Settings → Business** and enter the EIN, business address, a representative's identity details, and a description of what you sell (a SaaS subscription).
3. Add your bank account: go to **Settings → Business → Bank accounts and currencies → Add a bank account**.
   - It must be a business checking account.
   - The account holder name, routing number and account number must match your bank statement.
   - Only an Owner or Admin can add it.
   - Add one account per payout currency.
4. Create products: under **Product catalog**, create three products, each with two recurring prices in USD. Copy each price ID (it starts with `price_`).

   | Product | Monthly price | Annual price (20% off) |
   |---|---|---|
   | JunoRFP Team | $599 / month | $5,750 / year |
   | JunoRFP Professional | $899 / month | $8,630 / year |
   | JunoRFP Enterprise Pro | $1,400 / month | $13,440 / year |

   Once Stripe is connected, the website shows the prices from Stripe, so whatever you charge is what visitors see.
5. Under **Settings → Payments → Payment methods**, turn on cards, Apple Pay, Google Pay, Link and the local methods your customers use. If Adaptive Pricing is offered for your account, turn it on so customers see prices in their local currency.
6. Under **Settings → Billing → Customer portal**, turn on the portal and copy its login link (it starts with `https://billing.stripe.com/`).
7. Optional: turn on **Stripe Tax** to collect sales tax and VAT automatically.

## 3. Add environment variables in Netlify
Go to **Site configuration → Environment variables**:

| Variable | Value |
|---|---|
| `STRIPE_SECRET_KEY` | A **restricted key**. Create it under **Developers → API keys → Create restricted key**, with Checkout Sessions set to Write and Prices set to Read. |
| `STRIPE_PRICE_TEAM_MONTHLY` | `price_...` |
| `STRIPE_PRICE_TEAM_ANNUAL` | `price_...` |
| `STRIPE_PRICE_PRO_MONTHLY` | `price_...` |
| `STRIPE_PRICE_PRO_ANNUAL` | `price_...` |
| `STRIPE_PRICE_ENT_MONTHLY` | `price_...` |
| `STRIPE_PRICE_ENT_ANNUAL` | `price_...` |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` (from step 4 below) |
| `STRIPE_PORTAL_URL` | Optional: the customer portal link |
| `STRIPE_AUTOMATIC_TAX` | Optional: `true` if Stripe Tax is set up |
| `OPENAI_API_KEY` | Turns on the AI features in the app (see the AI section) |

Start with **test mode** keys (`sk_test_`/`rk_test_`) and test card 4242 4242 4242 4242. Switch to live keys when you're ready.

## 4. Save registrations with Netlify Forms
In Netlify, go to **Forms → Enable form detection**, then redeploy. Every registration is saved as a **registration** submission, including people who don't finish paying. Custom-plan requests are saved separately as **custom-quote** submissions, with the customizations chosen, the systems to connect, the user count and the timeline. That gives you a follow-up list. Under **Forms → Notifications**, add an email alert so you hear about each sign-up.

## 5. Connect the webhook
In Stripe, go to **Developers → Webhooks → Add endpoint**:
- URL: `https://YOUR-SITE/api/stripe-webhook`
- Events: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`, then redeploy. You can see events under **Netlify → Logs → Functions**.

## Security built in
- Card details are entered only on Stripe's hosted checkout page. Stripe is certified PCI DSS Level 1, and JunoRFP never sees card numbers.
- Secret keys live only in Netlify environment variables, never in the website code.
- Checkout only sells the price IDs you configure, and only accepts requests from your own site.
- Webhooks are rejected unless Stripe's signature is valid and less than 5 minutes old.
- HTTPS is enforced with HSTS. A Content Security Policy, frame blocking and other security headers are set in `netlify.toml`.
- In Stripe, turn on two-factor authentication for every user, keep Radar fraud rules on, and give team members the least access they need.

## The sign-up flow
The **Custom** plan has no payment step: **Request a custom plan → Your details → What to tailor → Request sent**. Your team follows up with a scoping call and a quote.

**Pricing → Subscribe → Step 1: Your details → Step 2: Review and billing authorization → Step 3: Stripe checkout → Welcome page**
- The order summary stays on screen. Visitors can switch plan or billing period at any step, and the annual savings update live.
- Their details carry into Stripe checkout and are stored on the Stripe customer and subscription records.
- If they cancel on Stripe, their details are kept in this browser and "Return to checkout" picks up where they left off.
- If Stripe isn't connected yet, the registration is still saved and the visitor is told your team will email a secure payment link.

## AI (OpenAI GPT), token allowances and budgets
The app's AI features (Copilot, drafting, the award and solicitation readers, funder reports) run through the server function `/api/copilot`. It calls the **OpenAI API**, so your key never reaches the browser.

**Environment variables (Netlify → Site configuration → Environment variables):**

| Variable | Purpose |
|---|---|
| `OPENAI_API_KEY` | Required. Your OpenAI API key. |
| `OPENAI_MODEL` | Main model for drafting, Copilot and reports. Default `gpt-6.1-sol`. |
| `OPENAI_FAST_MODEL` | Fast model for quick tasks. Default `gpt-6-luna`. |
| `AI_DEFAULT_BUDGET_USD` | Hard monthly AI spend limit per workspace. Default `250`. |
| `AI_BUDGETS_JSON` | Optional limits per workspace, e.g. `{"w1":400,"w3":120}`. |
| `AI_GLOBAL_BUDGET_USD` | Hard monthly limit across all workspaces. Default `2500`. |
| `AI_PRICES_JSON` | Optional price overrides in USD per 1M tokens, e.g. `{"gpt-6.1-sol":{"in":2,"cin":0.1,"out":10}}`. |
| `ADMIN_TOKEN` | A long random secret for the admin usage endpoint. |

**How the limits work:**
- Before each AI request, the server checks this month's spend for the workspace and for the whole company. If either limit is reached, it refuses the request (HTTP 402) and the app shows "AI features are paused". The built-in tools keep working.
- After each request, the server records the exact token counts and cost. They're stored in Netlify Blobs, which `package.json` installs automatically.
- Admin view of every workspace: `GET /api/ai-usage?all=1` with the header `Authorization: Bearer <ADMIN_TOKEN>`. One workspace: `GET /api/ai-usage?ws=w1`.

**In the app, under Settings:**
- **AI usage & limits:** tokens used against the plan allowance (Team 20M, Professional 40M and Enterprise Pro 60M a month), a month-end projection, daily, feature and person breakdowns, recent requests, alerts to admins at 80% and 100%, and a choice to pause or allow overage when the allowance runs out. You can buy 10M-token top-ups for $99.
- **AI provider:** model names and editable token prices.
- **Plan & billing:** switch plans and buy top-ups.
- **Workspace budgets (admin):** hard spend limits per workspace and company-wide.

**Production note:** the workspace is currently taken from a request header. Once real sign-in is added, take it from the signed-in user's session so a user can't charge AI use to another workspace. The company-wide limit protects you in the meantime.

## Privacy, cookies and consent
- **Cookie banner:** shown on the first visit, with equally prominent **Accept all** and **Reject all** buttons. The choice is stored for 12 months, and the footer's "Cookie settings" link reopens the banner. A Global Privacy Control signal from the browser counts as "Reject all".
- **Adding analytics later:** load it only after consent, for example:
  `document.addEventListener('juno-consent', e => { if (e.detail.analytics) loadAnalytics(); }); if (window.junoConsent?.analytics) loadAnalytics();`
- **Pages:** the Privacy Statement (`#privacy`) and Cookie Policy (`#cookies`) cover GDPR and UK GDPR, CCPA/CPRA and other US state laws, PIPEDA and Quebec Law 25, Saudi Arabia's PDPL and the UAE's data protection law. Both state that MARLN does not sell or share personal information.
- **Fonts:** self-hosted in `assets/fonts`, so no visitor IP addresses go to Google before consent.
- **In the app:** Settings → Privacy & data has the no-sale statement, links to both policies, a download of the workspace's data, and a way to request access, correction or deletion. The sidebar footer also links to the policies.
- **Before launch:** have a lawyer review both policies. Add MARLN's registered address. If you serve EU or UK customers without an office there, appoint an EU or UK representative (GDPR Article 27).

© 2026 MARLN Corporation. All rights reserved.
