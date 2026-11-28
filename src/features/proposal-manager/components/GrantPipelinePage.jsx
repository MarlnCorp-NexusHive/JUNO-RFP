import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiPlus, FiTrash2 } from "react-icons/fi";
import { parseLocalStorageJson } from "../../../utils/safeStorage.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import { isTrialUserSession } from "../../rfp-collaboration/useTrialCollabT.js";
import { DEMO_PW_PEOPLE } from "../data/projectWorkspaceDemoData.js";
import { formatUsdCompact, formatUsdFull } from "../services/grantPulse.js";
import { addProject } from "../services/projectWorkspaceStore.js";
import {
  PIPELINE_STAGES,
  STAGE_BY_ID,
  addOpportunity,
  getDemoGrantPipeline,
  getGrantPipelineData,
  hydrateGrantPipelineFromServer,
  normalizeOpportunity,
  removeOpportunity,
  subscribeGrantPipeline,
  updateOpportunity,
} from "../services/grantPipelineStore.js";
import {
  GRANARY_BTN_PRIMARY,
  GRANARY_BTN_SECONDARY,
  GRANARY_CARD,
  GRANARY_CARD_SOFT,
  GRANARY_INPUT,
  GRANARY_PANEL,
} from "../../../styles/granarySurfaces.js";

function isDemoProposalManagerSession() {
  if (isTrialUserSession()) return false;
  const user = parseLocalStorageJson("rbac_current_user");
  const username = String(user?.username || "").toLowerCase();
  const role = String(user?.role || "").toLowerCase();
  const team = String(user?.team || "").toLowerCase();
  return (
    username === "proposal_manager" ||
    role === "proposal manager" ||
    team === "proposal team"
  );
}

function currentUserName() {
  const session = getTrialSession();
  const user = parseLocalStorageJson("rbac_current_user");
  return String(
    session?.user?.name || user?.name || user?.displayName || user?.username || "",
  ).trim();
}

function initialsOf(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysIso(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diffFromToday(iso) {
  if (!iso) return 0;
  const [y, m, day] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !day) return 0;
  const target = new Date(y, m - 1, day);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86400000);
}

function fmtShortDate(iso) {
  if (!iso) return "—";
  const [y, m, day] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !day) return "—";
  return new Date(y, m - 1, day).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function GrantPipelinePage() {
  const navigate = useNavigate();
  const demoMode = isDemoProposalManagerSession();
  const myName = useMemo(() => currentUserName(), []);
  const defaultOwner = demoMode ? "ana" : myName || "Me";

  const [trialItems, setTrialItems] = useState(() =>
    demoMode ? [] : getGrantPipelineData().items,
  );
  const [demoItems, setDemoItems] = useState(() =>
    demoMode ? getDemoGrantPipeline() : [],
  );
  const [hydrating, setHydrating] = useState(!demoMode);
  const [dragOverStage, setDragOverStage] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  // Add form state
  const [name, setName] = useState("");
  const [funder, setFunder] = useState("");
  const [req, setReq] = useState("");
  const [owner, setOwner] = useState(defaultOwner);
  const [due, setDue] = useState(() => addDaysIso(30));
  const [fit, setFit] = useState("80");
  const [stage, setStage] = useState("research");

  useEffect(() => {
    if (demoMode) return undefined;
    let cancelled = false;
    (async () => {
      setHydrating(true);
      await hydrateGrantPipelineFromServer();
      if (!cancelled) {
        setTrialItems(getGrantPipelineData().items);
        setHydrating(false);
      }
    })();
    const unsub = subscribeGrantPipeline((next) => setTrialItems(next.items));
    return () => {
      cancelled = true;
      unsub();
    };
  }, [demoMode]);

  const items = demoMode ? demoItems : trialItems;

  const personFor = useCallback(
    (key) => {
      if (!key) return null;
      if (demoMode && DEMO_PW_PEOPLE[key]) {
        return DEMO_PW_PEOPLE[key];
      }
      return { n: key, i: initialsOf(key), c: "#3D4F66" };
    },
    [demoMode],
  );

  const actions = useMemo(() => {
    if (demoMode) {
      return {
        add: (input) => {
          const item = normalizeOpportunity({ ...input, id: `demo-gp-${Date.now().toString(36)}` });
          setDemoItems((prev) => [item, ...prev]);
          return item;
        },
        update: (id, patch) => {
          setDemoItems((prev) =>
            prev.map((x) => (x.id === id ? normalizeOpportunity({ ...x, ...patch, id: x.id }) : x)),
          );
        },
        remove: (id) => {
          setDemoItems((prev) => prev.filter((x) => x.id !== id));
        },
      };
    }
    return {
      add: (input) => addOpportunity(input).created,
      update: updateOpportunity,
      remove: removeOpportunity,
    };
  }, [demoMode]);

  const moveStage = (id, nextStage) => {
    const target = items.find((x) => x.id === id);
    if (!target || target.stage === nextStage) return;
    const patch = { stage: nextStage };
    if (nextStage === "awarded" && target.awd == null && target.req > 0) {
      patch.awd = target.req;
    }
    actions.update(id, patch);
  };

  const handleCreateProjectFromAward = (item) => {
    if (!demoMode && !item.pid) {
      const created = addProject({
        name: item.name,
        funder: item.funder,
        kind: "Award",
        amount: item.awd || item.req || 0,
        start: todayIso(),
        end: addDaysIso(365),
        pm: myName || "Me",
      }).created;
      if (created?.id) {
        actions.update(item.id, { pid: created.id });
      }
    }
    navigate("/app/project-workspace");
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    actions.add({
      name: name.trim(),
      funder: funder.trim(),
      req: Number(req) || 0,
      awd: stage === "awarded" ? Number(req) || 0 : null,
      owner: owner.trim() || defaultOwner,
      due: due || addDaysIso(30),
      fit: Number(fit) || 75,
      stage,
    });
    setName("");
    setFunder("");
    setReq("");
    setDue(addDaysIso(30));
    setFit("80");
    setStage("research");
    setShowAdd(false);
  };

  // KPI calculations (matching prototype)
  const openItems = useMemo(
    () => items.filter((g) => g.stage !== "awarded" && g.stage !== "declined"),
    [items],
  );
  const openValue = useMemo(
    () => openItems.reduce((sum, g) => sum + (g.req || 0), 0),
    [openItems],
  );
  const weightedValue = useMemo(
    () => openItems.reduce((sum, g) => sum + (g.req || 0) * (STAGE_BY_ID[g.stage]?.prob || 0), 0),
    [openItems],
  );
  const awardedItems = useMemo(() => items.filter((g) => g.stage === "awarded"), [items]);
  const declinedItems = useMemo(() => items.filter((g) => g.stage === "declined"), [items]);
  const winRate =
    awardedItems.length + declinedItems.length
      ? Math.round((awardedItems.length / (awardedItems.length + declinedItems.length)) * 100)
      : 0;
  const requestedWon = useMemo(
    () => awardedItems.reduce((sum, g) => sum + (g.req || 0), 0),
    [awardedItems],
  );
  const awardedTotal = useMemo(
    () => awardedItems.reduce((sum, g) => sum + (g.awd || 0), 0),
    [awardedItems],
  );
  const awardedPct = requestedWon ? Math.round((awardedTotal / requestedWon) * 100) : 0;

  const byFunder = useMemo(() => {
    const map = {};
    items
      .filter((g) => g.stage !== "declined")
      .forEach((g) => {
        const key = (g.funder || "Unspecified funder")
          .replace(/\s*\(sample\)/i, "")
          .split(/[,(]/)[0]
          .trim();
        map[key] = (map[key] || 0) + (g.awd || g.req || 0);
      });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);
  }, [items]);

  const maxFunderAmt = byFunder[0]?.[1] || 1;
  const maxWonAmt = Math.max(
    1,
    ...awardedItems.map((g) => Math.max(g.req || 0, g.awd || 0)),
  );

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            Grant pipeline
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Every opportunity from researching to awarded, with owners, amounts, and dates.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {demoMode ? (
            <span className="inline-flex rounded-full bg-[#D8E0EA] px-2.5 py-1 text-[11px] font-semibold text-[#3D4F66] ring-1 ring-[#3D4F66]/20 dark:bg-[#2A3548] dark:text-[#B8C5D6] dark:ring-[#8FA3B8]/30">
              Demo data
            </span>
          ) : null}
          <button
            type="button"
            className={GRANARY_BTN_PRIMARY}
            onClick={() => setShowAdd((v) => !v)}
          >
            <FiPlus className="h-4 w-4" aria-hidden />
            Add opportunity
          </button>
          <Link to="/app/project-workspace" className={GRANARY_BTN_SECONDARY}>
            Open project workspace
          </Link>
        </div>
      </header>

      {hydrating ? <p className="text-sm text-slate-500">Loading…</p> : null}

      {showAdd ? (
        <form
          onSubmit={handleAddSubmit}
          className={`${GRANARY_PANEL} grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6`}
        >
          <label className="space-y-1 lg:col-span-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Opportunity</span>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Grant or RFP name"
              className={GRANARY_INPUT}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Funder</span>
            <input
              type="text"
              value={funder}
              onChange={(e) => setFunder(e.target.value)}
              placeholder="Agency or foundation"
              className={GRANARY_INPUT}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Requested ($)</span>
            <input
              type="number"
              min={0}
              value={req}
              onChange={(e) => setReq(e.target.value)}
              placeholder="250000"
              className={GRANARY_INPUT}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Stage</span>
            <select value={stage} onChange={(e) => setStage(e.target.value)} className={GRANARY_INPUT}>
              {PIPELINE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Deadline</span>
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className={GRANARY_INPUT}
            />
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Owner</span>
            {demoMode ? (
              <select value={owner} onChange={(e) => setOwner(e.target.value)} className={GRANARY_INPUT}>
                {Object.entries(DEMO_PW_PEOPLE).map(([k, p]) => (
                  <option key={k} value={k}>{p.n}</option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="Owner name"
                className={GRANARY_INPUT}
              />
            )}
          </label>
          <label className="space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Fit score (0–100)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={fit}
              onChange={(e) => setFit(e.target.value)}
              className={GRANARY_INPUT}
            />
          </label>
          <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
            <button type="submit" className={GRANARY_BTN_PRIMARY}>Save</button>
            <button type="button" className={GRANARY_BTN_SECONDARY} onClick={() => setShowAdd(false)}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {/* KPI Strip */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className={`${GRANARY_CARD} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Open pipeline</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {formatUsdCompact(openValue)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{openItems.length} opportunities</p>
        </div>
        <div className={`${GRANARY_CARD} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weighted value</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {formatUsdCompact(weightedValue)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">By stage probability</p>
        </div>
        <div className={`${GRANARY_CARD} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Win rate</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {winRate}%
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {awardedItems.length} won · {declinedItems.length} declined
          </p>
        </div>
        <div className={`${GRANARY_CARD} p-4`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Awarded vs. requested</p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
            {formatUsdCompact(awardedTotal)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            of {formatUsdCompact(requestedWon)} requested ({awardedPct}%)
          </p>
        </div>
      </section>

      {/* 6-Stage Pipeline Board */}
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        {PIPELINE_STAGES.map((st) => {
          const col = items
            .filter((g) => g.stage === st.id)
            .sort((a, b) => String(a.due || "").localeCompare(String(b.due || "")));
          const sum = col.reduce((acc, g) => acc + (g.awd || g.req || 0), 0);
          return (
            <div
              key={st.id}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStage(st.id);
              }}
              onDragLeave={() => setDragOverStage("")}
              onDrop={(e) => {
                e.preventDefault();
                setDragOverStage("");
                const id = e.dataTransfer.getData("text/plain");
                if (id) moveStage(id, st.id);
              }}
              className={`${GRANARY_CARD_SOFT} flex min-h-[14rem] flex-col gap-2.5 p-2.5 ${
                dragOverStage === st.id ? "ring-2 ring-[#3D4F66]/40" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-1 border-b border-[#D8E0EA] pb-2 dark:border-[#2A3548]">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: st.color }}
                    aria-hidden
                  />
                  <h2 className="truncate text-xs font-bold text-slate-900 dark:text-white">
                    {st.label}
                  </h2>
                </div>
                <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">
                  {col.length} · {formatUsdCompact(sum)}
                </span>
              </div>

              {col.length === 0 ? (
                <p className="py-6 text-center text-xs text-slate-400">
                  Drop an opportunity here
                </p>
              ) : (
                col.map((g) => {
                  const person = personFor(g.owner);
                  const d = diffFromToday(g.due);
                  const dateLabel =
                    st.id === "awarded"
                      ? `Awarded ${fmtShortDate(g.due)}`
                      : st.id === "declined"
                        ? `Decided ${fmtShortDate(g.due)}`
                        : d < 0
                          ? `Submitted ${fmtShortDate(g.due)}`
                          : `Due ${fmtShortDate(g.due)} · ${d}d`;
                  return (
                    <article
                      key={g.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", g.id)}
                      className={`${GRANARY_CARD} space-y-2 p-2.5 cursor-grab active:cursor-grabbing`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <p className="text-xs font-semibold leading-snug text-slate-900 dark:text-white">
                          {g.name}
                        </p>
                        <button
                          type="button"
                          onClick={() => actions.remove(g.id)}
                          aria-label={`Remove ${g.name}`}
                          className="shrink-0 rounded p-0.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                        >
                          <FiTrash2 className="h-3 w-3" aria-hidden />
                        </button>
                      </div>
                      <p className="truncate text-[11px] text-slate-500">{g.funder || "—"}</p>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                          {g.awd
                            ? `${formatUsdCompact(g.awd)} awarded`
                            : g.req
                              ? `${formatUsdCompact(g.req)} req.`
                              : "Amount not set"}
                        </span>
                        {person ? (
                          <span
                            title={person.n}
                            className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold text-white"
                            style={{ backgroundColor: person.c }}
                          >
                            {person.i}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-1 text-[11px]">
                        <span className="text-slate-500">{dateLabel}</span>
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-semibold tabular-nums text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          Fit {g.fit}
                        </span>
                      </div>

                      <select
                        value={g.stage}
                        onChange={(e) => moveStage(g.id, e.target.value)}
                        aria-label={`Stage for ${g.name}`}
                        className="w-full rounded-md border border-[#D8E0EA] bg-white px-1.5 py-1 text-[11px] text-slate-700 dark:border-[#2A3548] dark:bg-[#0B1017] dark:text-slate-200"
                      >
                        {PIPELINE_STAGES.map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>

                      {g.pid ? (
                        <Link
                          to="/app/project-workspace"
                          className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-[#D8E0EA] px-2 py-1 text-[11px] font-semibold text-[#3D4F66] hover:bg-[#F0F3F7] dark:border-[#2A3548] dark:text-[#B8C5D6] dark:hover:bg-[#151D2A]"
                        >
                          Open project
                          <FiArrowRight className="h-3 w-3" aria-hidden />
                        </Link>
                      ) : st.id === "awarded" ? (
                        <button
                          type="button"
                          onClick={() => handleCreateProjectFromAward(g)}
                          className="inline-flex w-full items-center justify-center gap-1 rounded-md bg-[#3D4F66] px-2 py-1 text-[11px] font-semibold text-white hover:bg-[#2F3E52] dark:bg-[#8FA3B8] dark:text-[#0B1017]"
                        >
                          Create project from award
                        </button>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>
          );
        })}
      </section>

      {/* Bottom Summary Panels */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className={`${GRANARY_PANEL} space-y-3`}>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Requested vs. awarded
            </h2>
            <p className="text-xs text-slate-500">Won opportunities</p>
          </div>
          {awardedItems.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No awarded opportunities yet.
            </p>
          ) : (
            <div className="space-y-3">
              {awardedItems.map((g) => (
                <div key={g.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">{g.name}</span>
                    <span className="shrink-0 tabular-nums text-slate-500">
                      {formatUsdFull(g.awd || 0)} / {formatUsdFull(g.req || 0)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-slate-400"
                        style={{ width: `${Math.round(((g.req || 0) / maxWonAmt) * 100)}%` }}
                      />
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${Math.round(((g.awd || 0) / maxWonAmt) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`${GRANARY_PANEL} space-y-3`}>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              Pipeline by funder
            </h2>
            <p className="text-xs text-slate-500">Awarded or requested amount, excluding declined</p>
          </div>
          {byFunder.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              Add opportunities to see funding by agency or foundation.
            </p>
          ) : (
            <div className="space-y-2.5">
              {byFunder.map(([funderName, amount]) => (
                <div key={funderName} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="truncate font-medium text-slate-800 dark:text-slate-200">
                      {funderName}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                      {formatUsdCompact(amount)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-[#3D4F66] dark:bg-[#8FA3B8]"
                      style={{ width: `${Math.round((amount / maxFunderAmt) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
