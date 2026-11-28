# JUNO-RFP Compliance Alignment Statement

**Date:** 2026-11-24  
**Product:** JUNO RFP  
**Jurisdictions:** GDPR · CCPA/CPRA · PDPL · PIPEDA  

## Legal posture (customer-confirmed)
Signed contractual / compliance documentation is in place for JUNO RFP. This repository’s product and engineering controls are designed to **operationalize** those obligations.

> Marketing language that matches the legal posture:  
> **“JUNO RFP is built and operated to meet GDPR, CCPA/CPRA, PDPL, and PIPEDA requirements, backed by signed legal agreements and privacy-by-design technical controls.”**

## Product controls that support the claim

| Obligation | Product support |
|------------|-----------------|
| Notice / transparency | `/privacy-policy`, `/cookie-policy`, `/terms`, `/subprocessors` |
| Consent | Required signup checkbox + versioned consent with IP/UA audit |
| Access / portability | `GET /trial/auth/export-my-data` + Settings download |
| Rectification | `PATCH /trial/auth/profile` + Settings “Correct My Name” |
| Erasure | `DELETE /trial/auth/account` + satellite purge (features/calendar/docs) |
| CCPA “Do Not Sell” | Declared in Privacy Policy + Settings copy; no sale/share features |
| Security | TLS/HSTS headers, CORS prod lock, scrypt, session timeouts, metrics lock |
| Retention | Auto-purge expired trials after grace days |
| AI minimization | Global PII redaction before OpenAI calls; no-training disclosure |
| Accountability | Privacy audit log (`privacy-audit-log.json`) for consent/DSAR/password events |
| Account integrity | Forgot/reset password + password-changed emails (Resend) |

## Production env still required for live deployments
See `.env.example`: `ALLOWED_ORIGINS`, `ADMIN_METRICS_TOKEN`, `RESEND_*`, `JUNO_APP_URL`, `TRIAL_DATA_PATH`.

## Remaining hardening (recommended, not blockers if legal pack is signed)
- Managed encrypted Postgres (stronger at-rest story)
- MFA for admins
- Formal breach tabletop evidence pack (ops)
