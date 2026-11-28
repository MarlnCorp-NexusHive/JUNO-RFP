# JUNO RFP Runbook

**Last verified:** 2026-11-29  
**App:** JUNO RFP (frontend + `juno-backend`)  
**Local URLs:** http://localhost:5173 (UI) · http://localhost:3000 (API)

Use this to start the app, confirm it is up, and handle the failures that show up in local and production.

Related docs: `Docs/PRIVACY_COMPLIANCE_CHECKLIST.md`, `Docs/COMPLIANCE_ALIGNMENT.md`, `.env.example`.

---

## 1. What has to be running

| Process | Directory | Command | Ready when |
|---------|-----------|---------|------------|
| API | `juno-backend` | `npm start` | Log line `Server running on port 3000` |
| UI | repo root | `npm run dev` | Log line `Local: http://localhost:5173/` |

The UI proxies API calls to port 3000. Start the API first. If only the UI is up, login and signup fail.

---

## 2. Start locally

From the repo root, in two terminals:

```bash
# Terminal A — API
cd juno-backend
npm install
OPENAI_API_KEY="${OPENAI_API_KEY:-sk-local-dev-placeholder}" PORT=3000 npm start
```

```bash
# Terminal B — UI
cd /path/to/JUNO-RFP
npm install
npm run dev
```

Open http://localhost:5173/login.

Optional email (confirmation and password reset). Without these, local signup still works and shows a confirmation link on screen:

```bash
# juno-backend/.env
RESEND_API_KEY=re_...
RESEND_FROM=JUNO RFP <noreply@yourdomain.com>
JUNO_APP_URL=http://localhost:5173
```

Restart the API after changing `.env`.

---

## 3. Confirm it is running

```bash
curl -s -o /dev/null -w "health:%{http_code}\n" http://127.0.0.1:3000/health
curl -s -o /dev/null -w "ui:%{http_code}\n" http://127.0.0.1:5173/
curl -s -o /dev/null -w "export_without_login:%{http_code}\n" http://127.0.0.1:3000/trial/auth/export-my-data
```

Pass:

- `health:200`
- `ui:200`
- `export_without_login:401`
- Browser shows **Log in to JUNO RFP** at http://localhost:5173/login

Backend tests:

```bash
cd juno-backend && npm test
```

---

## 4. Customer smoke test

1. Open http://localhost:5173/login in a private window.
2. Privacy notice appears at the **top**. **Log in** stays clickable.
3. **Sign up** stays disabled until the privacy checkbox is checked.
4. Create an account. If email is not configured, use **Open confirmation link**.
5. Sign in. You should land on `/app/home`.
6. Open **Settings**. Use **Download My Data**, **Correct My Name** (the contact name on the page must change), then **Delete My Account & Data**.
7. Sign in again with that email. Expect **Invalid trial credentials**.

Public pages, no login: `/privacy-policy`, `/cookie-policy`, `/terms`, `/subprocessors`.

---

## 5. Stop

```bash
lsof -ti:3000 | xargs kill
lsof -ti:5173 | xargs kill
```

Exit code 137 on an old API process means it was stopped so a new one could take port 3000. That is expected during a restart.

---

## 6. Production go-live

Set these before the public URL is shared. Missing values are the usual reason a local app “works” and production does not.

**Frontend host (Netlify)**

```env
VITE_API_URL=https://your-juno-backend.example.com
VITE_ENABLE_DEMO_USERS=false
```

**API host (Render)**

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-frontend.example.com
ADMIN_METRICS_TOKEN=<strong-random-secret>
RESEND_API_KEY=re_...
RESEND_FROM=JUNO RFP <noreply@yourdomain.com>
JUNO_APP_URL=https://your-frontend.example.com
TRIAL_DATA_PATH=/var/data/trial-tenants.json
OPENAI_API_KEY=sk-...
```

Also mount a persistent disk at `/var/data`. Without `TRIAL_DATA_PATH` on that disk, trial accounts disappear on restart.

After deploy:

```bash
curl -i https://your-backend/health
curl -i https://your-backend/trial/auth/export-my-data          # must be 401
curl -i https://your-backend/admin/health-metrics               # must be 401
curl -i -H "Authorization: Bearer $ADMIN_METRICS_TOKEN" https://your-backend/admin/health-metrics
```

---

## 7. If it will not run

| What you see | Cause | What to do |
|--------------|--------|------------|
| UI loads, login spins or network error | API is down or not on port 3000 | Start `juno-backend` and check `curl http://127.0.0.1:3000/health` |
| `EADDRINUSE` on 3000 or 5173 | An old process still holds the port | Stop it with the commands in section 5, then start again |
| Signup says email is not configured | `RESEND_API_KEY` is unset | Use the on-screen confirmation link locally, or set Resend and restart the API |
| Signup returns `privacy_consent_required` | Request omitted `privacyAccepted: true` | The checkbox must be checked. The API rejects a missing or non-boolean flag |
| Production browser calls fail CORS | `ALLOWED_ORIGINS` empty or wrong | Set it to the exact frontend origin, including `https` |
| `/metrics` is open | Not production, or token unset | In production, set `NODE_ENV=production` and `ADMIN_METRICS_TOKEN` |
| Accounts vanish after deploy | Trial data is on ephemeral disk | Set `TRIAL_DATA_PATH` on a mounted disk |
| Demo logins appear | Local dev, or `VITE_ENABLE_DEMO_USERS=true` | Production builds hide them unless that flag is explicitly `true` |

---

## 8. Privacy incidents (short)

1. Stop further access: revoke the session or delete the account (`DELETE /trial/auth/account` for the signed-in user).
2. Read `juno-backend/data/privacy-audit-log.json` for consent, export, correction, delete, and password events. Do not paste passwords or document bodies into tickets.
3. Notify `privacy@marlncorp.ai`. GDPR qualifying breaches follow the 72-hour supervisory notice path in the signed legal pack.
4. Confirm erasure with a login attempt (must fail) and a search of `trial-tenants.json` for that email.
