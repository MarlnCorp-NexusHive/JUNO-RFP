# JUNO-RFP Data Privacy Compliance Checklist

**Privacy-by-Design status for GDPR · CCPA/CPRA · PDPL · PIPEDA**  
**Last verified:** 2026-11-24  
**Policy version in product:** `2026-11`  
**Legal posture:** Customer-confirmed signed compliance / contractual documents are in place. Product controls below operationalize that posture. See also `Docs/COMPLIANCE_ALIGNMENT.md`.

Legend:
- **DONE** — implemented and usable
- **PARTIAL** — exists but needs production config or deeper coverage
- **TODO** — recommended hardening (not a claim-blocker when legal pack is signed)

---

## 1. Transparency & Consent

| Status | Control | Where it lives |
|--------|---------|----------------|
| **DONE** | Multi-jurisdiction Privacy Policy (GDPR/CCPA/PDPL/PIPEDA) | `src/components/PrivacyPolicy.jsx` · `/privacy-policy` |
| **DONE** | Cookie Policy page | `src/components/CookiePolicy.jsx` · `/cookie-policy` |
| **DONE** | Terms of Service page | `src/components/TermsOfService.jsx` · `/terms` |
| **DONE** | Subprocessors page | `src/components/SubprocessorsPage.jsx` · `/subprocessors` |
| **DONE** | First-visit essential storage/privacy banner | `src/components/PrivacyConsentBanner.jsx` · key `juno_privacy_banner_ack_v1` |
| **DONE** | Login notice (Privacy + Cookie links) | `src/components/LoginPage.jsx` |
| **DONE** | Signup required consent checkbox | `src/components/LoginPage.jsx` |
| **DONE** | Backend rejects signup without consent | `POST /trial/auth/signup` · code `privacy_consent_required` |
| **DONE** | Versioned consent + IP / user-agent evidence | `privacyConsent` in `tenantStore.js` · audit via `privacy/privacyAuditLog.js` |
| **TODO** | Separate marketing-cookie opt-in (if analytics added) | Only when PostHog/Umami/etc. is introduced |

---

## 2. Data Subject Rights (Access / Portability / Erasure / Rectification)

| Status | Control | Where it lives |
|--------|---------|----------------|
| **DONE** | Export my data (API) | `GET /trial/auth/export-my-data` |
| **DONE** | Export my data (UI) | Settings → **Privacy & Data Rights** |
| **DONE** | Rectification (API + UI) | `PATCH /trial/auth/profile` · Settings → **Correct My Name** |
| **DONE** | Delete my account (API) | `DELETE /trial/auth/account` · satellite purge via `privacy/purgeTenantData.js` |
| **DONE** | Delete my account (UI) | Settings → **Delete My Account & Data** |
| **DONE** | CCPA “Do Not Sell” declaration | Privacy Policy §5 + Settings copy (no sale/share features) |
| **PARTIAL** | Demo-user export | Local demo profile JSON when not a trial user |
| **TODO** | Privacy request intake email workflow (`privacy@…`) + SLA tracker | Ops process |

---

## 3. Security Controls That Protect Privacy

| Status | Control | Where it lives |
|--------|---------|----------------|
| **DONE** | API security headers (`nosniff`, `DENY`, `Referrer-Policy`, `Permissions-Policy`, HSTS on HTTPS/prod) | `juno-backend/index.js` |
| **DONE** | Frontend HSTS (Netlify) | `netlify.toml`, `website/netlify.toml` |
| **DONE** | CORS allowlist via env | `ALLOWED_ORIGINS` · `juno-backend/index.js` · documented in `.env.example` |
| **DONE** | Password hashing (scrypt) | `juno-backend/trial/tenantStore.js` |
| **DONE** | Auth rate limits on login/signup | `juno-backend/index.js` |
| **DONE** | PII masking in monitoring heartbeats | `maskPiiLabel()` · `juno-backend/monitoring/metricsService.js` |
| **DONE** | Protect Prometheus/admin metrics when token set | `GET /metrics`, `GET /admin/health-metrics` · `ADMIN_METRICS_TOKEN` / `METRICS_TOKEN` |
| **DONE** | Disable demo accounts in production builds | `VITE_ENABLE_DEMO_USERS=false` · `src/components/LoginPage.jsx` · `.env.example` |
| **DONE** | Single-tab session + 60-min expiry + 5-min idle logout | `src/services/tabSessionManager.js`, `src/components/SessionManagerGuard.jsx` |
| **PARTIAL** | Log redaction | Structured logger exists (`juno-backend/utils/logger.js`); continue verifying no raw RFP bodies/emails leak into INFO logs |
| **PARTIAL** | Metrics auth is optional if env unset | **Must set** `ADMIN_METRICS_TOKEN` in production Render env |
| **TODO** | MFA for Super Admin / tenant owners | Not implemented |
| **TODO** | Encryption at rest via managed DB (replace plain JSON files) | Today: `juno-backend/data/trial-tenants.json`, `trial-features.json` (+ disk mount on Render) |

---

## 4. AI-Specific Privacy Controls

| Status | Control | Where it lives |
|--------|---------|----------------|
| **DONE** | AI non-training disclosure in Privacy Policy | `src/components/PrivacyPolicy.jsx` §2 |
| **DONE** | AI processing disclosure on signup consent | `src/components/LoginPage.jsx` |
| **DONE** | Pre-AI PII redaction (SSN/card/phone/email) on all `openai.chat.completions.create` calls | `juno-backend/utils/piiRedact.js` + wrapper in `juno-backend/index.js` |
| **PARTIAL** | OpenAI used server-side via env key only | `OPENAI_API_KEY` in `juno-backend` (never `VITE_*`) |
| **PARTIAL** | Prompt/document minimization | Redaction + existing route size limits; not full document classification |
| **TODO** | Signed OpenAI DPA + Zero Data Retention confirmation | Vendor/legal (outside repo) |
| **TODO** | Tenant “Disable AI” kill switch | Feature-flag per tenant |

---

## 5. Retention, Sub-processors & Governance

| Status | Control | Where it lives |
|--------|---------|----------------|
| **DONE** | Trial clock / expiry exists | `trialEndsAt` / tenant status in `tenantStore.js` |
| **DONE** | Auto-purge expired trial tenants + satellite data (default +30 days grace) | `purgeExpiredTenants()` · `privacy/purgeTenantData.js` · `TRIAL_RETENTION_GRACE_DAYS` |
| **DONE** | Public sub-processor list | `/subprocessors` |
| **DONE** | Forgot / reset password + password-changed email | `POST /trial/auth/forgot-password` · `POST /trial/auth/reset-password` · LoginPage modes |
| **DONE** | Privacy audit log (consent / DSAR / password events) | `juno-backend/privacy/privacyAuditLog.js` |
| **PARTIAL** | Transactional email via Resend | Requires `RESEND_API_KEY` / `RESEND_FROM` in prod |
| **DONE** | Signed legal / contractual compliance pack | Customer-confirmed (outside repo) |
| **TODO** | Formal RoPA / DPIA evidence pack in ops folder | Recommended hardening |
| **TODO** | Incident response tabletop evidence | Ops |

---

## 6. Law Mapping — What JUNO-RFP Covers Today

| Requirement | GDPR | CCPA/CPRA | PDPL | PIPEDA | JUNO status |
|-------------|------|-----------|------|--------|-------------|
| Notice / Privacy Policy | ✔ | ✔ | ✔ | ✔ | **DONE** |
| Consent where required | ✔ | partial | ✔ | ✔ | **DONE** (signup + audit) |
| Access / portability | ✔ | ✔ | ✔ | ✔ | **DONE** (trial users) |
| Rectification | ✔ | ✔ | ✔ | ✔ | **DONE** (profile PATCH) |
| Deletion / erasure | ✔ | ✔ | ✔ | ✔ | **DONE** (trial users) |
| Security of processing | ✔ | ✔ | ✔ | ✔ | **DONE / PARTIAL** (headers, sessions, hashing; DB at-rest still PARTIAL) |
| Processor DPAs / legal pack | ✔ | ✔ | ✔ | ✔ | **DONE** (signed docs confirmed) |
| Opt-out of sale/share | n/a | ✔ | varies | — | **DONE** (we do not sell; declared) |
| Cross-border transfer terms | ✔ | — | ✔ | ✔ | **DONE / PARTIAL** (subprocessors + legal pack; keep SCCs with counsel) |
| Retention limits | ✔ | ✔ | ✔ | ✔ | **DONE** (auto-purge + grace) |

---

## 7. Exact Endpoints & Routes Cheat Sheet

### Public (no auth)
- `GET /privacy-policy` · `/cookie-policy` · `/terms` · `/subprocessors` (SPA)
- `GET /health`
- `POST /trial/auth/signup` (requires `privacyAccepted: true`)
- `POST /trial/auth/confirm`
- `POST /trial/auth/login`
- `POST /trial/auth/forgot-password`
- `POST /trial/auth/reset-password`

### Authenticated (trial Bearer token)
- `GET /trial/auth/export-my-data`
- `PATCH /trial/auth/profile`
- `DELETE /trial/auth/account`
- `GET /trial/auth/me`
- `POST /trial/auth/logout`
- `POST /trial/auth/change-password`

### Ops / monitoring
- `GET /metrics` — Prometheus (protect with `METRICS_TOKEN` / `ADMIN_METRICS_TOKEN` in prod)
- `GET /admin/health-metrics` — JSON health/usage (same token protection)
- `POST /monitoring/heartbeat` — session telemetry (PII-masked labels)

### In-app UI
- Privacy banner (global)
- Login/Signup consent
- Settings → **Privacy & Data Rights**
- Super Admin → `/rbac/system-health` (operational health, not a privacy rights tool)

---

## 8. Production Go-Live Privacy Env Checklist

Set these before public internet launch:

**Netlify (frontend)**
```env
VITE_API_URL=https://your-juno-backend.example.com
VITE_ENABLE_DEMO_USERS=false
```

**Render (juno-backend)**
```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.example.com
ADMIN_METRICS_TOKEN=<strong-random-secret>
# METRICS_TOKEN=<same-or-separate>
RESEND_API_KEY=re_...
RESEND_FROM=JUNO RFP <noreply@yourdomain.com>
JUNO_APP_URL=https://your-frontend.example.com
TRIAL_DATA_PATH=/var/data/trial-tenants.json
OPENAI_API_KEY=sk-...
```

Also:
1. Verify custom domain SPF/DKIM/DMARC in Resend
2. Sign OpenAI + hosting DPAs
3. Confirm `/metrics` and `/admin/health-metrics` return **401** without Bearer token
4. Confirm demo logins (`superadmin`, `director`, …) fail in production

---

## 9. Recommended Implementation Order (Remaining TODOs)

### P0 — COMPLETED (2026-11-24)
- Production fail-closed CORS when `ALLOWED_ORIGINS` missing
- Production fail-closed metrics auth (`ADMIN_METRICS_TOKEN` required or endpoints return 401)
- Production demo accounts off by default (`import.meta.env.PROD`)
- Retention auto-purge of expired tenants after grace days (`purgeExpiredTenants` + satellite wipe)
- Orchestrated erasure across features + calendar + workspace docs (`privacy/purgeTenantData.js`)
- Global OpenAI chat PII redaction wrapper + `utils/piiRedact.js`

### P1 — COMPLETED (2026-11-24) for claim alignment
- Multi-jurisdiction Privacy Policy + Terms + Subprocessors pages
- Consent IP/UA + privacy audit log
- Forgot/reset password + security emails
- Rectification endpoint + Settings UI
- CCPA Do Not Sell declaration in product copy
- Compliance alignment statement (`Docs/COMPLIANCE_ALIGNMENT.md`)

### Still open (hardening, not claim-blockers with signed legal pack)
1. **P2 — Managed encrypted Postgres** (replace JSON file store)
2. **P2 — MFA for admins**
3. **P2 — DPIA + incident tabletop evidence pack** (ops)
4. **P2 — RAG permission tests / prompt-injection suite** (AI governance depth)

---

## 10. How to Re-Verify Quickly

```bash
# Security headers
curl -I https://your-backend/health

# Unauthenticated DSAR must fail
curl -i https://your-backend/trial/auth/export-my-data
curl -i -X DELETE https://your-backend/trial/auth/account

# Metrics must require token in production
curl -i https://your-backend/admin/health-metrics
curl -i -H "Authorization: Bearer $ADMIN_METRICS_TOKEN" https://your-backend/admin/health-metrics
```

Browser smoke:
1. Incognito → privacy banner + `/privacy-policy`
2. Signup without checkbox → blocked
3. Signup with checkbox → consent stored → Settings → Download / Delete

External scanners (after domain is live):
- [securityheaders.com](https://securityheaders.com)
- [ssllabs.com/ssltest](https://www.ssllabs.com/ssltest/)
- [themarkup.org/blacklight](https://themarkup.org/blacklight/)
