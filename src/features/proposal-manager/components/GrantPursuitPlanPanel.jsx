import React, { useEffect, useMemo, useState } from "react";
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
} from "react-icons/fi";
import {
  getGrantPursuit,
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

function PlanSection({ title, Icon, items, onToggle, emptyLabel }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/60">
      <h3 className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 dark:text-slate-300">
        <Icon className="h-3.5 w-3.5 text-indigo-500" aria-hidden />
        {title}
        <span className="ms-auto rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {items.filter((i) => i.done).length}/{items.length}
        </span>
      </h3>
      {!items.length ? (
        <p className="text-xs text-slate-500 dark:text-slate-400">{emptyLabel}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onToggle(item.id)}
                className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-start text-sm transition hover:bg-slate-50 dark:hover:bg-slate-800/80 ${
                  item.done ? "opacity-70" : ""
                }`}
              >
                {item.done ? (
                  <FiCheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                ) : (
                  <FiSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                )}
                <span className="min-w-0 flex-1">
                  <span
                    className={`font-medium text-slate-900 dark:text-white ${
                      item.done ? "line-through decoration-slate-400" : ""
                    }`}
                  >
                    {item.label}
                  </span>
                  {item.dueDate ? (
                    <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <FiCalendar className="h-3 w-3" aria-hidden />
                      {item.dueDate}
                    </span>
                  ) : null}
                  {item.detail ? (
                    <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{item.detail}</span>
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

  const [pursuits, setPursuits] = useState(() => listGrantPursuits());
  const [activeKey, setActiveKey] = useState(selectedKey || "");

  useEffect(() => {
    setPursuits(listGrantPursuits());
    return subscribePursuit(() => setPursuits(listGrantPursuits()));
  }, []);

  useEffect(() => {
    if (selectedKey) setActiveKey(selectedKey);
  }, [selectedKey]);

  useEffect(() => {
    if (!activeKey && pursuits.length) {
      setActiveKey(pursuits[0].briefKey);
      onSelectKey?.(pursuits[0].briefKey);
    }
  }, [activeKey, pursuits, onSelectKey]);

  const active = useMemo(
    () => (activeKey ? getGrantPursuit(activeKey) : null) || pursuits.find((p) => p.briefKey === activeKey) || null,
    [activeKey, pursuits],
  );

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

  if (!pursuits.length) {
    return (
      <div className="rounded-xl border border-dashed border-indigo-300/70 bg-indigo-50/40 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 dark:text-white">
          <FiTarget className="h-5 w-5 text-indigo-600" aria-hidden />
          {tt("title")}
        </h2>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{tt("emptyHint")}</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border border-indigo-200/80 bg-white p-4 shadow-sm dark:border-indigo-900/50 dark:bg-gray-800 md:p-5"
      data-tour="grant-pursuit-plan"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
            <FiTarget className="h-5 w-5 text-indigo-600" aria-hidden />
            {tt("title")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">{tt("subtitle")}</p>
        </div>
        {active?.startedAt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
            <FiCheckCircle className="h-3.5 w-3.5" aria-hidden />
            {tt("activeBadge")}
          </span>
        ) : null}
      </div>

      <label className="mb-4 block space-y-1">
        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{tt("selectLabel")}</span>
        <select
          value={activeKey || ""}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
        >
          {pursuits.map((p) => (
            <option key={p.briefKey} value={p.briefKey}>
              {p.title || p.briefKey}
              {p.source ? ` · ${p.source}` : ""}
            </option>
          ))}
        </select>
      </label>

      {active ? (
        <>
          <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-100">{active.title}</span>
            {active.source ? (
              <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium dark:bg-slate-700">{active.source}</span>
            ) : null}
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
              {tt("docTypeGrants")}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
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
