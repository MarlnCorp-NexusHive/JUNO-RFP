import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCalendar,
  FiCheckCircle,
  FiCheckSquare,
  FiClipboard,
  FiFileText,
  FiFlag,
  FiShield,
  FiSquare,
  FiTarget,
  FiX,
} from "react-icons/fi";
import {
  cancelGrantPursuit,
  getGrantPursuit,
  healGrantPursuitPlan,
  listGrantPursuits,
  subscribePursuit,
  togglePlanItem,
} from "../services/grantPursuitStore.js";

const SECTIONS = [
  { key: "milestones", icon: FiFlag, labelKey: "milestones" },
  { key: "deliverables", icon: FiFileText, labelKey: "deliverables" },
  { key: "complianceChecks", icon: FiShield, labelKey: "complianceChecks" },
  { key: "trackables", icon: FiClipboard, labelKey: "trackables" },
];

function truncateLabel(text, max = 72) {
  const s = String(text || "").trim();
  if (!s) return "";
  if (s.length <= max) return s;
  return `${s.slice(0, max - 1)}…`;
}

function PlanSection({ title, Icon, items, onToggle, emptyLabel }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        <Icon className="h-3.5 w-3.5 shrink-0 text-indigo-500" aria-hidden />
        <span className="min-w-0 truncate">{title}</span>
        <span className="ms-auto shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {items.filter((i) => i.done).length}/{items.length}
        </span>
      </h3>
      {!items.length ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id} className="min-w-0">
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={`flex w-full min-w-0 items-start gap-2 rounded-lg px-2 py-1.5 text-start text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                  item.done ? "opacity-70" : ""
                }`}
              >
                {item.done ? (
                  <FiCheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <FiSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                )}
                <span className="min-w-0 flex-1 overflow-hidden">
                  <span
                    className={`block break-words font-medium text-slate-900 dark:text-white ${
                      item.done ? "line-through decoration-slate-400" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.dueDate ? (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <FiCalendar className="h-3 w-3 shrink-0" aria-hidden />
                      {item.dueDate}
                    </span>
                  ) : null}
                  {item.detail ? (
                    <span className="mt-0.5 block break-words text-xs text-slate-500 dark:text-slate-400">
                      {item.detail}
                    </span>
                  ) : null}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Workspace panel: Milestones / Deliverables / Compliance Checks / Trackables for a started grant pursuit.
 */
export default function GrantPursuitPlanPanel({
  selectedKey = "",
  onSelectKey,
}) {
  const { t } = useTranslation("common");
  const tt = (key, opts) => t(`proposalManagerWorkspace.grantPursuitPlan.${key}`, opts);

  const panelRef = useRef(null);
  const [pursuits, setPursuits] = useState(() => listGrantPursuits());
  const [activeKey, setActiveKey] = useState(selectedKey || "");

  const refreshPursuits = () => {
    const list = listGrantPursuits();
    list.forEach((p) => healGrantPursuitPlan(p.briefKey));
    if (selectedKey) healGrantPursuitPlan(selectedKey);
    setPursuits(listGrantPursuits());
    return list;
  };

  useEffect(() => {
    refreshPursuits();
    return subscribePursuit(() => setPursuits(listGrantPursuits()));
  }, []);

  useEffect(() => {
    if (selectedKey) {
      setActiveKey(selectedKey);
      refreshPursuits();
      // Bring plan into view after Start pursuit navigation.
      requestAnimationFrame(() => {
        panelRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
      });
    }
  }, [selectedKey]);

  useEffect(() => {
    if (!activeKey && pursuits.length) {
      setActiveKey(pursuits[0].briefKey);
      onSelectKey?.(pursuits[0].briefKey);
    }
  }, [activeKey, pursuits, onSelectKey]);

  const active = useMemo(() => {
    if (!activeKey) return null;
    return getGrantPursuit(activeKey) || pursuits.find((p) => p.briefKey === activeKey) || null;
  }, [activeKey, pursuits]);

  const plan = active?.plan || {
    milestones: [],
    deliverables: [],
    complianceChecks: [],
    trackables: [],
  };

  const handleSelect = (key) => {
    setActiveKey(key);
    onSelectKey?.(key);
  };

  const handleToggle = (category, itemId) => {
    if (!activeKey) return;
    togglePlanItem(activeKey, category, itemId);
    setPursuits(listGrantPursuits());
  };

  const handleCancel = (briefKey, e) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();
    if (!briefKey) return;
    if (!window.confirm(tt("cancelConfirm"))) return;
    cancelGrantPursuit(briefKey);
    const nextList = listGrantPursuits();
    setPursuits(nextList);
    if (activeKey === briefKey) {
      const nextKey = nextList[0]?.briefKey || "";
      setActiveKey(nextKey);
      onSelectKey?.(nextKey);
    }
  };

  if (!pursuits.length && !active) {
    return (
      <div
        ref={panelRef}
        className="rounded-xl border border-dashed border-indigo-300/70 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-950/20"
      >
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <FiTarget className="h-5 w-5 text-indigo-600" aria-hidden />
          {tt("title")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{tt("emptyHint")}</p>
      </div>
    );
  }

  const selectable = pursuits.length
    ? pursuits
    : active
      ? [active]
      : [];

  return (
    <div
      ref={panelRef}
      className="min-w-0 overflow-hidden rounded-xl border border-indigo-200/80 bg-white p-4 shadow-sm dark:border-indigo-900/50 dark:bg-gray-800 md:p-5"
      data-tour="grant-pursuit-plan"
    >
      <div className="mb-4 flex min-w-0 flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <FiTarget className="h-5 w-5 shrink-0 text-indigo-600" aria-hidden />
            {tt("title")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">{tt("subtitle")}</p>
        </div>
        {active?.startedAt ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
            <FiCheckCircle className="h-3.5 w-3.5" aria-hidden />
            {tt("activeBadge")}
          </span>
        ) : null}
      </div>

      <div className="mb-4 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("selectLabel")}</span>
          {activeKey ? (
            <button
              type="button"
              onClick={(e) => handleCancel(activeKey, e)}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200 dark:hover:bg-red-950/70"
            >
              <FiX className="h-3.5 w-3.5" aria-hidden />
              {tt("cancelPursuit")}
            </button>
          ) : null}
        </div>
        <ul className="max-h-48 min-w-0 space-y-1 overflow-y-auto overflow-x-hidden rounded-lg border border-gray-200 bg-gray-50/80 p-1 dark:border-gray-600 dark:bg-gray-900/40">
          {selectable.map((p) => {
            const selected = p.briefKey === activeKey;
            const label = truncateLabel(p.title || p.briefKey);
            const source = p.source ? truncateLabel(p.source, 28) : "";
            return (
              <li key={p.briefKey} className="min-w-0">
                <div
                  className={`flex min-w-0 items-center gap-1 rounded-md ${
                    selected
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-900 hover:bg-gray-100 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleSelect(p.briefKey)}
                    title={p.title || p.briefKey}
                    className="min-w-0 flex-1 px-3 py-2 text-start text-sm"
                  >
                    <span className="block truncate font-medium">{label}</span>
                    {source ? (
                      <span
                        className={`mt-0.5 block truncate text-[11px] ${
                          selected ? "text-indigo-100" : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {source}
                      </span>
                    ) : null}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleCancel(p.briefKey, e)}
                    title={tt("cancelPursuit")}
                    aria-label={tt("cancelPursuit")}
                    className={`me-1 shrink-0 rounded-md p-1.5 transition ${
                      selected
                        ? "text-white/90 hover:bg-white/15"
                        : "text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                    }`}
                  >
                    <FiX className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {active ? (
        <>
          <div className="mb-3 flex min-w-0 flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span
              className="min-w-0 max-w-full truncate font-semibold text-slate-800 dark:text-slate-100"
              title={active.title}
            >
              {active.title}
            </span>
            {active.source ? (
              <span className="max-w-[12rem] truncate rounded-full bg-slate-100 px-2 py-0.5 font-medium dark:bg-slate-700">
                {active.source}
              </span>
            ) : null}
            <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
              {tt("docTypeGrants")}
            </span>
          </div>
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            {SECTIONS.map(({ key, icon: Icon, labelKey }) => (
              <PlanSection
                key={key}
                title={tt(labelKey)}
                Icon={Icon}
                items={Array.isArray(plan[key]) ? plan[key] : []}
                emptyLabel={tt("sectionEmpty")}
                onToggle={(itemId) => handleToggle(key, itemId)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
