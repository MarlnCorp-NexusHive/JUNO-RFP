import React, { useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { GRANARY_BTN_SECONDARY } from "../../../styles/granarySurfaces.js";

const MS_DAY = 86400000;

const STATUS_TONE = {
  backlog: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  todo: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  doing: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  review: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  done: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
};

export function parseDay(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function toIso(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function todayIso() {
  return toIso(new Date());
}

function addDays(date, n) {
  const next = new Date(date);
  next.setDate(next.getDate() + n);
  return next;
}

function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / MS_DAY);
}

function fmtDate(iso, opts = { month: "short", day: "numeric" }) {
  const d = parseDay(iso);
  return d ? d.toLocaleDateString(undefined, opts) : "—";
}

/** Month grid of project-workspace task due dates. */
export function ProjectTaskCalendarView({ tasks, onOpen, labels = {} }) {
  const tx = (key, fallback, params) => {
    let s = labels[key] || fallback;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        s = String(s).replace(`{{${k}}}`, String(v));
      });
    }
    return s;
  };

  const [cursor, setCursor] = useState(() => {
    const n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), 1);
  });
  const byDay = useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      if (!t.due) return;
      if (!map.has(t.due)) map.set(t.due, []);
      map.get(t.due).push(t);
    });
    return map;
  }, [tasks]);

  const gridStart = addDays(cursor, -cursor.getDay());
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  const today = todayIso();
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    addDays(gridStart, i).toLocaleDateString(undefined, { weekday: "short" }),
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {cursor.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </h3>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className={GRANARY_BTN_SECONDARY}
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
            aria-label={tx("prevMonth", "Previous month")}
          >
            <FiChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            className={GRANARY_BTN_SECONDARY}
            onClick={() => {
              const n = new Date();
              setCursor(new Date(n.getFullYear(), n.getMonth(), 1));
            }}
          >
            {tx("today", "Today")}
          </button>
          <button
            type="button"
            className={GRANARY_BTN_SECONDARY}
            onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
            aria-label={tx("nextMonth", "Next month")}
          >
            <FiChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      {tasks.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300">
          {tx("taskCalEmpty", "No project tasks with due dates yet. Create tasks in Project workspace to see them here.")}
        </p>
      ) : (
        <div className="overflow-x-auto">
          <div className="grid min-w-[44rem] grid-cols-7 overflow-hidden rounded-[10px] border border-[#D8E0EA] dark:border-[#2A3548]">
            {weekdays.map((w) => (
              <div
                key={w}
                className="border-b border-[#D8E0EA] bg-[#F4F6F9] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-[#2A3548] dark:bg-[#0B1017]"
              >
                {w}
              </div>
            ))}
            {cells.map((day) => {
              const iso = toIso(day);
              const inMonth = day.getMonth() === cursor.getMonth();
              const items = byDay.get(iso) || [];
              return (
                <div
                  key={iso}
                  className={`min-h-[5.5rem] border-b border-r border-[#D8E0EA]/70 p-1.5 dark:border-[#2A3548]/70 ${
                    inMonth ? "bg-white dark:bg-[#151D2A]" : "bg-[#F4F6F9]/60 dark:bg-[#0B1017]/60"
                  }`}
                >
                  <span
                    className={`inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[11px] font-semibold ${
                      iso === today
                        ? "bg-[#3D4F66] text-white dark:bg-[#8FA3B8] dark:text-[#0B1017]"
                        : inMonth
                          ? "text-slate-700 dark:text-slate-200"
                          : "text-slate-400"
                    }`}
                  >
                    {day.getDate()}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {items.slice(0, 3).map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => onOpen?.(t)}
                        title={t.title}
                        className={`block w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium ${STATUS_TONE[t.status] || STATUS_TONE.todo}`}
                      >
                        {t.title}
                      </button>
                    ))}
                    {items.length > 3 ? (
                      <p className="px-1 text-[10px] font-semibold text-slate-500">
                        {tx("moreCount", "+{{count}} more", { count: items.length - 3 })}
                      </p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Timeline / Gantt for project-workspace tasks. */
export function ProjectTaskGanttView({ tasks, color = "#4F6BFF", onOpen, labels = {} }) {
  const tx = (key, fallback) => labels[key] || fallback;

  const rows = useMemo(
    () =>
      tasks
        .map((t) => ({ t, s: parseDay(t.start || t.due), e: parseDay(t.due || t.start) }))
        .filter((r) => r.s && r.e)
        .sort((a, b) => a.s - b.s || a.e - b.e),
    [tasks],
  );

  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 dark:border-gray-600 dark:text-gray-300">
        {tx(
          "ganttEmpty",
          "Add tasks with start and due dates in Project workspace to see the timeline.",
        )}
      </p>
    );
  }

  const allStarts = rows.flatMap((r) => [r.s, parseDay(r.t.bStart)].filter(Boolean));
  const allEnds = rows.flatMap((r) => [r.e, parseDay(r.t.bDue)].filter(Boolean));
  const min = addDays(new Date(Math.min(...allStarts)), -2);
  const max = addDays(new Date(Math.max(...allEnds)), 2);
  const total = Math.max(1, diffDays(min, max) + 1);
  const pctAt = (d) => (diffDays(min, d) / total) * 100;
  const todayPct = pctAt(
    new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()),
  );

  const ticks = [];
  for (
    let d = new Date(min.getFullYear(), min.getMonth(), 1);
    d <= max;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  ) {
    if (d >= min) ticks.push(d);
  }

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[56rem]">
        <div className="flex border-b border-[#D8E0EA] dark:border-[#2A3548]">
          <div className="w-56 shrink-0 px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {tx("colTitle", "Title")}
          </div>
          <div className="relative h-7 flex-1">
            {ticks.map((d) => (
              <span
                key={d.getTime()}
                className="absolute top-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500"
                style={{ left: `${pctAt(d)}%` }}
              >
                {d.toLocaleDateString(undefined, { month: "short", year: "2-digit" })}
              </span>
            ))}
          </div>
        </div>
        {rows.map(({ t, s, e }) => {
          const left = pctAt(s);
          const width = Math.max(0.8, ((diffDays(s, e) + 1) / total) * 100);
          const bS = parseDay(t.bStart);
          const bE = parseDay(t.bDue);
          const slipped = bS && bE && (t.bStart !== t.start || t.bDue !== t.due);
          const barColor = t.color || color;
          return (
            <div
              key={t.id}
              className="flex items-center border-b border-[#D8E0EA]/70 dark:border-[#2A3548]/70"
            >
              <button
                type="button"
                onClick={() => onOpen?.(t)}
                className="w-56 shrink-0 truncate px-2 py-2 text-left text-sm text-slate-800 hover:underline dark:text-slate-100"
                title={t.title}
              >
                {t.title}
              </button>
              <div className="relative h-9 flex-1">
                {ticks.map((d) => (
                  <span
                    key={d.getTime()}
                    className="absolute inset-y-0 w-px bg-[#D8E0EA]/70 dark:bg-[#2A3548]/70"
                    style={{ left: `${pctAt(d)}%` }}
                  />
                ))}
                <span
                  className="absolute inset-y-0 w-px bg-red-500/70"
                  style={{ left: `${todayPct}%` }}
                  aria-hidden
                />
                {slipped ? (
                  <span
                    className="absolute bottom-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"
                    style={{
                      left: `${pctAt(bS)}%`,
                      width: `${Math.max(0.8, ((diffDays(bS, bE) + 1) / total) * 100)}%`,
                    }}
                    title={tx("baseline", "Baseline")}
                  />
                ) : null}
                {t.ms ? (
                  <span
                    className="absolute top-2.5 h-3.5 w-3.5 rotate-45 rounded-sm"
                    style={{ left: `calc(${pctAt(e)}% - 7px)`, backgroundColor: barColor }}
                    title={`${t.title} · ${fmtDate(t.due)}`}
                  />
                ) : (
                  <span
                    className="absolute top-2 h-4 rounded"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: barColor,
                      opacity: t.status === "done" ? 0.4 : 0.9,
                    }}
                    title={`${fmtDate(t.start)} → ${fmtDate(t.due)}`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
