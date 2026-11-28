import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiLock, FiPlus } from "react-icons/fi";
import "./junoWorkspaceSettings.css";
import { getTrialSession } from "../../services/trialAuthSession.js";
import { isTrialUserSession } from "../rfp-collaboration/useTrialCollabT.js";
import {
  AI_ADMINS,
  PEOPLE,
  PLAN_AI,
  TOPUP,
  WORKSPACES,
  WSM,
  aiBlocked,
  aiState,
  buildTenantWorkspace,
  colorForKey,
  emptyTenantSettings,
  fetchTrialSettings,
  fmtDay,
  fmtTok,
  globalCost,
  initialsOf,
  loadAiSettings,
  monthKey,
  resetTrialSettings,
  saveAiSettings,
  saveTrialSettings,
  todayISO,
  usd,
} from "./aiSettingsStore.js";
import { barsSVG, donutSVG, hstackSVG, meterSVG } from "./settingsCharts.js";

const TABS = [
  ["usage", "AI usage & limits"],
  ["provider", "AI provider"],
  ["billing", "Plan & billing"],
  ["privacy", "Privacy & data"],
  ["admin", "Workspace budgets (admin)"],
];

const FC = ["#4F46E5", "#7C3AED", "#059669", "#D97706", "#DB2777", "#0D9488", "#6B7280"];
const PRIVACY_URL = "/#privacy";
const COOKIE_URL = "/#cookies";

function resolvePerson(id, entry, membersByKey, isTrial) {
  if (!isTrial) {
    const p = PEOPLE[id];
    if (p) return p;
  }
  const m = membersByKey.get(id) || (entry?.userEmail ? membersByKey.get(entry.userEmail) : null);
  const name = m?.name || entry?.userName || entry?.userEmail || id || "Team member";
  return {
    n: name,
    i: initialsOf(name),
    c: colorForKey(m?.id || m?.email || id || name),
  };
}

function Avatar({ id, entry, membersByKey, isTrial }) {
  const p = resolvePerson(id, entry, membersByKey, isTrial);
  if (!p) return null;
  return (
    <span className="av" style={{ background: p.c }} title={p.n}>
      {p.i}
    </span>
  );
}

export default function JunoWorkspaceSettings() {
  const isTrial = isTrialUserSession();
  const trialSession = getTrialSession();
  const tenantId = trialSession?.tenantId || "tenant";
  const initialTenant = useMemo(
    () => ({
      id: tenantId,
      name: trialSession?.tenantName || "Workspace",
    }),
    [tenantId, trialSession?.tenantName],
  );

  const initialState = useMemo(() => {
    if (isTrial) return emptyTenantSettings(tenantId);
    return loadAiSettings();
  }, [isTrial, tenantId]);

  const [cfg, setCfg] = useState(initialState.cfg);
  const [log, setLog] = useState(initialState.log);
  const [tenant, setTenant] = useState(initialTenant);
  const [members, setMembers] = useState(() =>
    trialSession?.user ? [trialSession.user] : [],
  );
  const [loadingRemote, setLoadingRemote] = useState(isTrial);
  const [tab, setTab] = useState("usage");
  const [toast, setToast] = useState("");
  const saveTimerRef = useRef(null);

  const TODAY = todayISO();

  const refreshFromBackend = useCallback(
    async ({ silent = false } = {}) => {
      if (!isTrial) return;
      if (!silent) setLoadingRemote(true);
      try {
        const res = await fetchTrialSettings();
        if (res?.tenant) setTenant(res.tenant);
        if (Array.isArray(res?.members)) setMembers(res.members);
        if (res?.data?.cfg) setCfg(res.data.cfg);
        if (Array.isArray(res?.data?.log)) setLog(res.data.log);
      } catch (err) {
        console.warn("[settings] failed to load tenant settings:", err?.message || err);
      } finally {
        if (!silent) setLoadingRemote(false);
      }
    },
    [isTrial],
  );

  useEffect(() => {
    if (!isTrial) return undefined;
    void refreshFromBackend({ silent: false });
    const onUpdate = () => void refreshFromBackend({ silent: true });
    const onFocus = () => void refreshFromBackend({ silent: true });
    window.addEventListener("juno:ai-usage-updated", onUpdate);
    window.addEventListener("focus", onFocus);
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshFromBackend({ silent: true });
      }
    }, 10_000);
    return () => {
      window.removeEventListener("juno:ai-usage-updated", onUpdate);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(interval);
    };
  }, [isTrial, refreshFromBackend]);

  const workspaces = useMemo(() => {
    if (isTrial) return [buildTenantWorkspace(tenant, members)];
    return WORKSPACES;
  }, [isTrial, tenant, members]);

  const wsId = isTrial ? tenant.id || tenantId : cfg.activeWs || "w1";
  const curWS = isTrial ? workspaces[0] : WSM[wsId] || WORKSPACES[0];

  const membersByKey = useMemo(() => {
    const map = new Map();
    for (const m of members) {
      if (m?.id) map.set(m.id, m);
      if (m?.email) map.set(m.email, m);
    }
    return map;
  }, [members]);

  const adminNames = useMemo(() => {
    if (!isTrial) return AI_ADMINS.map((k) => PEOPLE[k].n).join(" and ");
    const names = members.map((m) => m.name || m.email).filter(Boolean);
    if (!names.length) return "workspace admins";
    if (names.length <= 2) return names.join(" and ");
    return `${names.slice(0, 2).join(", ")} +${names.length - 2} more`;
  }, [isTrial, members]);

  const persist = useCallback(
    (nextCfg, nextLog = log) => {
      setCfg(nextCfg);
      if (!isTrial) {
        setLog(nextLog);
        saveAiSettings(nextCfg, nextLog);
        return;
      }
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        void saveTrialSettings(nextCfg)
          .then((res) => {
            if (Array.isArray(res?.data?.log)) setLog(res.data.log);
          })
          .catch((err) => {
            console.warn("[settings] failed to persist tenant settings:", err?.message || err);
          });
      }, 250);
    },
    [isTrial, log],
  );

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  };

  /** All Settings subpages shown for every role. */
  const tabs = TABS;

  const st = useMemo(() => aiState(cfg, log, wsId), [cfg, log, wsId]);
  const wsCfg = cfg.ws?.[wsId] || { plan: "pro", topup: 0, cap: 250 };

  const onTopup = () => {
    const currentWsCfg = cfg.ws?.[wsId] || { plan: "pro", topup: 0, cap: 250 };
    const next = {
      ...cfg,
      ws: {
        ...cfg.ws,
        [wsId]: { ...currentWsCfg, topup: (currentWsCfg.topup || 0) + TOPUP.tokens },
      },
    };
    const k = `${wsId}|${monthKey()}`;
    if (next.alerted?.[k]) {
      const copy = { ...next.alerted[k] };
      const after = aiState(next, log, wsId);
      if (after.pct < 100) delete copy.a100;
      if (after.pct < 80) delete copy.a80;
      next.alerted = { ...next.alerted, [k]: copy };
    }
    persist(next);
    showToast(`${fmtTok(TOPUP.tokens)} AI tokens added for this month`);
  };

  const onSetPlan = (plan) => {
    const currentWsCfg = cfg.ws?.[wsId] || { plan: "pro", topup: 0, cap: 250 };
    const next = {
      ...cfg,
      ws: { ...cfg.ws, [wsId]: { ...currentWsCfg, plan } },
    };
    persist(next);
    showToast(`Plan changed to ${PLAN_AI[plan].n}`);
  };

  const exportData = () => {
    const blob = new Blob(
      [JSON.stringify({ exportedAt: new Date().toISOString(), workspace: curWS, cfg, log }, null, 2)],
      { type: "application/json" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `juno-settings-${curWS.slug || wsId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Download started");
  };

  const clearBrowser = async () => {
    const prompt = isTrial
      ? "Reset this workspace’s Settings and AI usage statistics back to zero for all users in your organization?"
      : "Clear this browser’s saved Settings AI usage data?";
    if (!window.confirm(prompt)) return;
    if (isTrial) {
      try {
        const res = await resetTrialSettings();
        if (res?.data?.cfg) setCfg(res.data.cfg);
        if (Array.isArray(res?.data?.log)) setLog(res.data.log);
        showToast("Workspace settings and AI usage reset");
      } catch {
        showToast("Could not reset workspace settings");
      }
      return;
    }
    localStorage.removeItem("juno-app-settings-ai-v1");
    const fresh = loadAiSettings();
    setCfg(fresh.cfg);
    setLog(fresh.log);
    showToast("Browser settings data cleared");
  };

  /* ---------- Usage tab ---------- */
  const usagePanel = () => {
    const mk = monthKey();
    const reset = new Date(+mk.slice(0, 4), +mk.slice(5, 7), 1);
    const days = new Date(+mk.slice(0, 4), +mk.slice(5, 7), 0).getDate();
    const today = +TODAY.slice(8, 10);
    const proj = today ? (st.tok / today) * days : 0;
    const byDay = [...Array(days)].map((_, i) => {
      const d = `${mk}-${String(i + 1).padStart(2, "0")}`;
      return st.L.filter((x) => x.day === d).reduce((s, x) => s + (x.tin || 0) + (x.tout || 0), 0) / 1e6;
    });
    const feats = {};
    st.L.forEach((x) => {
      feats[x.feature] = (feats[x.feature] || 0) + (x.tin || 0) + (x.tout || 0);
    });
    const users = {};
    const userEntries = {};
    st.L.forEach((x) => {
      const uid = x.user || "member";
      users[uid] = (users[uid] || 0) + (x.tin || 0) + (x.tout || 0);
      if (!userEntries[uid]) userEntries[uid] = x;
    });

    const featureParts = Object.entries(feats)
      .sort((a, b) => b[1] - a[1])
      .map(([l, v], i) => ({
        l,
        v: Math.max(0.01, Math.round(v / 1e4) / 100),
        c: FC[i % FC.length],
      }));

    const userRows = Object.entries(users)
      .sort((a, b) => b[1] - a[1])
      .map(([k, v]) => {
        const p = resolvePerson(k, userEntries[k], membersByKey, isTrial);
        return {
          l: p.n.split(" ")[0],
          h: `<span class="av" style="background:${p.c}">${p.i}</span> `,
          v: { t: Math.max(0.01, Math.round(v / 1e4) / 100) },
        };
      });

    return (
      <>
        <div className="kpis">
          <div className="card-box kpi">
            <small>AI tokens this month</small>
            <strong
              className="tnum"
              style={{ color: st.pct >= 100 ? "var(--crit)" : st.pct >= 80 ? "var(--warn)" : "inherit" }}
            >
              {fmtTok(st.tok)}
            </strong>
            <em>
              of {fmtTok(st.allow)} ({Math.round(st.pct)}%)
            </em>
          </div>
          <div className="card-box kpi">
            <small>Projected by month end</small>
            <strong className="tnum" style={{ color: proj > st.allow ? "var(--warn)" : "inherit" }}>
              {fmtTok(proj)}
            </strong>
            <em>{proj > st.allow ? "Over allowance at this pace" : "Within allowance"}</em>
          </div>
          <div className="card-box kpi">
            <small>AI requests</small>
            <strong className="tnum">{st.calls.toLocaleString()}</strong>
            <em>This month</em>
          </div>
          <div className="card-box kpi">
            <small>Allowance resets</small>
            <strong className="tnum" style={{ fontSize: 20 }}>
              {reset.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </strong>
            <em>
              {(PLAN_AI[wsCfg.plan] || PLAN_AI.pro).n} plan
              {wsCfg.topup ? ` + ${fmtTok(wsCfg.topup)} top-up` : ""}
            </em>
          </div>
        </div>

        <section className="card-box" style={{ padding: "18px 20px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
              alignItems: "flex-start",
            }}
          >
            <div>
              <h2 className="sec-title">Monthly AI token allowance</h2>
              <p className="sub">
                Tokens are the units of text the AI reads and writes. One proposal typically uses 0.5M–1.5M
                tokens.
              </p>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button type="button" className="btn" onClick={() => setTab("billing")}>
                Change plan
              </button>
              <button type="button" className="btn primary" onClick={onTopup}>
                <FiPlus aria-hidden />
                Buy {fmtTok(TOPUP.tokens)} tokens · ${TOPUP.price}
              </button>
            </div>
          </div>
          <div
            style={{ marginTop: 16 }}
            dangerouslySetInnerHTML={{ __html: meterSVG(st.pct, fmtTok(st.allow)) }}
          />
          <div className="alertset">
            <b>Alerts</b>
            <label className="toggle">
              <input
                type="checkbox"
                checked={!!cfg.alerts.a80}
                onChange={(e) =>
                  persist({ ...cfg, alerts: { ...cfg.alerts, a80: e.target.checked } })
                }
              />{" "}
              Notify admins at 80%
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                checked={!!cfg.alerts.a100}
                onChange={(e) =>
                  persist({ ...cfg, alerts: { ...cfg.alerts, a100: e.target.checked } })
                }
              />{" "}
              Notify admins at 100%
            </label>
            <label className="toggle">
              When the allowance runs out{" "}
              <select
                className="sel"
                style={{ height: 30, width: "auto" }}
                value={cfg.overage}
                onChange={(e) => persist({ ...cfg, overage: e.target.value })}
              >
                <option value="block">pause AI features</option>
                <option value="allow">keep going and bill overage</option>
              </select>
            </label>
            <span className="sub" style={{ fontSize: 12 }}>
              Alerts go to workspace admins: {adminNames}.
            </span>
          </div>
        </section>

        <div className="two" style={{ marginTop: 16 }}>
          <section className="card-box">
            <div className="panel-h">
              <div>
                <h2 className="sec-title">Daily AI tokens</h2>
                <p className="sub">
                  Millions of tokens per day,{" "}
                  {new Date(+mk.slice(0, 4), +mk.slice(5, 7) - 1, 1).toLocaleDateString("en-US", {
                    month: "long",
                  })}
                </p>
              </div>
            </div>
            <div
              style={{ padding: "10px 14px 14px" }}
              dangerouslySetInnerHTML={{
                __html: barsSVG(
                  byDay.map((_, i) => String(i + 1)),
                  [{ l: "AI tokens (M)", v: byDay.map((v) => Math.round(v * 1000) / 1000), c: "var(--pine)" }],
                  {
                    hl: today - 1,
                    fmt: (v) => v.toFixed(2),
                    label: "Daily AI tokens this month",
                  },
                ),
              }}
            />
          </section>
          <section className="card-box">
            <div className="panel-h">
              <div>
                <h2 className="sec-title">By feature</h2>
                <p className="sub">Where tokens go</p>
              </div>
            </div>
            <div style={{ padding: "14px 16px" }}>
              {featureParts.length ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: donutSVG(featureParts, fmtTok(st.tok), "tokens"),
                  }}
                />
              ) : (
                <p className="sub" style={{ textAlign: "center", padding: "32px 12px" }}>
                  No AI usage recorded yet this month. Usage will appear here in real time as your team uses
                  Sage AI features.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="two" style={{ marginTop: 16 }}>
          <section className="card-box">
            <div className="panel-h">
              <div>
                <h2 className="sec-title">By person</h2>
              </div>
            </div>
            <div style={{ padding: "14px 16px" }}>
              {userRows.length ? (
                <div
                  dangerouslySetInnerHTML={{
                    __html: hstackSVG(userRows, ["t"], ["var(--pine)"], ["Millions of tokens"]),
                  }}
                />
              ) : (
                <p className="sub" style={{ textAlign: "center", padding: "24px 12px" }}>
                  No team member activity yet this month.
                </p>
              )}
            </div>
          </section>
          <section className="card-box">
            <div className="panel-h">
              <div>
                <h2 className="sec-title">Recent AI requests</h2>
              </div>
            </div>
            <div style={{ overflowX: "auto", maxHeight: 330 }}>
              <table className="btab" style={{ minWidth: 520 }}>
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Feature</th>
                    <th>Person</th>
                    <th className="r">Tokens</th>
                    <th>Model</th>
                  </tr>
                </thead>
                <tbody>
                  {st.L.slice(-14)
                    .reverse()
                    .map((x, idx) => (
                      <tr key={`${x.at}-${idx}`}>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {fmtDay(x.day)}
                        </td>
                        <td>{x.feature}</td>
                        <td>
                          <Avatar
                            id={x.user}
                            entry={x}
                            membersByKey={membersByKey}
                            isTrial={isTrial}
                          />
                        </td>
                        <td className="r mono">
                          {fmtTok((x.tin || 0) + (x.tout || 0))}
                          {x.src === "est" ? (
                            <span className="sub" title="Estimated">
                              {" "}
                              ≈
                            </span>
                          ) : null}
                        </td>
                        <td className="mono" style={{ fontSize: 12 }}>
                          {x.model}
                        </td>
                      </tr>
                    ))}
                  {!st.L.length ? (
                    <tr>
                      <td colSpan={5} className="sub" style={{ textAlign: "center", padding: 16 }}>
                        No AI requests yet this month.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </section>
        </div>
        <p className="sub" style={{ fontSize: 12, marginTop: 12 }}>
          {isTrial
            ? "Live usage for your organization. New AI requests are recorded automatically on the server as your team uses AI features, shared across everyone in this workspace."
            : "Earlier usage this month is sample data. New AI requests are added as they happen: exact token counts from the AI service when it reports them, otherwise estimates (≈)."}
        </p>
      </>
    );
  };

  /* ---------- Provider ---------- */
  const providerPanel = () => (
    <section className="card-box ixf" style={{ padding: 18, maxWidth: 860 }}>
      <h2 className="sec-title">AI provider</h2>
      <p className="sub">
        JunoRFP uses OpenAI GPT models through your secure server connection. The API key stays on the
        server and never reaches the browser.
      </p>
      <div className="ixr">
        <label>
          Provider
          <select className="sel" value={cfg.provider} disabled>
            <option value="openai">OpenAI (GPT)</option>
          </select>
        </label>
        <label>
          Main model (drafting, Copilot, reports)
          <input
            className="sel"
            value={cfg.model}
            onChange={(e) => persist({ ...cfg, model: e.target.value })}
          />
        </label>
        <label>
          Fast model (reading documents, quick tasks)
          <input
            className="sel"
            value={cfg.fast}
            onChange={(e) => persist({ ...cfg, fast: e.target.value })}
          />
        </label>
      </div>
      <h3 className="sec-title" style={{ fontSize: 15, marginTop: 6 }}>
        Token prices (USD per 1M tokens)
      </h3>
      <p className="sub" style={{ fontSize: 12.5 }}>
        Used to calculate cost against budgets. Defaults are OpenAI list prices as of November 2026; update
        them if your contract or the published prices change.
      </p>
      <div style={{ overflowX: "auto" }}>
        <table className="btab" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th>Model</th>
              <th>Input</th>
              <th>Cached input</th>
              <th>Output</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(cfg.prices).map(([m, p]) => (
              <tr key={m}>
                <td className="mono">{m}</td>
                {["in", "cin", "out"].map((k) => (
                  <td key={k}>
                    <input
                      className="cell-in"
                      type="number"
                      step="0.01"
                      min="0"
                      value={p[k]}
                      aria-label={`${m} ${k}`}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        persist({
                          ...cfg,
                          prices: {
                            ...cfg.prices,
                            [m]: { ...cfg.prices[m], [k]: Number.isFinite(val) ? val : 0 },
                          },
                        });
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flagbox ok" style={{ marginTop: 8 }}>
        <FiLock aria-hidden />
        <div>
          <b>Data handling</b>
          <p>
            Requests go from your Netlify server to the OpenAI API. Per OpenAI’s API terms, API data isn’t
            used to train their models by default. Confirm this matches your agreement with OpenAI.
          </p>
        </div>
      </div>
      <p className="sub" style={{ fontSize: 12 }}>
        On this site, AI requests run through OpenAI GPT when OPENAI_API_KEY is set on the server.
      </p>
    </section>
  );

  /* ---------- Billing ---------- */
  const billingPanel = () => (
    <section className="card-box" style={{ padding: 18 }}>
      <h2 className="sec-title">Plan for {curWS.n}</h2>
      <p className="sub">Each plan includes a monthly AI token allowance. Unused tokens don’t roll over.</p>
      <div className="planpick">
        {Object.entries(PLAN_AI).map(([k, v]) => (
          <button
            key={k}
            type="button"
            className={`pp${wsCfg.plan === k ? " on" : ""}`}
            onClick={() => onSetPlan(k)}
          >
            <b>{v.n}</b>
            <span>{fmtTok(v.tokens)} AI tokens / month</span>
            {wsCfg.plan === k ? (
              <span className="pill ok np">Current plan</span>
            ) : (
              <span className="sub">Switch</span>
            )}
          </button>
        ))}
      </div>
      <div className="ins" style={{ marginTop: 12, borderBottom: 0 }}>
        <div style={{ flex: 1 }}>
          <b>Top-up packs</b>
          <p>
            {fmtTok(TOPUP.tokens)} extra AI tokens for ${TOPUP.price}, valid until the end of this month.
            {wsCfg.topup ? ` This month: ${fmtTok(wsCfg.topup)} added.` : ""}
          </p>
        </div>
        <button type="button" className="btn primary" onClick={onTopup}>
          Buy top-up
        </button>
      </div>
      <p className="sub" style={{ fontSize: 12, marginTop: 8 }}>
        On the live site, plan changes and top-ups go through Stripe checkout. In this demo they apply
        straight away.
      </p>
    </section>
  );

  /* ---------- Privacy ---------- */
  const privacyPanel = () => (
    <>
      <div className="nosale-app">
        <FiLock aria-hidden />
        <div>
          <h2 className="sec-title" style={{ fontSize: 18 }}>
            We do not sell or share your personal information.
          </h2>
          <p>
            MARLN Corporation never sells data about you, your team or your content, and never shares it for
            advertising. Your proposals, grants and files belong to your organization.
          </p>
        </div>
      </div>
      <div className="two" style={{ marginTop: 16 }}>
        <section className="card-box" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <h2 className="sec-title">How your data is handled</h2>
          <ul className="plist">
            <li>
              <b>Your content</b> is processed only to provide JunoRFP to your organization, as your
              processor under the subscription agreement.
            </li>
            <li>
              <b>AI features</b> send only the relevant text to our AI provider through our secure server. It
              is not used to train AI models.
            </li>
            <li>
              <b>Hosting</b> is in the United States, or in Canada if you choose. Data is encrypted in transit
              and at rest.
            </li>
            <li>
              <b>Payments</b> go through Stripe. We never see or store card numbers.
            </li>
            <li>
              <b>Browser storage</b> in this app is used only to save your workspace and preferences. There
              are no advertising or tracking cookies.
            </li>
          </ul>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <a className="btn" href={PRIVACY_URL} target="_blank" rel="noopener noreferrer">
              Privacy Statement
            </a>
            <a className="btn" href={COOKIE_URL} target="_blank" rel="noopener noreferrer">
              Cookie Policy
            </a>
          </div>
          <p className="sub" style={{ fontSize: 12.5 }}>
            Covers GDPR and UK GDPR, CCPA/CPRA and other US state laws, PIPEDA and Quebec Law 25, Saudi
            Arabia’s PDPL and the UAE’s data protection law.
          </p>
        </section>
        <section className="card-box" style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
          <h2 className="sec-title">Your data rights</h2>
          <div className="ins" style={{ padding: 0, alignItems: "center", borderBottom: 0 }}>
            <div style={{ flex: 1 }}>
              <b>Download your data</b>
              <p>
                A copy of this workspace’s data (pursuits, projects, tasks, library and settings) as a JSON
                file.
              </p>
            </div>
            <button type="button" className="btn" onClick={exportData}>
              Download
            </button>
          </div>
          <div className="ins" style={{ padding: 0, alignItems: "center", borderBottom: 0 }}>
            <div style={{ flex: 1 }}>
              <b>Access, correct or delete</b>
              <p>
                Ask us to access, correct or delete personal information, or to restrict how it’s used.
              </p>
            </div>
            <a
              className="btn"
              href={`mailto:contact@marlncorp.com?subject=${encodeURIComponent(`Privacy request: ${curWS.n}`)}`}
            >
              Make a request
            </a>
          </div>
          <div className="ins" style={{ padding: 0, alignItems: "center", borderBottom: 0 }}>
            <div style={{ flex: 1 }}>
              <b>{isTrial ? "Reset workspace settings" : "Clear this browser"}</b>
              <p>
                {isTrial
                  ? "Reset this workspace’s settings and AI usage statistics back to a clean slate."
                  : "Remove the data this app has saved in this browser."}
              </p>
            </div>
            <button type="button" className="btn ghost" onClick={clearBrowser}>
              {isTrial ? "Reset" : "Clear"}
            </button>
          </div>
          <p className="sub" style={{ fontSize: 12.5 }}>
            We respond within the time the law requires, generally 30 days. Privacy questions:
            contact@marlncorp.com.
          </p>
        </section>
      </div>
    </>
  );

  /* ---------- Admin budgets ---------- */
  const adminPanel = () => {
    const g = globalCost(log);
    return (
      <section className="card-box">
        <div className="panel-h">
          <div>
            <h2 className="sec-title">Workspace AI budgets</h2>
            <p className="sub">
              Hard monthly spending limits set by MARLN. When a workspace hits its limit, its AI features
              stop until next month, whatever its plan allowance.
            </p>
          </div>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="btab" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>Workspace</th>
                <th>Plan</th>
                <th className="r">Tokens used</th>
                <th className="r">Allowance</th>
                <th className="r">AI cost (month)</th>
                <th>Hard budget ($)</th>
                <th style={{ width: 170 }}>Budget used</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((w) => {
                const s = aiState(cfg, log, w.id);
                const b = aiBlocked(cfg, log, w.id);
                const wCfg = cfg.ws?.[w.id] || { plan: "pro", topup: 0, cap: 250 };
                return (
                  <tr key={w.id}>
                    <td>
                      <span className="wsdot" style={{ background: w.c }} />
                      {w.n}
                    </td>
                    <td>{(PLAN_AI[wCfg.plan] || PLAN_AI.pro).n}</td>
                    <td className="r mono">{fmtTok(s.tok)}</td>
                    <td className="r mono">{fmtTok(s.allow)}</td>
                    <td className="r mono">{usd(s.cost)}</td>
                    <td>
                      <input
                        className="cell-in"
                        type="number"
                        min={0}
                        step={10}
                        value={s.cap}
                        style={{ width: 100 }}
                        aria-label={`${w.n} hard budget`}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          persist({
                            ...cfg,
                            ws: {
                              ...cfg.ws,
                              [w.id]: {
                                ...wCfg,
                                cap: Number.isFinite(val) ? val : 0,
                              },
                            },
                          });
                        }}
                      />
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span className="track" style={{ flex: 1 }}>
                          <i
                            style={{
                              width: `${Math.min(100, s.capPct)}%`,
                              background:
                                s.capPct >= 100
                                  ? "var(--crit)"
                                  : s.capPct >= 80
                                    ? "var(--warn)"
                                    : "var(--pine)",
                            }}
                          />
                        </span>
                        <span className="mono" style={{ fontSize: 12 }}>
                          {Math.round(s.capPct)}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {b ? (
                        <span className="pill crit">
                          {b === "allowance" ? "Allowance used" : "Budget reached"}
                        </span>
                      ) : s.pct >= 80 ? (
                        <span className="pill warn">Tokens over 80%</span>
                      ) : (
                        <span className="pill ok">OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="ixr" style={{ padding: "14px 16px", borderTop: "1px solid var(--line-2)" }}>
          <label style={{ maxWidth: 260 }}>
            Company-wide monthly AI limit ($)
            <input
              className="sel"
              type="number"
              min={0}
              step={50}
              value={cfg.globalCap}
              onChange={(e) => {
                const val = Number(e.target.value);
                persist({ ...cfg, globalCap: Number.isFinite(val) ? val : 0 });
              }}
            />
          </label>
          <div style={{ flex: 2, minWidth: 240 }}>
            <b style={{ color: "var(--ink)" }}>{usd(g)}</b>{" "}
            <span className="sub">
              spent this month across all workspaces (
              {cfg.globalCap ? Math.round((g / cfg.globalCap) * 100) : 0}% of the limit)
            </span>
          </div>
        </div>
        <p className="sub" style={{ fontSize: 12, padding: "0 16px 16px" }}>
          {isTrial
            ? "These settings and usage totals are stored on the server for your organization and shared with every user in your workspace."
            : "These limits are enforced on the server by the AI connection (see README: AI_DEFAULT_BUDGET_USD, AI_GLOBAL_BUDGET_USD and the /api/ai-usage admin endpoint). The table above is this browser’s view of usage."}
        </p>
      </section>
    );
  };

  return (
    <div className="juno-ws-settings w-full" data-tour="juno-settings">
      <div className="greet">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p className="sub mt-1 text-gray-600 dark:text-gray-300">
            {curWS.n} · usage, AI provider, plan and budgets
            {isTrial && loadingRemote ? " · syncing…" : ""}
          </p>
        </div>
      </div>

      {!isTrial ? (
        <div className="ws-switch" role="group" aria-label="Workspace">
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`ws-chip${wsId === w.id ? " on" : ""}`}
              onClick={() => persist({ ...cfg, activeWs: w.id })}
            >
              <span className="av" style={{ background: w.c }}>
                {w.ab}
              </span>
              {w.n}
            </button>
          ))}
        </div>
      ) : null}

      <div className="ptabs" role="tablist">
        {tabs.map(([k, l]) => (
          <button
            key={k}
            type="button"
            role="tab"
            aria-selected={tab === k}
            className={tab === k ? "on" : ""}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === "privacy"
        ? privacyPanel()
        : tab === "provider"
          ? providerPanel()
          : tab === "billing"
            ? billingPanel()
            : tab === "admin"
              ? adminPanel()
              : usagePanel()}

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
