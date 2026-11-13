# JUNO RFP

Monorepo for the **JunoRFP marketing website** and the **JUNO RFP** React app on **one domain** (`junorfp.com`).

| Path | What |
|------|------|
| `website/` | Marketing site + `/workspace` demo + Stripe/AI Netlify functions |
| `src/` + `juno-backend/` | JUNO RFP product app (Vite SPA + Express API) |

**Netlify (junorfp.com):** `npm run build:site` → publish `_site` (marketing at `/`, app under `/r` with rewrites for `/login` and `/app/*`). API still hosts separately (`VITE_API_URL`).

**Log in** is same-origin: `https://junorfp.com/login` (local marketing → `http://localhost:5173/login`).

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
