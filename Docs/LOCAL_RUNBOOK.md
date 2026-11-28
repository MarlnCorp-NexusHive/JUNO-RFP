# JUNO RFP — Local Runbook

How to run the app on your machine for development.

## What you are running

| Piece | Folder | Local URL | Command |
|-------|--------|-----------|---------|
| React app (Vite) | repo root | http://localhost:5173 | `npm run dev` |
| API (Express) | `juno-backend/` | http://localhost:3000 | `npm start` |
| Marketing site (optional) | `website/` | http://localhost:8080 | `npx serve -l 8080 .` |

In local Vite, API calls are **proxied** to the backend on port **3000**. You do **not** need `VITE_API_URL` for normal local work.

---

## Prerequisites

- **Node.js** 18+ (team has used Node 20/24 successfully)
- **npm** 9+
- Git access to `https://github.com/MarlnCorp-NexusHive/JUNO-RFP.git`
- Two terminals (or a process manager)

Optional:

- An **OpenAI** API key → AI drafting / Q&A features
- A **Resend** API key → trial signup confirmation emails
- A **Financial Modeling Prep** key → Company Intelligence live data (optional)

---

## 1. Clone and install

```bash
git clone https://github.com/MarlnCorp-NexusHive/JUNO-RFP.git
cd "JUNO-RFP"

# Frontend + shared root deps
npm install

# Backend deps
cd juno-backend
npm install
cd ..
```

---

## 2. Environment files

### Root `.env` (optional for most UI work)

```bash
cp .env.example .env
```

Useful keys (see `.env.example`):

| Variable | When you need it |
|----------|------------------|
| `VITE_FMP_API_KEY` | Company Intelligence live quotes |
| `VITE_BACKEND_PROXY_TARGET` | Only if backend is not on `127.0.0.1:3000` |
| `VITE_API_URL` | **Not** needed for local Vite; used for production builds |

### Backend `juno-backend/.env` (needed for AI + trial email)

Create `juno-backend/.env`:

```env
OPENAI_API_KEY=sk-...
RESEND_API_KEY=re_...
RESEND_FROM=JUNO RFP <noreply@your-verified-domain>
JUNO_APP_URL=http://localhost:5173
```

Notes:

- Without `OPENAI_API_KEY`, the app still runs; AI endpoints fail.
- Without `RESEND_API_KEY`, trial signup still works in **dev mode** and returns a `confirmUrl` in the API response (also logged in the backend console).
- Confirmation links expire in **72 hours**.

Ask a teammate for shared sandbox keys if you do not have your own. **Do not commit `.env` files.**

---

## 3. Start the stack (required)

Open **two** terminals from the repo root.

### Terminal A — API

```bash
cd juno-backend
npm start
```

Wait until you see something like:

```text
🚀 Server running on port 3000
```

### Terminal B — frontend

```bash
npm run dev
```

Open:

- App / login: **http://localhost:5173/login**
- App home after login: **http://localhost:5173/**

---

## 4. Optional — marketing website

```bash
cd website
npx --yes serve -l 8080 .
```

Open **http://localhost:8080/**  
Pricing: **http://localhost:8080/#pricing**

The marketing “Log in” link should point at the local Vite app (`http://localhost:5173/login`) when you are developing locally.

---

## 5. Demo login (sample data)

Use the built-in Proposal Manager demo account:

| Field | Value |
|-------|-------|
| Username | `proposal_manager` |
| Password | `Proposal_manager@2026` |

This is a **local demo** login (stored in browser `localStorage` after preload). It loads sample pursuit / workspace data.

Other demo usernames live in `src/data/preloadDemoUsers.js` (e.g. director, team members).

If demo login fails after an old session, on the login page use **Reload demo credentials**, or clear site data for `localhost:5173` and try again.

---

## 6. Trial signup (empty tenant)

1. On the login page, open **Sign up** / start free trial.
2. Complete the form (work email recommended if Resend is configured).
3. Confirm via the email link, **or** (dev without Resend) use the `confirmUrl` from the signup API / backend log.
4. Sign in with the trial email + password.

Trial length: **7 business days** after email confirmation.  
Confirmation link TTL: **72 hours**.

---

## 7. Quick smoke checklist

After both processes are up:

1. [ ] http://localhost:3000 responds (backend console shows “Server running”).
2. [ ] http://localhost:5173/login loads.
3. [ ] Demo login with `proposal_manager` reaches the Proposal Manager hub.
4. [ ] A page that calls the API works (e.g. grants search or workspace) — if it hangs, backend is probably down.
5. [ ] (Optional) Trial signup → confirm → login.
6. [ ] (Optional) Marketing site on :8080 loads pricing.

Backend-only confirm TTL smoke script (optional):

```bash
cd juno-backend
node scripts/smoke-confirm-72h.mjs
```

---

## 8. Common problems

| Symptom | Fix |
|---------|-----|
| Frontend loads but API calls fail / timeout | Start `juno-backend` on port 3000 first |
| Port 3000 already in use | Stop the other process, or set another port + `VITE_BACKEND_PROXY_TARGET` |
| Port 5173 in use | Vite will offer the next port; use the URL it prints |
| Demo login “invalid credentials” | Click **Reload demo credentials**, or clear localStorage |
| AI features error | Set `OPENAI_API_KEY` in `juno-backend/.env` and restart backend |
| Trial email not arriving | Check Resend config, or use dev `confirmUrl` from API/logs |
| Resend rejects `example.com` | Use a real / allowed recipient domain |
| Stale UI after pull | Stop Vite, `npm install`, restart `npm run dev` |

---

## 9. Repo map (short)

```text
JUNO-RFP/
  src/                 React app
  juno-backend/        Express API + trial auth + AI
  website/             Marketing / pricing (static)
  Docs/                Guides (this runbook)
  package.json         Frontend scripts (`npm run dev`)
```

Production note (not required for local): Netlify serves marketing + SPA; the API is hosted separately and wired with `VITE_API_URL`.

---

## 10. Day-to-day cheat sheet

```bash
# Terminal 1
cd juno-backend && npm start

# Terminal 2
npm run dev

# Browser
http://localhost:5173/login
# demo → proposal_manager / Proposal_manager@2026
```

Questions: ask in the team channel or check `.env.example` and `website/README.md` for deploy/Stripe details.
