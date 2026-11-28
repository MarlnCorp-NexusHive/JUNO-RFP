import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiPlus, FiRefreshCw, FiX, FiZap } from "react-icons/fi";
import "../../settings/junoWorkspaceSettings.css";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import { isTrialUserSession } from "../../rfp-collaboration/useTrialCollabT.js";
import { generateAnswer } from "../../../services/api.js";
import {
  PEOPLE,
  WORKSPACES,
  WSM,
  buildTenantWorkspace,
  colorForKey,
  esc,
  fetchTrialSettings,
  initialsOf,
  todayISO,
} from "../../settings/aiSettingsStore.js";
import { donutSVG } from "../../settings/settingsCharts.js";
import {
  TURN,
  emptyTenantLeaderboard,
  fmtK,
  loadDemoLeaderboard,
  loadTenantLeaderboard,
  saveDemoLeaderboard,
  saveTenantLeaderboard,
} from "../services/winLossLeaderboardStore.js";

const RC = ["#E5484D", "#F59E0B", "#8B5CF6", "#3B82F6", "#14B8A6", "#EC4899", "#94A3B8"];
const SECTORS = ["Public sector", "Health", "Education", "Commercial", "Nonprofit", "Other"];

function bandOf(h) {
  const v = Number(h.value) || 0;
  if (v < 100000) return "Under $100K";
  if (v < 500000) return "$100K–$500K";
  if (v < 1000000) return "$500K–$1M";
  return "Over $1M";
}

function emptyOutcomeForm() {
  return {
    name: "",
    buyer: "",
    sector: "Public sector",
    value: "",
    result: "won",
    reason: "",
    competitor: "",
  };
}

function RateBars({ rows, emptyText = "No outcomes recorded yet." }) {
  if (!rows.length) {
    return (
      <p className="sub" style={{ textAlign: "center", padding: "24px 12px" }}>
        {emptyText}
      </p>
    );
  }
  return (
    <div className="hstack">
      {rows.map((r) => (
        <div
          key={r.k}
          className="hs-row"
          style={{ gridTemplateColumns: "150px minmax(0,1fr) 74px" }}
        >
          <span className="hs-l" title={r.k} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {r.k}
          </span>
          <div className="hs-bar">
            <i
              style={{
                width: `${r.r}%`,
                background: r.r >= 50 ? "var(--s-done)" : r.r >= 34 ? "var(--s-doing)" : "var(--crit)",
              }}
            />
          </div>
          <b className="tnum" style={{ whiteSpace: "nowrap", fontSize: 12.5, textAlign: "right" }}>
            {r.r}% <small className="sub">({r.w}/{r.n})</small>
          </b>
        </div>
      ))}
    </div>
  );
}

export default function WinLossScoringPage() {
  const isTrial = isTrialUserSession();
  const trialSession = getTrialSession();
  const tenantId = trialSession?.tenantId || "tenant";

  const initialData = useMemo(() => {
    if (isTrial) return emptyTenantLeaderboard();
    return loadDemoLeaderboard();
  }, [isTrial]);

  const [history, setHistory] = useState(initialData.history);
  const [library, setLibrary] = useState(initialData.library);
  const [tenant, setTenant] = useState(() => ({
    id: tenantId,
    name: trialSession?.tenantName || "Workspace",
  }));
  const [members, setMembers] = useState(() =>
    trialSession?.user ? [trialSession.user] : [],
  );
  const [loadingRemote, setLoadingRemote] = useState(isTrial);
  const [wlAll, setWlAll] = useState(true);
  const [activeWs, setActiveWs] = useState(isTrial ? tenantId : "w1");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyOutcomeForm);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    window.setTimeout(() => setToast(""), 2800);
  };

  const refreshFromBackend = useCallback(
    async ({ silent = false } = {}) => {
      if (!isTrial) return;
      if (!silent) setLoadingRemote(true);
      try {
        const [board, settingsRes] = await Promise.all([
          loadTenantLeaderboard(),
          fetchTrialSettings().catch(() => null),
        ]);
        setHistory(board.history);
        setLibrary(board.library);
        if (settingsRes?.tenant) setTenant(settingsRes.tenant);
        if (Array.isArray(settingsRes?.members)) setMembers(settingsRes.members);
      } catch (err) {
        console.warn("[win-loss] failed to load tenant scoring data:", err?.message || err);
      } finally {
        if (!silent) setLoadingRemote(false);
      }
    },
    [isTrial],
  );

  useEffect(() => {
    if (!isTrial) return undefined;
    void refreshFromBackend({ silent: false });
    const onFocus = () => void refreshFromBackend({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [isTrial, refreshFromBackend]);

  const workspaces = useMemo(() => {
    if (isTrial) return [buildTenantWorkspace(tenant, members)];
    return WORKSPACES;
  }, [isTrial, tenant, members]);

  const curWS = isTrial ? workspaces[0] : WSM[activeWs] || WORKSPACES[0];

  const D = useMemo(() => {
    if (isTrial || wlAll) return history;
    return history.filter((h) => h.ws === activeWs);
  }, [history, isTrial, wlAll, activeWs]);

  const won = useMemo(() => D.filter((h) => h.result === "won"), [D]);
  const lost = useMemo(() => D.filter((h) => h.result === "lost"), [D]);
  const wr = D.length ? Math.round((won.length / D.length) * 100) : 0;

  const rate = useCallback(
    (keyFn) => {
      const m = {};
      D.forEach((h) => {
        const k = keyFn(h);
        if (!k) return;
        m[k] = m[k] || { w: 0, n: 0 };
        m[k].n += 1;
        if (h.result === "won") m[k].w += 1;
      });
      return Object.entries(m)
        .map(([k, v]) => ({ k, w: v.w, n: v.n, r: Math.round((v.w / v.n) * 100) }))
        .sort((a, b) => b.r - a.r || b.n - a.n);
    },
    [D],
  );

  const reasons = useMemo(() => {
    const r = {};
    lost.forEach((h) => {
      const key = String(h.reason || "Other").trim() || "Other";
      r[key] = (r[key] || 0) + 1;
    });
    return r;
  }, [lost]);

  const topLossReason = useMemo(() => {
    const top = Object.entries(reasons).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : "—";
  }, [reasons]);

  const topLibrary = useMemo(() => {
    return library
      .filter((l) => isTrial || wlAll || l.ws === activeWs)
      .slice()
      .sort((a, b) => (b.wins || 0) - (a.wins || 0))
      .slice(0, 5);
  }, [library, isTrial, wlAll, activeWs]);

  const peopleLeaderboard = useMemo(() => {
    if (!isTrial) {
      return Object.keys(PEOPLE)
        .map((k) => {
          const ot = history.filter((h) => (h.people || []).includes(k)).length * 2 + (k === "ana" ? 1 : 0);
          const reuse = library.filter((l) => l.author === k).reduce((s, l) => s + (l.wins || 0), 0);
          const wsCount = history.filter((h) => h.result === "won" && (h.people || []).includes(k)).length;
          const t = TURN[k] || 2.0;
          return {
            id: k,
            name: PEOPLE[k].n,
            initials: PEOPLE[k].i,
            color: PEOPLE[k].c,
            ot,
            reuse,
            t,
            ws: wsCount,
            score: Math.round(ot * 2 + reuse + wsCount * 5 + (5 - t) * 3),
          };
        })
        .sort((a, b) => b.score - a.score);
    }

    const byPerson = new Map();
    for (const m of members) {
      const id = m.id || m.email;
      const name = m.name || m.email || "Team member";
      byPerson.set(id, {
        id,
        name,
        initials: initialsOf(name),
        color: colorForKey(id),
        ot: 0,
        reuse: 0,
        t: null,
        ws: 0,
        score: 0,
      });
    }
    history.forEach((h) => {
      const ids = Array.isArray(h.people) && h.people.length ? h.people : [h.createdBy || "member"];
      ids.forEach((id) => {
        if (!byPerson.has(id)) {
          const name = h.createdByName || id;
          byPerson.set(id, {
            id,
            name,
            initials: initialsOf(name),
            color: colorForKey(id),
            ot: 0,
            reuse: 0,
            t: null,
            ws: 0,
            score: 0,
          });
        }
        const row = byPerson.get(id);
        row.ot += 1;
        if (h.result === "won") row.ws += 1;
      });
    });
    return [...byPerson.values()]
      .map((r) => ({ ...r, score: r.ot * 2 + r.reuse + r.ws * 5 }))
      .filter((r) => r.ot > 0 || r.ws > 0 || r.reuse > 0)
      .sort((a, b) => b.score - a.score);
  }, [isTrial, history, library, members]);

  const teamLeaderboard = useMemo(() => {
    return workspaces
      .map((w) => {
        const hs = isTrial ? history : history.filter((h) => h.ws === w.id);
        return { w, won: hs.filter((h) => h.result === "won").length, n: hs.length };
      })
      .sort((a, b) => b.won - a.won);
  }, [workspaces, history, isTrial]);

  const onSaveOutcome = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.buyer.trim()) {
      showToast("Enter a bid name and buyer");
      return;
    }
    const actorId = isTrial
      ? trialSession?.user?.id || trialSession?.user?.email || "member"
      : "ana";
    const actorName = isTrial
      ? trialSession?.user?.name || trialSession?.user?.email || "Team member"
      : PEOPLE.ana.n;
    const entry = {
      id: `wl_${Date.now().toString(36)}`,
      name: form.name.trim(),
      buyer: form.buyer.trim(),
      sector: form.sector || "Public sector",
      value: Math.max(0, Number(form.value) || 0),
      result: form.result === "lost" ? "lost" : "won",
      reason: form.reason.trim() || (form.result === "won" ? "Strong proposal" : "Price"),
      competitor: form.competitor.trim() || "—",
      at: todayISO(),
      people: [actorId],
      createdBy: actorId,
      createdByName: actorName,
      ws: isTrial ? tenant.id || tenantId : activeWs,
    };
    const nextHistory = [entry, ...history];
    setHistory(nextHistory);
    setForm(emptyOutcomeForm());
    setShowForm(false);
    if (isTrial) {
      await saveTenantLeaderboard({ history: nextHistory, library });
    } else {
      saveDemoLeaderboard({ history: nextHistory, library });
    }
    showToast("Outcome recorded");
  };

  const onExplainPatterns = async () => {
    if (!D.length) {
      showToast("Record at least one outcome first");
      return;
    }
    setAiBusy(true);
    setAiAnalysis("");
    try {
      const summary = D.slice(0, 25)
        .map(
          (h) =>
            `- ${h.name} (${h.buyer}, ${h.sector}, ${fmtK(h.value)}): ${h.result.toUpperCase()} — ${h.reason}${h.competitor && h.competitor !== "—" ? ` vs ${h.competitor}` : ""}`,
        )
        .join("\n");
      const prompt = `Analyze our win/loss record below: where do we win, where do we lose, which competitors beat us and why, and what 3 concrete changes should we make in our next three bids?\n\nWin rate: ${wr}% (${won.length} won, ${lost.length} lost)\n${summary}`;
      const ans = await generateAnswer(prompt);
      setAiAnalysis(String(ans || "").trim());
    } catch (err) {
      showToast(err?.message || "Could not analyze patterns right now");
    } finally {
      setAiBusy(false);
    }
  };

  const wonVal = won.reduce((s, h) => s + (Number(h.value) || 0), 0);
  const totalVal = D.reduce((s, h) => s + (Number(h.value) || 0), 0);
  const avgWin = won.length ? wonVal / won.length : 0;

  return (
    <div className="juno-ws-settings w-full" data-tour="juno-winloss">
      <div className="greet">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Win/loss &amp; leaderboard
          </h1>
          <p className="sub mt-1 text-gray-600 dark:text-gray-300">
            {isTrial ? curWS.n : wlAll ? "All workspaces" : curWS.n} · learn from every result
            {isTrial && loadingRemote ? " · syncing…" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {!isTrial ? (
            <label className="toggle" style={{ fontSize: 13 }}>
              <input
                type="checkbox"
                checked={wlAll}
                onChange={(e) => setWlAll(e.target.checked)}
              />{" "}
              All workspaces
            </label>
          ) : null}
          <button
            type="button"
            className="btn primary"
            onClick={() => setShowForm((v) => !v)}
          >
            <FiPlus aria-hidden />
            Record outcome
          </button>
          <button
            type="button"
            className="btn"
            onClick={onExplainPatterns}
            disabled={aiBusy}
          >
            {aiBusy ? <FiRefreshCw className="animate-spin" aria-hidden /> : <FiZap aria-hidden />}
            {aiBusy ? "Analyzing…" : "Explain patterns"}
          </button>
        </div>
      </div>

      {!isTrial && !wlAll ? (
        <div className="ws-switch" role="group" aria-label="Workspace">
          {workspaces.map((w) => (
            <button
              key={w.id}
              type="button"
              className={`ws-chip${activeWs === w.id ? " on" : ""}`}
              onClick={() => setActiveWs(w.id)}
            >
              <span className="av" style={{ background: w.c }}>
                {w.ab}
              </span>
              {w.n}
            </button>
          ))}
        </div>
      ) : null}

      {showForm ? (
        <form
          onSubmit={onSaveOutcome}
          className="card-box ixf"
          style={{ padding: 18, marginBottom: 16 }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 className="sec-title">Record bid outcome</h2>
              <p className="sub">
                {isTrial
                  ? "Saved to your organization’s backend and shared with everyone in your workspace."
                  : "Adds an outcome to this demo session."}
              </p>
            </div>
            <button
              type="button"
              className="btn ghost sm"
              onClick={() => setShowForm(false)}
              aria-label="Close"
            >
              <FiX aria-hidden />
            </button>
          </div>
          <div className="ixr">
            <label>
              Bid / pursuit name *
              <input
                className="sel"
                required
                placeholder="e.g. Statewide Broadband Grant"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </label>
            <label>
              Buyer / funder *
              <input
                className="sel"
                required
                placeholder="e.g. Dept. of Commerce"
                value={form.buyer}
                onChange={(e) => setForm((f) => ({ ...f, buyer: e.target.value }))}
              />
            </label>
            <label>
              Sector
              <select
                className="sel"
                value={form.sector}
                onChange={(e) => setForm((f) => ({ ...f, sector: e.target.value }))}
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="ixr">
            <label>
              Result
              <select
                className="sel"
                value={form.result}
                onChange={(e) => setForm((f) => ({ ...f, result: e.target.value }))}
              >
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </label>
            <label>
              Deal value ($)
              <input
                className="sel"
                type="number"
                min={0}
                step={1000}
                placeholder="250000"
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
              />
            </label>
            <label>
              Primary reason
              <input
                className="sel"
                placeholder={form.result === "won" ? "e.g. Technical approach" : "e.g. Price"}
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
              />
            </label>
            <label>
              Competitor (optional)
              <input
                className="sel"
                placeholder="e.g. GovSoft"
                value={form.competitor}
                onChange={(e) => setForm((f) => ({ ...f, competitor: e.target.value }))}
              />
            </label>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <button type="submit" className="btn primary">
              Save outcome
            </button>
            <button type="button" className="btn ghost" onClick={() => setShowForm(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {aiAnalysis ? (
        <section className="card-box" style={{ padding: 16, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h2 className="sec-title">Sage AI · Win/loss patterns</h2>
            <button type="button" className="btn ghost sm" onClick={() => setAiAnalysis("")}>
              Dismiss
            </button>
          </div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 13.5, lineHeight: 1.55 }}>{aiAnalysis}</div>
        </section>
      ) : null}

      <div className="kpis">
        <div className="card-box kpi">
          <small>Win rate</small>
          <strong className="tnum">{wr}%</strong>
          <em>
            {won.length} won · {lost.length} lost
          </em>
        </div>
        <div className="card-box kpi">
          <small>Value won</small>
          <strong className="tnum">{fmtK(wonVal)}</strong>
          <em>of {fmtK(totalVal)} bid</em>
        </div>
        <div className="card-box kpi">
          <small>Average win</small>
          <strong className="tnum">{fmtK(avgWin)}</strong>
          <em>Per awarded bid</em>
        </div>
        <div className="card-box kpi">
          <small>Top loss reason</small>
          <strong className="tnum" style={{ fontSize: 18 }}>
            {topLossReason}
          </strong>
          <em>{lost.length} losses analyzed</em>
        </div>
      </div>

      <div className="grid2">
        <section className="card-box">
          <div className="panel-h">
            <div>
              <h2 className="sec-title">Win rate by sector</h2>
            </div>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <RateBars rows={rate((h) => h.sector)} />
          </div>
        </section>

        <section className="card-box">
          <div className="panel-h">
            <div>
              <h2 className="sec-title">Win rate by deal size</h2>
            </div>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <RateBars rows={rate(bandOf)} />
          </div>
        </section>

        <section className="card-box">
          <div className="panel-h">
            <div>
              <h2 className="sec-title">Against competitors</h2>
              <p className="sub">Our win rate when each competitor bid</p>
            </div>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <RateBars
              rows={rate((h) => h.competitor).filter((r) => r.k && r.k !== "—")}
              emptyText="No competitor data recorded yet."
            />
          </div>
        </section>

        <section className="card-box">
          <div className="panel-h">
            <div>
              <h2 className="sec-title">Why we lose</h2>
            </div>
          </div>
          <div style={{ padding: "14px 16px" }}>
            {lost.length ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: donutSVG(
                    Object.entries(reasons).map(([l, v], i) => ({
                      l,
                      v,
                      c: RC[i % RC.length],
                    })),
                    String(lost.length),
                    "losses",
                  ),
                }}
              />
            ) : (
              <p className="sub" style={{ textAlign: "center", padding: "24px 12px" }}>
                No losses recorded yet.
              </p>
            )}
          </div>
        </section>

        <section className="card-box">
          <div className="panel-h">
            <div>
              <h2 className="sec-title">Win rate by buyer</h2>
            </div>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <RateBars
              rows={rate((h) => String(h.buyer || "").replace(/\s*\(sample\)/i, ""))
                .sort((x, y) => y.n - x.n || y.r - x.r)
                .slice(0, 8)}
            />
          </div>
        </section>

        <section className="card-box">
          <div className="panel-h">
            <div>
              <h2 className="sec-title">Answers that appear most in wins</h2>
              <p className="sub">From the content library</p>
            </div>
          </div>
          {topLibrary.length ? (
            topLibrary.map((l) => (
              <div key={l.id} className="ins" style={{ alignItems: "center" }}>
                <span className="mono sub" style={{ fontSize: 11, width: 36 }}>
                  [{l.id}]
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b>{l.title}</b>
                  <p>
                    {(isTrial ? curWS.n : WSM[l.ws]?.n || curWS.n)} · used {l.uses}×
                  </p>
                </div>
                <span className="pill ok">{l.wins} wins</span>
              </div>
            ))
          ) : (
            <p className="sub" style={{ textAlign: "center", padding: "28px 16px" }}>
              No library answers linked to wins yet.
            </p>
          )}
        </section>
      </div>

      <div className="two" style={{ marginTop: 16 }}>
        <section className="card-box">
          <div className="panel-h">
            <div>
              <h2 className="sec-title">Leaderboard · people</h2>
              <p className="sub">
                Sections delivered on time, answers reused in wins, review turnaround and wins supported
              </p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="btab" style={{ minWidth: 560 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Contributor</th>
                  <th className="r">On-time sections</th>
                  <th className="r">Reused in wins</th>
                  <th className="r">Review turnaround</th>
                  <th className="r">Wins supported</th>
                  <th className="r">Score</th>
                </tr>
              </thead>
              <tbody>
                {peopleLeaderboard.map((r, i) => (
                  <tr key={r.id}>
                    <td>
                      <span className={`rank r${i}`}>{i + 1}</span>
                    </td>
                    <td>
                      <span className="av" style={{ background: r.color, marginRight: 6 }}>
                        {r.initials}
                      </span>
                      {r.name}
                    </td>
                    <td className="r mono">{r.ot}</td>
                    <td className="r mono">{r.reuse}</td>
                    <td className="r mono">{r.t != null ? `${r.t} days` : "—"}</td>
                    <td className="r mono">{r.ws}</td>
                    <td className="r">
                      <b className="mono">{r.score}</b>
                    </td>
                  </tr>
                ))}
                {!peopleLeaderboard.length ? (
                  <tr>
                    <td colSpan={7} className="sub" style={{ textAlign: "center", padding: 20 }}>
                      No contributor activity yet. Record outcomes as your team submits bids.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <section className="card-box">
          <div className="panel-h">
            <div>
              <h2 className="sec-title">Leaderboard · teams</h2>
              <p className="sub">Wins by workspace</p>
            </div>
          </div>
          {teamLeaderboard.map((t, i) => (
            <div
              key={t.w.id}
              className="hs-row"
              style={{ padding: "10px 16px", gridTemplateColumns: "28px 170px minmax(0,1fr) 50px" }}
            >
              <span className={`rank r${i}`}>{i + 1}</span>
              <span className="hs-l">
                <span className="wsdot" style={{ background: t.w.c }} />
                {t.w.n}
              </span>
              <div className="hs-bar">
                <i
                  style={{
                    width: `${teamLeaderboard[0]?.won ? (t.won / teamLeaderboard[0].won) * 100 : 0}%`,
                    background: t.w.c,
                  }}
                />
              </div>
              <b className="tnum" style={{ textAlign: "right" }}>
                {t.won}
              </b>
            </div>
          ))}
        </section>
      </div>

      {toast ? <div className="toast">{toast}</div> : null}
    </div>
  );
}
