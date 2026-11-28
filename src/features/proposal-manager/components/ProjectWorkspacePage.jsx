import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiBarChart2,
  FiCalendar,
  FiCheckSquare,
  FiChevronLeft,
  FiChevronRight,
  FiColumns,
  FiFlag,
  FiFolder,
  FiLink,
  FiList,
  FiPlus,
  FiSend,
  FiTrash2,
  FiX,
} from "react-icons/fi";
import { parseLocalStorageJson } from "../../../utils/safeStorage.js";
import { getTrialSession } from "../../../services/trialAuthSession.js";
import { isTrialUserSession } from "../../rfp-collaboration/useTrialCollabT.js";
import {
  DEMO_PW_PEOPLE,
  getDemoProjects,
  getDemoTasks,
  getDemoUpdates,
} from "../data/projectWorkspaceDemoData.js";
import { formatUsdCompact, formatUsdFull } from "../services/grantPulse.js";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  addProject,
  addTask,
  addUpdate,
  ensureProjectWorkspaceFresh,
  getProjectWorkspaceData,
  hydrateProjectWorkspaceFromServer,
  newWorkspaceId,
  normalizeProject,
  normalizeTask,
  normalizeUpdate,
  removeProject,
  removeTask,
  subscribeProjectWorkspace,
  updateManyTasks,
  updateProject,
  updateTask,
} from "../services/projectWorkspaceStore.js";
import {
  GRANARY_BTN_PRIMARY,
  GRANARY_BTN_SECONDARY,
  GRANARY_CARD,
  GRANARY_CARD_SOFT,
  GRANARY_CHIP,
  GRANARY_INPUT,
  GRANARY_PANEL,
} from "../../../styles/granarySurfaces.js";

/* ───────── Session helpers (same detection as AwardManagementPage) ───────── */

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

/* ───────── Constants / pure helpers ───────── */

const DEMO_ME = "ana";
const PROJECT_COLORS = ["#4F6BFF", "#8B5CF6", "#F59E0B", "#10B981", "#EC4899", "#0EA5E9", "#14B8A6"];

const STATUS_DEFAULTS = {
  backlog: "Backlog",
  todo: "To do",
  doing: "In progress",
  review: "In review",
  done: "Done",
};
const PRIORITY_DEFAULTS = { low: "Low", med: "Medium", high: "High", urgent: "Urgent" };
const STATUS_ORDER = Object.fromEntries(TASK_STATUSES.map((status, index) => [status, index]));
const PRIORITY_ORDER = { urgent: 0, high: 1, med: 2, low: 3 };
const BOARD_WIP_LIMITS = { doing: 6, review: 4 };
const CLAUSE_OPTIONS = ["—", "§4.2", "§4.3", "§5.2", "§6.1", "§7.4", "§8.2", "NOFO"];
const BUDGET_LINE_OPTIONS = ["—", "Personnel", "Fringe benefits", "Travel", "Supplies", "Contractual", "Other direct", "Indirect"];
const RAG_DEFAULTS = { g: "On track", y: "Watch", r: "At risk" };

const STATUS_TONE = {
  backlog: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  todo: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  doing: "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  review: "bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-100",
  done: "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
};
const PRIORITY_TONE = {
  low: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  med: "bg-sky-50 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  high: "bg-orange-50 text-orange-900 dark:bg-orange-950/40 dark:text-orange-100",
  urgent: "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-200",
};
const RAG_TONE = {
  g: { dot: "bg-emerald-500", chip: "bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800" },
  y: { dot: "bg-amber-500", chip: "bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:ring-amber-800" },
  r: { dot: "bg-red-600", chip: "bg-red-50 text-red-800 ring-red-200 dark:bg-red-950/40 dark:text-red-200 dark:ring-red-800" },
};

const MS_DAY = 86400000;

function parseDay(iso) {
  if (!iso) return null;
  const [y, m, d] = String(iso).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toIso(date) {
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

function shiftIso(iso, days) {
  const date = parseDay(iso);
  if (!date || !days) return iso || "";
  return toIso(addDays(date, days));
}

function withCurrentOption(options, value) {
  if (!value || options.includes(value)) return options;
  return [...options, value];
}

function diffDays(a, b) {
  return Math.round((b.getTime() - a.getTime()) / MS_DAY);
}

function fmtDate(iso, opts = { month: "short", day: "numeric" }) {
  const d = parseDay(iso);
  return d ? d.toLocaleDateString(undefined, opts) : "—";
}

function fmtCommentDate(d) {
  if (typeof d === "number") return fmtDate(toIso(addDays(new Date(), d)));
  return fmtDate(d);
}

function timePct(project, now = new Date()) {
  const s = parseDay(project.start);
  const e = parseDay(project.end);
  if (!s || !e || e <= s) return 0;
  const pct = ((now.getTime() - s.getTime()) / (e.getTime() - s.getTime())) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

function projectTotal(project) {
  if (project.kind === "Proposal") return project.budget || project.amount || 0;
  return project.amount || project.budget || 0;
}

function initialsOf(name) {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function isOverdue(task) {
  return task.status !== "done" && task.due && task.due < todayIso();
}

function latestUpdateFor(updates, projectId) {
  return updates
    .filter((u) => u.p === projectId)
    .sort((a, b) => String(b.d).localeCompare(String(a.d)))[0];
}

/* ───────── Small presentational pieces ───────── */

function Avatar({ person, size = "h-6 w-6" }) {
  if (!person) return null;
  return (
    <span
      title={person.n}
      className={`inline-flex ${size} shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white`}
      style={{ backgroundColor: person.c }}
    >
      {person.i}
    </span>
  );
}

function Bar({ label, pct, className }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[10px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </span>
      <div className="h-1.5 min-w-[4rem] flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div className={`h-full rounded-full ${className}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="w-9 shrink-0 text-right text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
        {pct}%
      </span>
    </div>
  );
}

function RagChip({ rag, label }) {
  const tone = RAG_TONE[rag] || RAG_TONE.g;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ${tone.chip}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} aria-hidden />
      {label}
    </span>
  );
}

function ModalShell({ title, onClose, closeLabel, children, wide = false }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" role="dialog" aria-modal>
      <div className={`${GRANARY_CARD} w-full ${wide ? "max-w-xl" : "max-w-md"} max-h-[90vh] space-y-4 overflow-y-auto p-5`}>
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={closeLabel}
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
      {children}
    </label>
  );
}

/* ───────── Create project modal ───────── */

function CreateProjectModal({ tx, onClose, onSave, defaultColor }) {
  const [name, setName] = useState("");
  const [funder, setFunder] = useState("");
  const [kind, setKind] = useState("Award");
  const [money, setMoney] = useState("");
  const [start, setStart] = useState(todayIso());
  const [end, setEnd] = useState("");

  return (
    <ModalShell
      title={tx("createTitle", "Create project")}
      onClose={onClose}
      closeLabel={tx("close", "Close")}
    >
      <Field label={tx("fieldName", "Project name")}>
        <input value={name} onChange={(e) => setName(e.target.value)} className={GRANARY_INPUT} autoFocus />
      </Field>
      <Field label={tx("fieldFunder", "Funder")}>
        <input value={funder} onChange={(e) => setFunder(e.target.value)} className={GRANARY_INPUT} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tx("fieldKind", "Type")}>
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={GRANARY_INPUT}>
            <option value="Award">{tx("kindAward", "Award")}</option>
            <option value="Proposal">{tx("kindProposal", "Proposal")}</option>
          </select>
        </Field>
        <Field
          label={
            kind === "Proposal"
              ? tx("fieldBudget", "Prep budget (USD)")
              : tx("fieldAmount", "Award amount (USD)")
          }
        >
          <input
            type="number"
            min={0}
            value={money}
            onChange={(e) => setMoney(e.target.value)}
            className={GRANARY_INPUT}
          />
        </Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label={tx("fieldStart", "Start date")}>
          <input type="date" value={start} onChange={(e) => setStart(e.target.value)} className={GRANARY_INPUT} />
        </Field>
        <Field label={tx("fieldEnd", "End date")}>
          <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className={GRANARY_INPUT} />
        </Field>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className={GRANARY_BTN_SECONDARY} onClick={onClose}>
          {tx("cancel", "Cancel")}
        </button>
        <button
          type="button"
          className={GRANARY_BTN_PRIMARY}
          disabled={!name.trim()}
          onClick={() =>
            onSave({
              name: name.trim(),
              funder: funder.trim(),
              kind,
              amount: kind === "Award" ? Number(money) || 0 : 0,
              budget: kind === "Proposal" ? Number(money) || 0 : 0,
              start,
              end,
              color: defaultColor,
            })
          }
        >
          {tx("create", "Create")}
        </button>
      </div>
    </ModalShell>
  );
}

/* ───────── Task drawer (create / edit) ───────── */

function TaskDrawer({ tx, task, isNew, projectTasks, people, demoMode, ownerOptions, meKey, onClose, onSave, onDelete }) {
  const [form, setForm] = useState(() => ({
    ...task,
    sub: task.sub.map((s) => ({ ...s })),
    comments: task.comments.map((c) => ({ ...c })),
    deps: [...task.deps],
  }));
  const [newSub, setNewSub] = useState("");
  const [newComment, setNewComment] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const depChoices = projectTasks.filter((t) => t.id !== task.id && !form.deps.includes(t.id));
  const personName = (key) => people[key]?.n || key;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40" role="dialog" aria-modal>
      <div className="flex h-full w-full max-w-lg flex-col border-l border-[#D8E0EA] bg-white shadow-xl dark:border-[#2A3548] dark:bg-[#151D2A]">
        <div className="flex items-start justify-between gap-3 border-b border-[#D8E0EA] px-5 py-4 dark:border-[#2A3548]">
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {isNew ? tx("newTask", "New task") : tx("editTask", "Edit task")}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label={tx("close", "Close")}
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <Field label={tx("colTitle", "Title")}>
            <input value={form.title} onChange={(e) => set({ title: e.target.value })} className={GRANARY_INPUT} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tx("colStatus", "Status")}>
              <select value={form.status} onChange={(e) => set({ status: e.target.value })} className={GRANARY_INPUT}>
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>{tx(`statuses.${s}`, STATUS_DEFAULTS[s])}</option>
                ))}
              </select>
            </Field>
            <Field label={tx("colPriority", "Priority")}>
              <select value={form.pri} onChange={(e) => set({ pri: e.target.value })} className={GRANARY_INPUT}>
                {TASK_PRIORITIES.map((p) => (
                  <option key={p} value={p}>{tx(`priorities.${p}`, PRIORITY_DEFAULTS[p])}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label={tx("colOwner", "Owner")}>
            {demoMode ? (
              <select value={form.owner} onChange={(e) => set({ owner: e.target.value })} className={GRANARY_INPUT}>
                <option value="">{tx("unassigned", "Unassigned")}</option>
                {Object.entries(people).map(([key, p]) => (
                  <option key={key} value={key}>{p.n}</option>
                ))}
              </select>
            ) : (
              <>
                <input
                  list="pw-owner-options"
                  value={form.owner}
                  onChange={(e) => set({ owner: e.target.value })}
                  placeholder={tx("ownerPlaceholder", "Name")}
                  className={GRANARY_INPUT}
                />
                <datalist id="pw-owner-options">
                  {ownerOptions.map((o) => (<option key={o} value={o} />))}
                </datalist>
              </>
            )}
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label={tx("colStart", "Start")}>
              <input type="date" value={form.start} onChange={(e) => set({ start: e.target.value })} className={GRANARY_INPUT} />
            </Field>
            <Field label={tx("colDue", "Due")}>
              <input type="date" value={form.due} onChange={(e) => set({ due: e.target.value })} className={GRANARY_INPUT} />
            </Field>
            <Field label={tx("colEst", "Est. hrs")}>
              <input
                type="number"
                min={0}
                value={form.est || ""}
                onChange={(e) => set({ est: Number(e.target.value) || 0 })}
                className={GRANARY_INPUT}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tx("fieldClause", "Clause")}>
              <input value={form.clause} onChange={(e) => set({ clause: e.target.value })} className={GRANARY_INPUT} />
            </Field>
            <Field label={tx("fieldBudgetLine", "Budget line")}>
              <input value={form.line} onChange={(e) => set({ line: e.target.value })} className={GRANARY_INPUT} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              checked={Boolean(form.ms)}
              onChange={(e) => set({ ms: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-[#3D4F66] focus:ring-[#3D4F66]"
            />
            {tx("fieldMilestone", "Milestone")}
          </label>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx("fieldDeps", "Depends on")}</p>
            <div className="flex flex-wrap gap-1.5">
              {form.deps.map((id) => {
                const dep = projectTasks.find((t) => t.id === id);
                return (
                  <span key={id} className={`${GRANARY_CHIP} normal-case tracking-normal`}>
                    {dep?.title || id}
                    <button
                      type="button"
                      className="ml-1 text-slate-500 hover:text-red-600"
                      onClick={() => set({ deps: form.deps.filter((d) => d !== id) })}
                      aria-label={tx("remove", "Remove")}
                    >
                      <FiX className="h-3 w-3" />
                    </button>
                  </span>
                );
              })}
            </div>
            {depChoices.length > 0 ? (
              <select
                value=""
                onChange={(e) => e.target.value && set({ deps: [...form.deps, e.target.value] })}
                className={GRANARY_INPUT}
              >
                <option value="">{tx("addDependency", "Add dependency…")}</option>
                {depChoices.map((t) => (<option key={t.id} value={t.id}>{t.title}</option>))}
              </select>
            ) : null}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx("fieldSubtasks", "Subtasks")}</p>
            <ul className="space-y-1">
              {form.sub.map((s, i) => (
                <li key={`${s.t}-${i}`} className="flex items-center gap-2 text-sm text-slate-800 dark:text-slate-100">
                  <input
                    type="checkbox"
                    checked={s.d}
                    onChange={(e) =>
                      set({ sub: form.sub.map((x, j) => (j === i ? { ...x, d: e.target.checked } : x)) })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-[#3D4F66] focus:ring-[#3D4F66]"
                  />
                  <span className={s.d ? "flex-1 line-through opacity-60" : "flex-1"}>{s.t}</span>
                  <button
                    type="button"
                    className="text-slate-400 hover:text-red-600"
                    onClick={() => set({ sub: form.sub.filter((_, j) => j !== i) })}
                    aria-label={tx("remove", "Remove")}
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={newSub}
                onChange={(e) => setNewSub(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newSub.trim()) {
                    set({ sub: [...form.sub, { t: newSub.trim(), d: false }] });
                    setNewSub("");
                  }
                }}
                placeholder={tx("addSubtask", "Add subtask")}
                className={GRANARY_INPUT}
              />
              <button
                type="button"
                className={GRANARY_BTN_SECONDARY}
                disabled={!newSub.trim()}
                onClick={() => {
                  set({ sub: [...form.sub, { t: newSub.trim(), d: false }] });
                  setNewSub("");
                }}
              >
                <FiPlus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{tx("fieldComments", "Comments")}</p>
            <ul className="space-y-2">
              {form.comments.map((c, i) => (
                <li key={`${c.x}-${i}`} className={`${GRANARY_CARD_SOFT} p-2.5 text-sm`}>
                  <p className="text-[11px] font-semibold text-slate-500">
                    {personName(c.w)} · {fmtCommentDate(c.d)}
                  </p>
                  <p className="text-slate-800 dark:text-slate-100">{c.x}</p>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={tx("addComment", "Add a comment")}
                className={GRANARY_INPUT}
              />
              <button
                type="button"
                className={GRANARY_BTN_SECONDARY}
                disabled={!newComment.trim()}
                onClick={() => {
                  set({ comments: [...form.comments, { w: meKey, x: newComment.trim(), d: todayIso() }] });
                  setNewComment("");
                }}
              >
                <FiSend className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 border-t border-[#D8E0EA] px-5 py-3 dark:border-[#2A3548]">
          {!isNew ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
              onClick={() => onDelete(task.id)}
            >
              <FiTrash2 className="h-4 w-4" aria-hidden />
              {tx("delete", "Delete")}
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" className={GRANARY_BTN_SECONDARY} onClick={onClose}>
              {tx("cancel", "Cancel")}
            </button>
            <button
              type="button"
              className={GRANARY_BTN_PRIMARY}
              disabled={!form.title.trim()}
              onClick={() => onSave(form)}
            >
              {tx("save", "Save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Work views ───────── */

function BoardView({
  tx,
  tasks,
  lookupTasks,
  people,
  demoMode,
  ownerOptions,
  onOpen,
  onAdd,
  onQuickAdd,
  onMove,
}) {
  const [dragOver, setDragOver] = useState("");
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [priFilter, setPriFilter] = useState("");
  const [addingCol, setAddingCol] = useState("");
  const [draftTitle, setDraftTitle] = useState("");

  const byId = useMemo(() => {
    const map = new Map();
    (lookupTasks || tasks).forEach((task) => map.set(task.id, task));
    return map;
  }, [lookupTasks, tasks]);

  const owners = useMemo(() => {
    if (demoMode) return Object.entries(DEMO_PW_PEOPLE).map(([id, person]) => ({ id, label: person.n }));
    const names = new Set(ownerOptions);
    tasks.forEach((task) => {
      if (task.owner) names.add(task.owner);
    });
    return [...names].filter(Boolean).map((id) => ({ id, label: people(id)?.n || id }));
  }, [demoMode, ownerOptions, tasks, people]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((task) => {
      if (ownerFilter && task.owner !== ownerFilter) return false;
      if (priFilter && task.pri !== priFilter) return false;
      if (!q) return true;
      const ownerName = people(task.owner)?.n || task.owner || "";
      return `${task.title} ${task.clause} ${task.line} ${ownerName}`.toLowerCase().includes(q);
    });
  }, [tasks, query, ownerFilter, priFilter, people]);

  const commitQuickAdd = (status) => {
    const title = draftTitle.trim();
    if (title) {
      onQuickAdd(status, title);
    }
    setDraftTitle("");
    setAddingCol("");
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tx("filterTasks", "Filter tasks")}
          aria-label={tx("filterTasks", "Filter tasks")}
          className="min-w-[12rem] flex-1 rounded-md border border-[#D8E0EA] bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-[#3D4F66] dark:border-[#2A3548] dark:bg-[#0B1017] dark:text-white"
        />
        <select
          value={ownerFilter}
          onChange={(e) => setOwnerFilter(e.target.value)}
          aria-label={tx("filterOwner", "Filter by owner")}
          className="rounded-md border border-[#D8E0EA] bg-white px-2 py-1.5 text-sm dark:border-[#2A3548] dark:bg-[#0B1017] dark:text-white"
        >
          <option value="">{tx("allPeople", "All people")}</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>{owner.label}</option>
          ))}
        </select>
        <select
          value={priFilter}
          onChange={(e) => setPriFilter(e.target.value)}
          aria-label={tx("filterPriority", "Filter by priority")}
          className="rounded-md border border-[#D8E0EA] bg-white px-2 py-1.5 text-sm dark:border-[#2A3548] dark:bg-[#0B1017] dark:text-white"
        >
          <option value="">{tx("anyPriority", "Any priority")}</option>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>{tx(`priorities.${priority}`, PRIORITY_DEFAULTS[priority])}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        {TASK_STATUSES.map((status) => {
          const col = visible
            .filter((t) => t.status === status)
            .sort((a, b) => {
              const pa = PRIORITY_ORDER[a.pri] ?? 2;
              const pb = PRIORITY_ORDER[b.pri] ?? 2;
              if (pa !== pb) return pa - pb;
              return String(a.due || "9999").localeCompare(String(b.due || "9999"));
            });
          const wipLimit = BOARD_WIP_LIMITS[status];
          const overWip = Boolean(wipLimit && col.length > wipLimit);
          return (
            <div
              key={status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(status);
              }}
              onDragLeave={() => setDragOver("")}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver("");
                const id = e.dataTransfer.getData("text/plain");
                if (id) onMove(id, status);
              }}
              className={`${GRANARY_CARD_SOFT} flex min-h-[12rem] flex-col gap-2 p-2.5 ${
                dragOver === status ? "ring-2 ring-[#3D4F66]/30" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-1 px-1">
                <div className="flex items-center gap-1.5">
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[status]}`}>
                    {tx(`statuses.${status}`, STATUS_DEFAULTS[status])}
                  </span>
                  <span className="text-[11px] font-semibold tabular-nums text-slate-500">{col.length}</span>
                </div>
                {wipLimit ? (
                  <span className={`text-[10px] font-semibold tabular-nums ${overWip ? "text-red-600" : "text-slate-400"}`}>
                    WIP {col.length}/{wipLimit}
                  </span>
                ) : null}
              </div>

              {col.map((task) => {
                const subTotal = task.sub.length;
                const subDone = task.sub.filter((s) => s.d).length;
                const subPct = subTotal ? Math.round((subDone / subTotal) * 100) : null;
                const blockerCount =
                  task.status === "done"
                    ? 0
                    : (task.deps || []).filter((id) => {
                        const dep = byId.get(id);
                        return dep && dep.status !== "done";
                      }).length;
                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                    onClick={() => onOpen(task)}
                    className={`${GRANARY_CARD} cursor-pointer space-y-2 p-2.5 transition hover:border-[#3D4F66]/40`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                      <span className={`rounded px-1.5 py-0.5 font-semibold ${PRIORITY_TONE[task.pri]}`}>
                        {tx(`priorities.${task.pri}`, PRIORITY_DEFAULTS[task.pri])}
                      </span>
                      {task.clause && task.clause !== "—" ? (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {task.clause}
                        </span>
                      ) : null}
                    </div>

                    <p className="flex items-start gap-1 text-sm font-medium leading-snug text-slate-900 dark:text-white">
                      {task.ms ? <FiFlag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden /> : null}
                      <span>{task.title}</span>
                    </p>

                    {blockerCount > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
                        <FiLink className="h-3 w-3" aria-hidden />
                        {tx("blockedBy", "Blocked by {{count}}", { count: blockerCount })}
                      </span>
                    ) : null}

                    <div className="flex flex-wrap items-center gap-2 text-[11px]">
                      {task.due ? (
                        <span className={isOverdue(task) ? "font-semibold text-red-600" : "text-slate-500"}>
                          {fmtDate(task.due)}
                        </span>
                      ) : null}
                      {subPct !== null ? (
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <span className="h-1.5 w-10 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <span className="block h-full bg-emerald-500" style={{ width: `${subPct}%` }} />
                          </span>
                          <span className="tabular-nums">{subPct}%</span>
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      {people(task.owner) ? <Avatar person={people(task.owner)} /> : <span />}
                      <select
                        value={task.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onMove(task.id, e.target.value)}
                        aria-label={tx("colStatus", "Status")}
                        className="rounded-md border border-[#D8E0EA] bg-white px-1 py-0.5 text-[11px] text-slate-600 dark:border-[#2A3548] dark:bg-[#0B1017] dark:text-slate-300"
                      >
                        {TASK_STATUSES.map((s) => (
                          <option key={s} value={s}>{tx(`statuses.${s}`, STATUS_DEFAULTS[s])}</option>
                        ))}
                      </select>
                    </div>
                  </article>
                );
              })}

              {addingCol === status ? (
                <input
                  type="text"
                  autoFocus
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  onBlur={() => commitQuickAdd(status)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      commitQuickAdd(status);
                    } else if (e.key === "Escape") {
                      setDraftTitle("");
                      setAddingCol("");
                    }
                  }}
                  placeholder={tx("quickTaskPlaceholder", "Task name, then Enter")}
                  aria-label={tx("quickTaskLabel", "New task name")}
                  className="mt-auto w-full rounded-md border border-[#3D4F66] bg-white px-2 py-1.5 text-xs text-slate-900 outline-none dark:border-[#8FA3B8] dark:bg-[#0B1017] dark:text-white"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAddingCol(status);
                    setDraftTitle("");
                  }}
                  onDoubleClick={() => onAdd(status)}
                  className="mt-auto inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-[#3D4F66] hover:bg-white dark:text-[#B8C5D6] dark:hover:bg-[#151D2A]"
                >
                  <FiPlus className="h-3.5 w-3.5" aria-hidden />
                  {tx("addTask", "Add task")}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CellInput({ value, onCommit, type = "text", className = "", ...rest }) {
  return (
    <input
      key={String(value)}
      type={type}
      defaultValue={value}
      onBlur={(e) => {
        if (e.target.value !== String(value)) onCommit(e.target.value);
      }}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
      className={`w-full rounded border border-transparent bg-transparent px-1.5 py-1 text-sm text-slate-900 outline-none hover:border-[#D8E0EA] focus:border-[#3D4F66] focus:bg-white dark:text-white dark:hover:border-[#2A3548] dark:focus:bg-[#0B1017] ${className}`}
      {...rest}
    />
  );
}

function TaskListView({ tx, tasks, lookupTasks, people, demoMode, ownerOptions, onOpen, onPatch, onPatchMany, onAdd }) {
  const selectCls =
    "w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-1 text-sm text-slate-900 outline-none hover:border-[#D8E0EA] focus:border-[#3D4F66] dark:text-white dark:hover:border-[#2A3548] dark:[&>option]:bg-[#151D2A]";
  const [sortKey, setSortKey] = useState("due");
  const [sortDir, setSortDir] = useState(1);
  const [query, setQuery] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  const [priFilter, setPriFilter] = useState("");
  const [groupByStatus, setGroupByStatus] = useState(false);
  const [selected, setSelected] = useState(() => new Set());

  const byId = useMemo(() => {
    const map = new Map();
    (lookupTasks || tasks).forEach((task) => map.set(task.id, task));
    return map;
  }, [lookupTasks, tasks]);

  const owners = useMemo(() => {
    if (demoMode) return Object.entries(DEMO_PW_PEOPLE).map(([id, person]) => ({ id, label: person.n }));
    const names = new Set(ownerOptions);
    tasks.forEach((task) => {
      if (task.owner) names.add(task.owner);
    });
    return [...names].filter(Boolean).map((id) => ({ id, label: people(id)?.n || id }));
  }, [demoMode, ownerOptions, tasks, people]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = tasks.filter((task) => {
      if (ownerFilter && task.owner !== ownerFilter) return false;
      if (priFilter && task.pri !== priFilter) return false;
      if (!q) return true;
      const ownerName = people(task.owner)?.n || task.owner || "";
      return `${task.title} ${task.clause} ${task.line} ${ownerName}`.toLowerCase().includes(q);
    });
    const valueOf = (task) => {
      if (sortKey === "status") return STATUS_ORDER[task.status] ?? 0;
      if (sortKey === "pri") return PRIORITY_ORDER[task.pri] ?? 0;
      if (sortKey === "owner") return (people(task.owner)?.n || task.owner || "").toLowerCase();
      if (sortKey === "est") return Number(task.est) || 0;
      if (sortKey === "title") return task.title.toLowerCase();
      return String(task[sortKey] || "");
    };
    return [...filtered].sort((a, b) => {
      const left = valueOf(a);
      const right = valueOf(b);
      if (left < right) return -1 * sortDir;
      if (left > right) return 1 * sortDir;
      return 0;
    });
  }, [tasks, query, ownerFilter, priFilter, sortKey, sortDir, people]);

  useEffect(() => {
    const ids = new Set(tasks.map((task) => task.id));
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => ids.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [tasks]);

  const hours = visible.reduce((sum, task) => sum + (Number(task.est) || 0), 0);
  const allChecked = visible.length > 0 && visible.every((task) => selected.has(task.id));

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir((dir) => -dir);
    else {
      setSortKey(key);
      setSortDir(1);
    }
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allChecked) visible.forEach((task) => next.delete(task.id));
      else visible.forEach((task) => next.add(task.id));
      return next;
    });
  };

  const selectedIds = [...selected];

  const columns = [
    ["title", tx("colTitle", "Task")],
    ["status", tx("colStatus", "Status")],
    ["owner", tx("colOwner", "Owner")],
    ["pri", tx("colPriority", "Priority")],
    ["start", tx("colStart", "Start")],
    ["due", tx("colDue", "Due")],
    ["est", tx("colEst", "Est. h")],
    ["clause", tx("colClause", "Clause")],
    ["line", tx("colLine", "Budget line")],
  ];

  const renderRow = (task) => {
    const blocked = task.status !== "done" && (task.deps || []).some((id) => {
      const dep = byId.get(id);
      return dep && dep.status !== "done";
    });
    const person = people(task.owner);
    return (
      <tr
        key={task.id}
        className={`border-b border-[#D8E0EA]/80 dark:border-[#2A3548]/80 ${selected.has(task.id) ? "bg-[#F4F6F9] dark:bg-[#0B1017]" : ""}`}
      >
        <td className="px-2 py-1">
          <input
            type="checkbox"
            checked={selected.has(task.id)}
            onChange={() => toggleOne(task.id)}
            aria-label={tx("selectTask", "Select {{title}}", { title: task.title })}
          />
        </td>
        <td className="min-w-[14rem] px-1 py-1">
          <div className="flex items-center gap-1.5">
            {task.ms ? <FiFlag className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden /> : null}
            <button
              type="button"
              onClick={() => onOpen(task)}
              className="truncate text-left text-sm font-medium text-slate-900 hover:underline dark:text-white"
            >
              {task.title}
            </button>
            {blocked ? <FiLink className="h-3.5 w-3.5 shrink-0 text-red-600" title={tx("blocked", "Blocked")} aria-label={tx("blocked", "Blocked")} /> : null}
          </div>
        </td>
        <td className="px-1 py-1">
          <select value={task.status} onChange={(e) => onPatch(task.id, { status: e.target.value })} className={selectCls} aria-label={tx("colStatus", "Status")}>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>{tx(`statuses.${status}`, STATUS_DEFAULTS[status])}</option>
            ))}
          </select>
        </td>
        <td className="min-w-[9rem] px-1 py-1">
          <div className="flex items-center gap-1">
            {person ? <Avatar person={person} /> : null}
            {demoMode || owners.length ? (
              <select value={task.owner} onChange={(e) => onPatch(task.id, { owner: e.target.value })} className={selectCls} aria-label={tx("colOwner", "Owner")}>
                <option value="">{tx("unassigned", "Unassigned")}</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>{owner.label}</option>
                ))}
              </select>
            ) : (
              <CellInput value={task.owner} onCommit={(value) => onPatch(task.id, { owner: value })} />
            )}
          </div>
        </td>
        <td className="px-1 py-1">
          <select value={task.pri} onChange={(e) => onPatch(task.id, { pri: e.target.value })} className={selectCls} aria-label={tx("colPriority", "Priority")}>
            {TASK_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>{tx(`priorities.${priority}`, PRIORITY_DEFAULTS[priority])}</option>
            ))}
          </select>
        </td>
        <td className="px-1 py-1">
          <CellInput type="date" value={task.start} onCommit={(value) => onPatch(task.id, { start: value })} aria-label={tx("colStart", "Start")} />
        </td>
        <td className="px-1 py-1">
          <CellInput
            type="date"
            value={task.due}
            onCommit={(value) => onPatch(task.id, { due: value })}
            className={isOverdue(task) ? "font-semibold !text-red-600" : ""}
            aria-label={tx("colDue", "Due")}
          />
        </td>
        <td className="w-20 px-1 py-1">
          <CellInput type="number" min={0} value={task.est} onCommit={(value) => onPatch(task.id, { est: Number(value) || 0 })} aria-label={tx("colEst", "Est. h")} />
        </td>
        <td className="px-1 py-1">
          <select value={task.clause || "—"} onChange={(e) => onPatch(task.id, { clause: e.target.value })} className={selectCls} aria-label={tx("colClause", "Clause")}>
            {withCurrentOption(CLAUSE_OPTIONS, task.clause).map((clause) => (
              <option key={clause} value={clause}>{clause}</option>
            ))}
          </select>
        </td>
        <td className="min-w-[8rem] px-1 py-1">
          <select value={task.line || "—"} onChange={(e) => onPatch(task.id, { line: e.target.value })} className={selectCls} aria-label={tx("colLine", "Budget line")}>
            {withCurrentOption(BUDGET_LINE_OPTIONS, task.line).map((line) => (
              <option key={line} value={line}>{line}</option>
            ))}
          </select>
        </td>
      </tr>
    );
  };

  const groups = groupByStatus
    ? TASK_STATUSES.map((status) => ({
        status,
        rows: visible.filter((task) => task.status === status),
      })).filter((group) => group.rows.length)
    : [{ status: "", rows: visible }];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tx("filterTasks", "Filter tasks")}
          aria-label={tx("filterTasks", "Filter tasks")}
          className="min-w-[12rem] flex-1 rounded-md border border-[#D8E0EA] bg-white px-2.5 py-1.5 text-sm text-slate-900 outline-none focus:border-[#3D4F66] dark:border-[#2A3548] dark:bg-[#0B1017] dark:text-white"
        />
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} aria-label={tx("filterOwner", "Filter by owner")} className="rounded-md border border-[#D8E0EA] bg-white px-2 py-1.5 text-sm dark:border-[#2A3548] dark:bg-[#0B1017] dark:text-white">
          <option value="">{tx("allPeople", "All people")}</option>
          {owners.map((owner) => (
            <option key={owner.id} value={owner.id}>{owner.label}</option>
          ))}
        </select>
        <select value={priFilter} onChange={(e) => setPriFilter(e.target.value)} aria-label={tx("filterPriority", "Filter by priority")} className="rounded-md border border-[#D8E0EA] bg-white px-2 py-1.5 text-sm dark:border-[#2A3548] dark:bg-[#0B1017] dark:text-white">
          <option value="">{tx("anyPriority", "Any priority")}</option>
          {TASK_PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>{tx(`priorities.${priority}`, PRIORITY_DEFAULTS[priority])}</option>
          ))}
        </select>
        <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
          <input type="checkbox" checked={groupByStatus} onChange={(e) => setGroupByStatus(e.target.checked)} />
          {tx("groupByStatus", "Group by status")}
        </label>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[72rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#D8E0EA] text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-[#2A3548] dark:text-slate-400">
              <th className="w-9 px-2 py-2">
                <input type="checkbox" checked={allChecked} onChange={toggleAll} aria-label={tx("selectAll", "Select all")} />
              </th>
              {columns.map(([key, label]) => (
                <th key={key} className="px-1.5 py-2">
                  <button type="button" onClick={() => toggleSort(key)} className="inline-flex items-center gap-1 uppercase tracking-wide hover:text-slate-800 dark:hover:text-white">
                    {label}
                    {sortKey === key ? (sortDir > 0 ? " ↑" : " ↓") : ""}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <React.Fragment key={group.status || "all"}>
                {group.status ? (
                  <tr className="bg-[#F4F6F9] dark:bg-[#0B1017]">
                    <td colSpan={columns.length + 1} className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                      <span className={`mr-2 rounded-md px-2 py-0.5 ${STATUS_TONE[group.status]}`}>
                        {tx(`statuses.${group.status}`, STATUS_DEFAULTS[group.status])}
                      </span>
                      {group.rows.length} · {group.rows.reduce((sum, task) => sum + (Number(task.est) || 0), 0)} h
                    </td>
                  </tr>
                ) : null}
                {group.rows.map(renderRow)}
              </React.Fragment>
            ))}
            {visible.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-3 py-8 text-center text-sm text-slate-500">
                  {tasks.length
                    ? tx("noTaskMatch", "No tasks match these filters.")
                    : tx("noTasks", "No tasks yet. Add one to start the list.")}
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={GRANARY_BTN_SECONDARY} onClick={() => onAdd("todo")}>
          <FiPlus className="h-4 w-4" aria-hidden />
          {tx("addTask", "Add task")}
        </button>
        <span className="ml-auto text-xs font-medium tabular-nums text-slate-500">
          {tx("taskSummary", "{{count}} tasks · {{hours}} estimated hours", {
            count: visible.length,
            hours: Math.round(hours * 10) / 10,
          })}
        </span>
      </div>

      {selectedIds.length ? (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#D8E0EA] bg-[#3D4F66] px-3 py-2 text-white dark:border-[#2A3548]" role="toolbar" aria-label={tx("bulkActions", "Bulk actions")}>
          <span className="text-sm font-semibold">{tx("selectedCount", "{{count}} selected", { count: selectedIds.length })}</span>
          <select
            defaultValue=""
            aria-label={tx("setStatus", "Set status")}
            onChange={(e) => {
              if (!e.target.value) return;
              onPatchMany(selectedIds, { status: e.target.value });
              e.target.value = "";
            }}
            className="rounded-md border border-white/30 bg-white px-2 py-1 text-sm text-slate-900"
          >
            <option value="">{tx("setStatus", "Set status…")}</option>
            {TASK_STATUSES.map((status) => (
              <option key={status} value={status}>{tx(`statuses.${status}`, STATUS_DEFAULTS[status])}</option>
            ))}
          </select>
          <select
            defaultValue=""
            aria-label={tx("assignTo", "Assign to")}
            onChange={(e) => {
              if (!e.target.value) return;
              onPatchMany(selectedIds, { owner: e.target.value });
              e.target.value = "";
            }}
            className="rounded-md border border-white/30 bg-white px-2 py-1 text-sm text-slate-900"
          >
            <option value="">{tx("assignTo", "Assign to…")}</option>
            {owners.map((owner) => (
              <option key={owner.id} value={owner.id}>{owner.label}</option>
            ))}
          </select>
          <select
            defaultValue=""
            aria-label={tx("shiftDates", "Shift dates")}
            onChange={(e) => {
              const days = Number(e.target.value);
              if (!days) return;
              onPatchMany(selectedIds, (task) => ({
                start: shiftIso(task.start, days),
                due: shiftIso(task.due, days),
              }));
              e.target.value = "";
            }}
            className="rounded-md border border-white/30 bg-white px-2 py-1 text-sm text-slate-900"
          >
            <option value="">{tx("shiftDates", "Shift dates…")}</option>
            <option value="1">{tx("shiftDay", "+1 day")}</option>
            <option value="7">{tx("shiftWeek", "+1 week")}</option>
            <option value="-1">{tx("shiftBackDay", "−1 day")}</option>
            <option value="-7">{tx("shiftBackWeek", "−1 week")}</option>
          </select>
          <button type="button" onClick={() => setSelected(new Set())} className="rounded-md border border-white/30 px-2 py-1 text-sm font-semibold">
            {tx("clearSelection", "Clear")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

function CalendarView({ tx, tasks, onOpen }) {
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
      <div className="overflow-x-auto">
        <div className="grid min-w-[44rem] grid-cols-7 overflow-hidden rounded-[10px] border border-[#D8E0EA] dark:border-[#2A3548]">
          {weekdays.map((w) => (
            <div key={w} className="border-b border-[#D8E0EA] bg-[#F4F6F9] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-[#2A3548] dark:bg-[#0B1017]">
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
                      onClick={() => onOpen(t)}
                      title={t.title}
                      className={`block w-full truncate rounded px-1 py-0.5 text-left text-[11px] font-medium ${STATUS_TONE[t.status]}`}
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
    </div>
  );
}

function GanttView({ tx, tasks, color, onOpen }) {
  const rows = useMemo(
    () =>
      tasks
        .map((t) => ({ t, s: parseDay(t.start || t.due), e: parseDay(t.due || t.start) }))
        .filter((r) => r.s && r.e)
        .sort((a, b) => a.s - b.s || a.e - b.e),
    [tasks],
  );

  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-slate-500">{tx("ganttEmpty", "Add tasks with start and due dates to see the timeline.")}</p>;
  }

  const allStarts = rows.flatMap((r) => [r.s, parseDay(r.t.bStart)].filter(Boolean));
  const allEnds = rows.flatMap((r) => [r.e, parseDay(r.t.bDue)].filter(Boolean));
  const min = addDays(new Date(Math.min(...allStarts)), -2);
  const max = addDays(new Date(Math.max(...allEnds)), 2);
  const total = Math.max(1, diffDays(min, max) + 1);
  const pctAt = (d) => (diffDays(min, d) / total) * 100;
  const todayPct = pctAt(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()));

  const ticks = [];
  for (let d = new Date(min.getFullYear(), min.getMonth(), 1); d <= max; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
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
          return (
            <div key={t.id} className="flex items-center border-b border-[#D8E0EA]/70 dark:border-[#2A3548]/70">
              <button
                type="button"
                onClick={() => onOpen(t)}
                className="w-56 shrink-0 truncate px-2 py-2 text-left text-sm text-slate-800 hover:underline dark:text-slate-100"
                title={t.title}
              >
                {t.title}
              </button>
              <div className="relative h-9 flex-1">
                {ticks.map((d) => (
                  <span key={d.getTime()} className="absolute inset-y-0 w-px bg-[#D8E0EA]/70 dark:bg-[#2A3548]/70" style={{ left: `${pctAt(d)}%` }} />
                ))}
                <span className="absolute inset-y-0 w-px bg-red-500/70" style={{ left: `${todayPct}%` }} aria-hidden />
                {slipped ? (
                  <span
                    className="absolute bottom-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600"
                    style={{ left: `${pctAt(bS)}%`, width: `${Math.max(0.8, ((diffDays(bS, bE) + 1) / total) * 100)}%` }}
                    title={tx("baseline", "Baseline")}
                  />
                ) : null}
                {t.ms ? (
                  <span
                    className="absolute top-2.5 h-3.5 w-3.5 rotate-45 rounded-sm"
                    style={{ left: `calc(${pctAt(e)}% - 7px)`, backgroundColor: color }}
                    title={`${t.title} · ${fmtDate(t.due)}`}
                  />
                ) : (
                  <span
                    className="absolute top-2 h-4 rounded"
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: color,
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

/* ───────── Project tabs ───────── */

function OverviewTab({ tx, project, tasks, updates, people, onOpenTask }) {
  const latest = latestUpdateFor(updates, project.id);
  const counts = TASK_STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length]);
  const overdue = tasks.filter(isOverdue).length;
  const upcoming = tasks
    .filter((t) => t.status !== "done" && t.due)
    .sort((a, b) => a.due.localeCompare(b.due))
    .slice(0, 5);
  const pm = people(project.pm);
  const total = projectTotal(project);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className={`${GRANARY_CARD} space-y-3 p-4 lg:col-span-2`}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tx("charter", "Project charter")}</h3>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx("fieldFunder", "Funder")}</dt>
            <dd className="text-slate-900 dark:text-white">{project.funder || "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx("fieldKind", "Type")}</dt>
            <dd className="text-slate-900 dark:text-white">
              {project.kind === "Proposal" ? tx("kindProposal", "Proposal") : tx("kindAward", "Award")}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {project.kind === "Proposal" ? tx("fieldBudgetShort", "Prep budget") : tx("fieldAmountShort", "Award amount")}
            </dt>
            <dd className="text-slate-900 dark:text-white">{total ? formatUsdFull(total) : "—"}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx("period", "Period")}</dt>
            <dd className="text-slate-900 dark:text-white">
              {fmtDate(project.start, { month: "short", day: "numeric", year: "numeric" })} →{" "}
              {fmtDate(project.end, { month: "short", day: "numeric", year: "numeric" })}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx("projectManager", "Project manager")}</dt>
            <dd className="flex items-center gap-1.5 text-slate-900 dark:text-white">
              {pm ? <Avatar person={pm} /> : null}
              {pm?.n || "—"}
            </dd>
          </div>
        </dl>

        <div className="space-y-1.5 border-t border-[#D8E0EA] pt-3 dark:border-[#2A3548]">
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{tx("pulse", "Pulse")}</h4>
          <Bar label={tx("legendTime", "Time")} pct={timePct(project)} className="bg-slate-400 dark:bg-slate-500" />
          <Bar label={tx("legendSpent", "Spent")} pct={project.spent} className="bg-[#3D4F66] dark:bg-[#8FA3B8]" />
          <Bar label={tx("legendDone", "Done")} pct={project.done} className="bg-emerald-500 dark:bg-emerald-400" />
        </div>
      </section>

      <section className={`${GRANARY_CARD} space-y-3 p-4`}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tx("latestUpdate", "Latest status update")}</h3>
        {latest ? (
          <div className="space-y-2">
            <RagChip rag={latest.rag} label={tx(`rag.${latest.rag}`, RAG_DEFAULTS[latest.rag])} />
            <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">{latest.t}</p>
            <p className="text-[11px] text-slate-500">
              {people(latest.w)?.n || latest.w || "—"} · {fmtDate(latest.d)}
            </p>
          </div>
        ) : (
          <p className="text-sm text-slate-500">{tx("noUpdates", "No status updates yet.")}</p>
        )}
      </section>

      <section className={`${GRANARY_CARD} space-y-3 p-4 lg:col-span-2`}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tx("taskCounts", "Tasks")}</h3>
          {overdue > 0 ? (
            <span className="text-[11px] font-semibold text-red-600">
              {tx("overdueCount", "{{count}} overdue", { count: overdue })}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {counts.map(([status, n]) => (
            <div key={status} className={`rounded-[10px] px-2 py-2 text-center ${STATUS_TONE[status]}`}>
              <p className="text-lg font-bold tabular-nums">{n}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide">{tx(`statuses.${status}`, STATUS_DEFAULTS[status])}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${GRANARY_CARD} space-y-2 p-4`}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tx("upNext", "Up next")}</h3>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">{tx("noTasks", "No tasks yet.")}</p>
        ) : (
          <ul className="space-y-1.5">
            {upcoming.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpenTask(t)}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1 text-left text-sm hover:bg-[#F0F3F7] dark:hover:bg-[#2A3548]"
                >
                  <span className="truncate text-slate-800 dark:text-slate-100">{t.title}</span>
                  <span className={`shrink-0 text-[11px] ${isOverdue(t) ? "font-semibold text-red-600" : "text-slate-500"}`}>
                    {fmtDate(t.due)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

const LINE_DEFAULTS = [
  ["Personnel", 0.45],
  ["Fringe benefits", 0.13],
  ["Travel", 0.03],
  ["Supplies", 0.05],
  ["Contractual", 0.22],
  ["Other direct", 0.04],
  ["Indirect", 0.08],
];

const DEMO_RATES = { ana: 115, maya: 105, dev: 110, priya: 120, rosa: 145, sam: 100 };

function defaultLinesForDemo(project) {
  if (project.lines && project.lines.length) return project.lines;
  const total = projectTotal(project);
  if (!total) return [];
  const target = (total * (project.spent || 0)) / 100;
  return LINE_DEFAULTS.map(([n, frac]) => {
    const b = Math.round((total * frac) / 100) * 100;
    const s = Math.min(b, Math.round((target * frac) / 10) * 10);
    return { n, b, s };
  });
}

function BudgetTab({ tx, project, tasks, demoMode, onPatchProject }) {
  const total = projectTotal(project);
  const lines = useMemo(() => {
    if (project.lines && project.lines.length) return project.lines;
    return demoMode ? defaultLinesForDemo(project) : [];
  }, [project, demoMode]);
  const expenses = Array.isArray(project.exp) ? project.exp : [];

  const lineBudgetSum = lines.reduce((sum, l) => sum + (Number(l.b) || 0), 0);
  const lineSpentSum = lines.reduce((sum, l) => sum + (Number(l.s) || 0), 0);
  const effectiveTotal = lineBudgetSum || total;
  const spentAmt = lines.length ? lineSpentSum : Math.round((total * project.spent) / 100);
  const remaining = Math.max(0, effectiveTotal - spentAmt);
  const effectiveSpentPct = effectiveTotal ? Math.min(100, Math.round((spentAmt / effectiveTotal) * 100)) : project.spent;
  const elapsed = timePct(project);
  const totalHours = tasks.reduce((s, t) => s + (Number(t.est) || 0), 0);
  const hoursByStatus = TASK_STATUSES.map((s) => [
    s,
    tasks.filter((t) => t.status === s).reduce((sum, t) => sum + (Number(t.est) || 0), 0),
  ]);
  const burnWarn = effectiveSpentPct - elapsed > 10;

  const [newLineName, setNewLineName] = useState("");
  const [newLineBudget, setNewLineBudget] = useState("");
  const [expLineIdx, setExpLineIdx] = useState("0");
  const [expAmt, setExpAmt] = useState("");
  const [expNote, setExpNote] = useState("");

  const handleAddLine = (e) => {
    e.preventDefault();
    const n = newLineName.trim();
    const b = Math.max(0, Math.round(Number(newLineBudget) || 0));
    if (!n || b <= 0) return;
    const nextLines = [...lines, { n, b, s: 0 }];
    const nextTotal = nextLines.reduce((sum, l) => sum + l.b, 0);
    const nextSpent = nextLines.reduce((sum, l) => sum + l.s, 0);
    onPatchProject({
      lines: nextLines,
      spent: nextTotal ? Math.round((nextSpent / nextTotal) * 100) : project.spent,
    });
    setNewLineName("");
    setNewLineBudget("");
  };

  const handleLogExpense = (e) => {
    e.preventDefault();
    const idx = Number(expLineIdx);
    const amt = Math.round(Number(expAmt) * 100) / 100;
    if (!lines[idx] || !Number.isFinite(amt) || amt <= 0) return;
    const nextLines = lines.map((l, i) => (i === idx ? { ...l, s: Math.round((l.s + amt) * 100) / 100 } : l));
    const nextTotal = nextLines.reduce((sum, l) => sum + l.b, 0);
    const nextSpent = nextLines.reduce((sum, l) => sum + l.s, 0);
    const entry = {
      id: newWorkspaceId("exp"),
      line: lines[idx].n,
      a: amt,
      note: expNote.trim() || lines[idx].n,
      d: todayIso(),
    };
    onPatchProject({
      lines: nextLines,
      exp: [entry, ...expenses],
      spent: nextTotal ? Math.min(100, Math.round((nextSpent / nextTotal) * 100)) : project.spent,
    });
    setExpAmt("");
    setExpNote("");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className={`${GRANARY_CARD} space-y-3 p-4`}>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {project.kind === "Proposal" ? tx("fieldBudgetShort", "Prep budget") : tx("fieldAmountShort", "Award amount")}
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              [tx("budgetTotal", "Total"), formatUsdCompact(effectiveTotal)],
              [tx("budgetSpent", "Spent"), formatUsdCompact(spentAmt)],
              [tx("budgetRemaining", "Remaining"), formatUsdCompact(remaining)],
            ].map(([label, value]) => (
              <div key={label} className={`${GRANARY_CARD_SOFT} p-3`}>
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            <Bar label={tx("legendTime", "Time")} pct={elapsed} className="bg-slate-400 dark:bg-slate-500" />
            <Bar label={tx("legendSpent", "Spent")} pct={effectiveSpentPct} className="bg-[#3D4F66] dark:bg-[#8FA3B8]" />
            <Bar label={tx("legendDone", "Done")} pct={project.done} className="bg-emerald-500 dark:bg-emerald-400" />
          </div>
          {burnWarn ? (
            <p className="text-xs font-medium text-amber-700 dark:text-amber-300">
              {tx("burnWarn", "Spend is running ahead of time elapsed.")}
            </p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 border-t border-[#D8E0EA] pt-3 dark:border-[#2A3548]">
            <Field label={tx("editSpent", "Spent (%)")}>
              <input
                key={`s-${effectiveSpentPct}`}
                type="number"
                min={0}
                max={100}
                defaultValue={effectiveSpentPct}
                onBlur={(e) => onPatchProject({ spent: Number(e.target.value) })}
                className={GRANARY_INPUT}
              />
            </Field>
            <Field label={tx("editDone", "Done (%)")}>
              <input
                key={`d-${project.done}`}
                type="number"
                min={0}
                max={100}
                defaultValue={project.done}
                onBlur={(e) => onPatchProject({ done: Number(e.target.value) })}
                className={GRANARY_INPUT}
              />
            </Field>
          </div>
        </section>

        <section className={`${GRANARY_CARD} space-y-3 p-4`}>
          <div className="flex items-baseline justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tx("taskEstimates", "Task estimates")}</h3>
            <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
              {tx("hoursTotal", "{{count}} hrs", { count: Math.round(totalHours * 10) / 10 })}
            </span>
          </div>
          <ul className="space-y-2">
            {hoursByStatus.map(([status, hrs]) => (
              <li key={status} className="flex items-center gap-2">
                <span className={`w-24 shrink-0 rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[status]}`}>
                  {tx(`statuses.${status}`, STATUS_DEFAULTS[status])}
                </span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                  <div
                    className="h-full rounded-full bg-[#3D4F66] dark:bg-[#8FA3B8]"
                    style={{ width: `${totalHours ? Math.round((hrs / totalHours) * 100) : 0}%` }}
                  />
                </div>
                <span className="w-12 shrink-0 text-right text-[11px] font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {Math.round(hrs * 10) / 10}h
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Budget lines & Expense logging */}
      <div className="grid gap-4 lg:grid-cols-3">
        <section className={`${GRANARY_CARD} space-y-3 p-4 lg:col-span-2`}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              {tx("budgetLinesTitle", "Budget lines & spend")}
            </h3>
            <span className="text-xs text-slate-500">
              {lines.length} {lines.length === 1 ? "line" : "lines"}
            </span>
          </div>
          {lines.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">
              No budget lines yet. Add a line below (e.g. Personnel, Supplies, Contractual) to track spend.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[30rem] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-[#D8E0EA] text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-[#2A3548]">
                    <th className="py-2 pr-2">Budget line</th>
                    <th className="py-2 px-2 text-right">Budget</th>
                    <th className="py-2 px-2 text-right">Spent</th>
                    <th className="py-2 px-2 w-32">Used</th>
                    <th className="py-2 pl-2 text-right">Left</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, idx) => {
                    const pct = l.b ? Math.min(100, Math.round((l.s / l.b) * 100)) : 0;
                    const over = pct > elapsed + 25;
                    return (
                      <tr key={`${l.n}-${idx}`} className="border-b border-[#D8E0EA]/70 dark:border-[#2A3548]/70">
                        <td className="py-2 pr-2 font-medium text-slate-900 dark:text-white">{l.n}</td>
                        <td className="py-2 px-2 text-right tabular-nums text-slate-700 dark:text-slate-200">{formatUsdFull(l.b)}</td>
                        <td className="py-2 px-2 text-right tabular-nums text-slate-700 dark:text-slate-200">{formatUsdFull(l.s)}</td>
                        <td className="py-2 px-2">
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                              <div
                                className={`h-full rounded-full ${over ? "bg-amber-500" : "bg-[#3D4F66] dark:bg-[#8FA3B8]"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="w-8 text-right text-xs tabular-nums text-slate-500">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-2 pl-2 text-right tabular-nums text-slate-700 dark:text-slate-200">{formatUsdFull(Math.max(0, l.b - l.s))}</td>
                      </tr>
                    );
                  })}
                  <tr className="font-semibold text-slate-900 dark:text-white">
                    <td className="pt-2 pr-2">Total</td>
                    <td className="pt-2 px-2 text-right tabular-nums">{formatUsdFull(lineBudgetSum)}</td>
                    <td className="pt-2 px-2 text-right tabular-nums">{formatUsdFull(lineSpentSum)}</td>
                    <td className="pt-2 px-2 text-xs tabular-nums">{effectiveSpentPct}%</td>
                    <td className="pt-2 pl-2 text-right tabular-nums">{formatUsdFull(Math.max(0, lineBudgetSum - lineSpentSum))}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <form onSubmit={handleAddLine} className="flex flex-wrap items-center gap-2 border-t border-[#D8E0EA] pt-3 dark:border-[#2A3548]">
            <input
              type="text"
              value={newLineName}
              onChange={(e) => setNewLineName(e.target.value)}
              placeholder="New budget line (e.g. Personnel)"
              className={`${GRANARY_INPUT} min-w-[12rem] flex-1`}
            />
            <input
              type="number"
              min={1}
              value={newLineBudget}
              onChange={(e) => setNewLineBudget(e.target.value)}
              placeholder="Budget ($)"
              className={`${GRANARY_INPUT} w-32`}
            />
            <button type="submit" className={GRANARY_BTN_SECONDARY}>
              <FiPlus className="h-4 w-4" aria-hidden />
              Add line
            </button>
          </form>
        </section>

        <section className={`${GRANARY_CARD} space-y-3 p-4`}>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Log an expense</h3>
            <p className="text-xs text-slate-500">Record spending against a budget line.</p>
          </div>
          <form onSubmit={handleLogExpense} className="space-y-2.5">
            <Field label="Budget line">
              <select
                value={expLineIdx}
                onChange={(e) => setExpLineIdx(e.target.value)}
                disabled={lines.length === 0}
                className={GRANARY_INPUT}
              >
                {lines.length === 0 ? (
                  <option value="">Add a budget line first</option>
                ) : (
                  lines.map((l, i) => (
                    <option key={`${l.n}-${i}`} value={i}>
                      {l.n} · {formatUsdCompact(Math.max(0, l.b - l.s))} left
                    </option>
                  ))
                )}
              </select>
            </Field>
            <Field label="Amount ($)">
              <input
                type="number"
                min={0.01}
                step="0.01"
                value={expAmt}
                onChange={(e) => setExpAmt(e.target.value)}
                placeholder="0.00"
                disabled={lines.length === 0}
                className={GRANARY_INPUT}
              />
            </Field>
            <Field label="Description">
              <input
                type="text"
                value={expNote}
                onChange={(e) => setExpNote(e.target.value)}
                placeholder="e.g. Q3 payroll, venue rental"
                disabled={lines.length === 0}
                className={GRANARY_INPUT}
              />
            </Field>
            <button
              type="submit"
              disabled={lines.length === 0 || !Number(expAmt)}
              className={GRANARY_BTN_PRIMARY}
            >
              Add expense
            </button>
          </form>

          <div className="border-t border-[#D8E0EA] pt-3 dark:border-[#2A3548]">
            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">Recent expenses</p>
            {expenses.length === 0 ? (
              <p className="mt-1.5 text-xs text-slate-500">No expenses logged yet.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {expenses.slice(0, 6).map((x) => (
                  <li key={x.id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900 dark:text-white">{x.note || x.line}</p>
                      <p className="text-slate-500">{x.line} · {fmtDate(x.d)}</p>
                    </div>
                    <span className="shrink-0 font-semibold tabular-nums text-slate-800 dark:text-slate-200">
                      {formatUsdFull(x.a)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function ResourcesTab({ projects, tasks, people, demoMode }) {
  const numWeeks = 8;
  const weekStarts = useMemo(() => {
    const now = new Date();
    const mon = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7));
    return Array.from({ length: numWeeks }, (_, i) => addDays(mon, i * 7));
  }, []);

  const ownerKeys = useMemo(() => {
    if (demoMode) return Object.keys(DEMO_PW_PEOPLE);
    const set = new Set(tasks.map((t) => t.owner).filter(Boolean));
    return [...set];
  }, [demoMode, tasks]);

  const weeklyLoad = useMemo(() => {
    const map = {};
    ownerKeys.forEach((k) => {
      map[k] = Array(numWeeks).fill(0);
    });
    tasks.forEach((t) => {
      if (t.status === "done" || !t.owner || !map[t.owner]) return;
      const s = parseDay(t.start || t.due);
      const e = parseDay(t.due || t.start);
      if (!s || !e) return;
      const span = Math.max(1, diffDays(s, e) + 1);
      const est = Number(t.est) || 0;
      if (est <= 0) return;
      weekStarts.forEach((ws, wi) => {
        const we = addDays(ws, 6);
        const ovStart = s > ws ? s : ws;
        const ovEnd = e < we ? e : we;
        if (ovEnd >= ovStart) {
          const ovDays = diffDays(ovStart, ovEnd) + 1;
          map[t.owner][wi] += (est * ovDays) / span;
        }
      });
    });
    return map;
  }, [ownerKeys, tasks, weekStarts]);

  const allocByProject = useMemo(() => {
    const end4 = addDays(weekStarts[0], 27);
    const out = {};
    ownerKeys.forEach((k) => {
      out[k] = projects
        .map((p) => {
          let hrs = 0;
          tasks.forEach((t) => {
            if (t.p !== p.id || t.owner !== k || t.status === "done") return;
            const s = parseDay(t.start || t.due);
            const e = parseDay(t.due || t.start);
            if (!s || !e) return;
            const span = Math.max(1, diffDays(s, e) + 1);
            const ovStart = s > weekStarts[0] ? s : weekStarts[0];
            const ovEnd = e < end4 ? e : end4;
            if (ovEnd >= ovStart) {
              hrs += ((Number(t.est) || 0) * (diffDays(ovStart, ovEnd) + 1)) / span;
            }
          });
          return { project: p, hrs };
        })
        .filter((x) => x.hrs >= 0.5);
    });
    return out;
  }, [ownerKeys, projects, tasks, weekStarts]);

  const cellTone = (h) => {
    if (h < 1) return "bg-slate-100 text-slate-400 dark:bg-slate-800/50 dark:text-slate-500";
    if (h < 24) return "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200";
    if (h <= 40) return "bg-sky-100 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200";
    if (h <= 50) return "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200";
    return "bg-red-100 font-bold text-red-800 dark:bg-red-950/70 dark:text-red-200";
  };

  if (ownerKeys.length === 0) {
    return (
      <section className={`${GRANARY_CARD} p-8 text-center text-sm text-slate-500`}>
        No team workload yet. Add tasks with owners, dates, and estimated hours to see weekly capacity and allocation.
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <section className={`${GRANARY_CARD} space-y-3 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Capacity heatmap (next 8 weeks)
            </h3>
            <p className="text-xs text-slate-500">
              Planned hours per person from task estimates · 40 h/week capacity · red is over 50 h.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px]">
            <span className="rounded bg-emerald-50 px-2 py-0.5 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200">Under 24 h</span>
            <span className="rounded bg-sky-100 px-2 py-0.5 text-sky-900 dark:bg-sky-950/60 dark:text-sky-200">24–40 h</span>
            <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200">40–50 h</span>
            <span className="rounded bg-red-100 px-2 py-0.5 text-red-800 dark:bg-red-950/70 dark:text-red-200">Over 50 h</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[44rem] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[#D8E0EA] text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-[#2A3548]">
                <th className="py-2 pr-3">Person</th>
                {weekStarts.map((ws, i) => (
                  <th key={i} className="px-1.5 py-2 text-center">
                    {i === 0 ? "This week" : fmtDate(toIso(ws))}
                  </th>
                ))}
                <th className="px-2 py-2 text-right">8-wk total</th>
                <th className="py-2 pl-2 text-right">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {ownerKeys.map((k) => {
                const person = people(k);
                const row = weeklyLoad[k] || [];
                const tot = row.reduce((a, b) => a + b, 0);
                const rate = DEMO_RATES[k] || 110;
                return (
                  <tr key={k} className="border-b border-[#D8E0EA]/70 dark:border-[#2A3548]/70">
                    <td className="py-2 pr-3">
                      <div className="flex items-center gap-2">
                        {person ? <Avatar person={person} /> : null}
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{person?.n || k}</p>
                          <p className="text-[11px] text-slate-500">${rate}/h</p>
                        </div>
                      </div>
                    </td>
                    {row.map((h, wi) => (
                      <td key={wi} className="px-1 py-1.5 text-center">
                        <span className={`inline-flex min-w-[2.25rem] justify-center rounded px-1.5 py-1 tabular-nums ${cellTone(h)}`}>
                          {Math.round(h) || "—"}
                        </span>
                      </td>
                    ))}
                    <td className="px-2 py-2 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                      {Math.round(tot)} h
                    </td>
                    <td className="py-2 pl-2 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                      {formatUsdCompact(Math.round(tot * rate))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={`${GRANARY_CARD} space-y-3 p-4`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Allocation by project · next 4 weeks
            </h3>
            <p className="text-xs text-slate-500">Where each person’s planned hours go (out of 160 h)</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
            {projects.map((p) => (
              <span key={p.id} className="inline-flex items-center gap-1">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-2.5">
          {ownerKeys.map((k) => {
            const person = people(k);
            const parts = allocByProject[k] || [];
            const tot = parts.reduce((sum, x) => sum + x.hrs, 0);
            return (
              <div key={k} className="grid grid-cols-[8rem_1fr_5rem] items-center gap-3 text-xs">
                <div className="flex items-center gap-2 truncate">
                  {person ? <Avatar person={person} /> : null}
                  <span className="truncate font-medium text-slate-900 dark:text-white">
                    {(person?.n || k).split(" ")[0]}
                  </span>
                </div>
                <div className="flex h-3 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                  {parts.map((x) => (
                    <div
                      key={x.project.id}
                      title={`${x.project.name}: ${Math.round(x.hrs)} h`}
                      style={{
                        width: `${Math.min(100, (x.hrs / 160) * 100)}%`,
                        backgroundColor: x.project.color,
                      }}
                    />
                  ))}
                </div>
                <span className="text-right font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                  {Math.round(tot)} / 160 h
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatusTab({ tx, project, updates, people, onPost }) {
  const [rag, setRag] = useState("g");
  const [text, setText] = useState("");
  const posts = updates
    .filter((u) => u.p === project.id)
    .sort((a, b) => String(b.d).localeCompare(String(a.d)));

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <section className={`${GRANARY_CARD} space-y-3 p-4 lg:col-span-2`}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tx("postUpdate", "Post a status update")}</h3>
        <div className="flex gap-2" role="radiogroup" aria-label={tx("ragLabel", "Status")}>
          {["g", "y", "r"].map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              aria-checked={rag === r}
              onClick={() => setRag(r)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-[10px] border px-2 py-2 text-xs font-semibold transition ${
                rag === r
                  ? "border-[#3D4F66] bg-[#F0F3F7] text-slate-900 dark:border-[#8FA3B8] dark:bg-[#2A3548] dark:text-white"
                  : "border-[#D8E0EA] text-slate-600 hover:bg-[#F4F6F9] dark:border-[#2A3548] dark:text-slate-300 dark:hover:bg-[#0B1017]"
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${RAG_TONE[r].dot}`} aria-hidden />
              {tx(`rag.${r}`, RAG_DEFAULTS[r])}
            </button>
          ))}
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder={tx("updatePlaceholder", "What changed since the last update?")}
          className={GRANARY_INPUT}
        />
        <button
          type="button"
          className={GRANARY_BTN_PRIMARY}
          disabled={!text.trim()}
          onClick={() => {
            onPost({ rag, t: text.trim() });
            setText("");
            setRag("g");
          }}
        >
          <FiSend className="h-4 w-4" aria-hidden />
          {tx("post", "Post update")}
        </button>
      </section>

      <section className={`${GRANARY_CARD} space-y-3 p-4 lg:col-span-3`}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{tx("updatesHistory", "Status history")}</h3>
        {posts.length === 0 ? (
          <p className="text-sm text-slate-500">{tx("noUpdates", "No status updates yet.")}</p>
        ) : (
          <ul className="space-y-3">
            {posts.map((u) => (
              <li key={u.id} className={`${GRANARY_CARD_SOFT} space-y-1.5 p-3`}>
                <div className="flex items-center justify-between gap-2">
                  <RagChip rag={u.rag} label={tx(`rag.${u.rag}`, RAG_DEFAULTS[u.rag])} />
                  <span className="text-[11px] text-slate-500">
                    {people(u.w)?.n || u.w || "—"} · {fmtDate(u.d, { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-slate-800 dark:text-slate-100">{u.t}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

/* ───────── Portfolio (no project selected) ───────── */

function PortfolioView({ tx, projects, tasks, updates, onSelect, onCreate, canCreate }) {
  if (projects.length === 0) {
    return (
      <section className={`${GRANARY_PANEL} space-y-4`}>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {tx("portfolioEmptyTitle", "Start your first project")}
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            {tx(
              "portfolioEmptyBody",
              "Create a project for an award or proposal, then plan work as a board, table, calendar, or timeline and post status updates for your team.",
            )}
          </p>
        </div>
        {canCreate ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className={GRANARY_BTN_PRIMARY} onClick={onCreate}>
              <FiPlus className="h-4 w-4" aria-hidden />
              {tx("createProject", "Create project")}
            </button>
            <Link to="/app/award-management" className={GRANARY_BTN_SECONDARY}>
              {tx("openAwards", "Open award management")}
            </Link>
          </div>
        ) : null}
      </section>
    );
  }

  const open = tasks.filter((t) => t.status !== "done").length;
  const overdue = tasks.filter(isOverdue).length;
  const total = projects.reduce((s, p) => s + projectTotal(p), 0);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          [tx("statProjects", "Projects"), projects.length],
          [tx("statFunding", "Funding"), formatUsdCompact(total)],
          [tx("statOpen", "Open tasks"), open],
          [tx("statOverdue", "Overdue"), overdue],
        ].map(([label, value]) => (
          <div key={label} className={`${GRANARY_CARD} p-3`}>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <p className="text-xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {projects.map((p) => {
          const latest = latestUpdateFor(updates, p.id);
          const pt = tasks.filter((t) => t.p === p.id);
          const openCount = pt.filter((t) => t.status !== "done").length;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onSelect(p.id)}
              className={`${GRANARY_CARD} space-y-3 p-4 text-left transition hover:border-[#3D4F66]/40`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                    <span className="truncate">{p.name}</span>
                  </p>
                  <p className="truncate text-xs text-slate-500">{p.funder || "—"}</p>
                </div>
                {latest ? <RagChip rag={latest.rag} label={tx(`rag.${latest.rag}`, RAG_DEFAULTS[latest.rag])} /> : null}
              </div>
              <div className="space-y-1.5">
                <Bar label={tx("legendTime", "Time")} pct={timePct(p)} className="bg-slate-400 dark:bg-slate-500" />
                <Bar label={tx("legendSpent", "Spent")} pct={p.spent} className="bg-[#3D4F66] dark:bg-[#8FA3B8]" />
                <Bar label={tx("legendDone", "Done")} pct={p.done} className="bg-emerald-500 dark:bg-emerald-400" />
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className={GRANARY_CHIP}>
                  {p.kind === "Proposal" ? tx("kindProposal", "Proposal") : tx("kindAward", "Award")}
                </span>
                <span>{tx("openTasksCount", "{{count}} open tasks", { count: openCount })}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MyTasksView({ tx, tasks, projects, people, onOpen }) {
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const sorted = [...tasks].sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999"));
  return (
    <section className={`${GRANARY_PANEL} space-y-3`}>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{tx("myTasks", "My tasks")}</h2>
      {sorted.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">{tx("noMyTasks", "No open tasks are assigned to you.")}</p>
      ) : (
        <ul className="divide-y divide-[#D8E0EA] dark:divide-[#2A3548]">
          {sorted.map((t) => {
            const proj = projectById.get(t.p);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => onOpen(t)}
                  className="flex w-full items-center gap-3 px-1 py-2.5 text-left hover:bg-[#F4F6F9] dark:hover:bg-[#0B1017]"
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: proj?.color || "#64748b" }} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{t.title}</span>
                    <span className="block truncate text-xs text-slate-500">{proj?.name || "—"}</span>
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[t.status]}`}>
                    {tx(`statuses.${t.status}`, STATUS_DEFAULTS[t.status])}
                  </span>
                  <span className={`w-14 shrink-0 text-right text-[11px] ${isOverdue(t) ? "font-semibold text-red-600" : "text-slate-500"}`}>
                    {fmtDate(t.due)}
                  </span>
                  {people(t.owner) ? <Avatar person={people(t.owner)} /> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ───────── Page ───────── */

export default function ProjectWorkspacePage() {
  const { t } = useTranslation("common");
  const tx = useCallback(
    (key, fallback, params) =>
      t(`proposalManagerProjectWorkspace.${key}`, { defaultValue: fallback, ...(params || {}) }),
    [t],
  );
  const demoMode = isDemoProposalManagerSession();

  const [trialBlob, setTrialBlob] = useState(() =>
    demoMode
      ? { projects: [], tasks: [], updates: [], freshReset: true }
      : getProjectWorkspaceData(),
  );
  const [demoBlob, setDemoBlob] = useState(() =>
    demoMode
      ? { projects: getDemoProjects(), tasks: getDemoTasks(), updates: getDemoUpdates() }
      : { projects: [], tasks: [], updates: [] },
  );
  const [hydrating, setHydrating] = useState(!demoMode);

  const [selectedId, setSelectedId] = useState("");
  const [myOnly, setMyOnly] = useState(false);
  const [tab, setTab] = useState("overview");
  const [workView, setWorkView] = useState("board"); // board | list | calendar | gantt
  useEffect(() => {
    if (workView === "kanban") setWorkView("board");
    else if (workView === "table") setWorkView("list");
    else if (!["board", "list", "calendar", "gantt"].includes(workView)) setWorkView("board");
  }, [workView]);
  const [showCreate, setShowCreate] = useState(false);
  const [drawer, setDrawer] = useState(null); // { task, isNew }

  useEffect(() => {
    if (demoMode) return undefined;
    let cancelled = false;
    (async () => {
      setHydrating(true);
      await hydrateProjectWorkspaceFromServer();
      if (!cancelled) {
        ensureProjectWorkspaceFresh();
        setTrialBlob(getProjectWorkspaceData());
        setHydrating(false);
      }
    })();
    const unsub = subscribeProjectWorkspace((next) => setTrialBlob(next));
    return () => {
      cancelled = true;
      unsub();
    };
  }, [demoMode]);

  const data = demoMode ? demoBlob : trialBlob;
  const { projects, tasks, updates } = data;

  /* People / identity */
  const myName = useMemo(() => currentUserName(), []);
  const meKey = demoMode ? DEMO_ME : myName || "Me";
  const myTokens = useMemo(() => {
    if (demoMode) return new Set([DEMO_ME]);
    const full = myName.toLowerCase();
    const first = full.split(/\s+/)[0];
    return new Set([full, first, "me"].filter(Boolean));
  }, [demoMode, myName]);
  const isMine = useCallback(
    (owner) => myTokens.has(String(owner || "").trim().toLowerCase()),
    [myTokens],
  );
  const personFor = useCallback(
    (key) => {
      if (!key) return null;
      if (demoMode) {
        return DEMO_PW_PEOPLE[key]
          ? { n: DEMO_PW_PEOPLE[key].n, i: DEMO_PW_PEOPLE[key].i, c: DEMO_PW_PEOPLE[key].c }
          : { n: key, i: initialsOf(key), c: "#64748b" };
      }
      return { n: key, i: initialsOf(key), c: "#64748b" };
    },
    [demoMode],
  );
  const ownerOptions = useMemo(() => {
    const set = new Set(tasks.map((x) => x.owner).filter(Boolean));
    if (myName) set.add(myName);
    return [...set];
  }, [tasks, myName]);

  /* Actions: demo edits stay in memory; trial/walkthrough writes through the store */
  const actions = useMemo(() => {
    if (demoMode) {
      return {
        addProject: (input) => {
          const project = normalizeProject({ ...input, id: newWorkspaceId("proj"), pm: DEMO_ME });
          setDemoBlob((d) => ({ ...d, projects: [project, ...d.projects] }));
          return project;
        },
        updateProject: (id, patch) =>
          setDemoBlob((d) => ({
            ...d,
            projects: d.projects.map((p) => (p.id === id ? normalizeProject({ ...p, ...patch, id }) : p)),
          })),
        removeProject: (id) =>
          setDemoBlob((d) => ({
            projects: d.projects.filter((p) => p.id !== id),
            tasks: d.tasks.filter((x) => x.p !== id),
            updates: d.updates.filter((u) => u.p !== id),
          })),
        addTask: (input) =>
          setDemoBlob((d) => ({ ...d, tasks: [...d.tasks, normalizeTask({ ...input, id: newWorkspaceId("task") })] })),
        updateTask: (id, patch) =>
          setDemoBlob((d) => ({
            ...d,
            tasks: d.tasks.map((x) => (x.id === id ? normalizeTask({ ...x, ...patch, id, p: x.p }) : x)),
          })),
        updateManyTasks: (ids, patch) => {
          const idSet = new Set(ids);
          setDemoBlob((d) => ({
            ...d,
            tasks: d.tasks.map((task) => {
              if (!idSet.has(task.id)) return task;
              const extra = typeof patch === "function" ? patch(task) : patch;
              return normalizeTask({ ...task, ...extra, id: task.id, p: task.p });
            }),
          }));
        },
        removeTask: (id) =>
          setDemoBlob((d) => ({
            ...d,
            tasks: d.tasks
              .filter((x) => x.id !== id)
              .map((x) => (x.deps.includes(id) ? { ...x, deps: x.deps.filter((dep) => dep !== id) } : x)),
          })),
        addUpdate: (input) =>
          setDemoBlob((d) => ({
            ...d,
            updates: [normalizeUpdate({ ...input, id: newWorkspaceId("upd") }), ...d.updates],
          })),
      };
    }
    return {
      addProject: (input) => addProject({ ...input, pm: meKey }).created,
      updateProject,
      removeProject,
      addTask,
      updateTask,
      updateManyTasks,
      removeTask,
      addUpdate,
    };
  }, [demoMode, meKey]);

  const project = projects.find((p) => p.id === selectedId) || null;
  const projectTasks = useMemo(
    () => (project ? tasks.filter((x) => x.p === project.id) : []),
    [project, tasks],
  );
  const scopedTasks = useMemo(
    () => (myOnly ? projectTasks.filter((x) => isMine(x.owner)) : projectTasks),
    [myOnly, projectTasks, isMine],
  );
  const myOpenTasks = useMemo(
    () => tasks.filter((x) => isMine(x.owner) && x.status !== "done"),
    [tasks, isMine],
  );

  const openNewTask = (status = "todo") => {
    if (!project) return;
    setDrawer({
      isNew: true,
      task: normalizeTask({
        id: "__new__",
        p: project.id,
        title: "",
        status,
        owner: meKey,
        start: todayIso(),
        due: "",
      }),
    });
  };
  // normalizeTask replaces an empty title; keep the drawer's blank title editable.
  const drawerTask = drawer ? { ...drawer.task, title: drawer.isNew ? "" : drawer.task.title } : null;

  const saveTask = (form) => {
    if (drawer.isNew) {
      actions.addTask({ ...form, id: undefined, p: project.id, bStart: "", bDue: "" });
    } else {
      actions.updateTask(drawer.task.id, form);
    }
    setDrawer(null);
  };

  const portfolioHeading = myOnly && !project;
  const canCreate = true;
  const showEmptyHint = !demoMode && !hydrating && projects.length === 0;

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {tx("title", "Project workspace")}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {showEmptyHint
              ? tx("subtitleEmpty", "No projects yet — create one to start planning work.")
              : tx("subtitle", "Plan work, track budget, and post status across your awards and proposals.")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {demoMode ? (
            <span className="inline-flex self-start rounded-full bg-[#D8E0EA] px-2.5 py-1 text-[11px] font-semibold text-[#3D4F66] ring-1 ring-[#3D4F66]/20 dark:bg-[#2A3548] dark:text-[#B8C5D6] dark:ring-[#8FA3B8]/30">
              {tx("demoBadge", "Demo data")}
            </span>
          ) : null}
          <Link to="/app/grant-pipeline" className={GRANARY_BTN_SECONDARY}>
            {tx("openGrantPipeline", "Grant pipeline")}
          </Link>
          <Link to="/app/award-management" className={GRANARY_BTN_SECONDARY}>
            {tx("openAwards", "Open award management")}
          </Link>
        </div>
      </header>

      {hydrating ? <p className="text-sm text-slate-500">{tx("loading", "Loading…")}</p> : null}

      <div className="grid gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
        {/* Sidebar */}
        <aside className={`${GRANARY_PANEL} space-y-3 self-start`}>
          <button type="button" className={`${GRANARY_BTN_PRIMARY} w-full`} onClick={() => setShowCreate(true)}>
            <FiPlus className="h-4 w-4" aria-hidden />
            {tx("createProject", "Create project")}
          </button>

          <div className="space-y-1">
            <button
              type="button"
              onClick={() => setSelectedId("")}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold ${
                !project && !myOnly
                  ? "bg-[#F0F3F7] text-slate-900 dark:bg-[#2A3548] dark:text-white"
                  : "text-slate-700 hover:bg-[#F4F6F9] dark:text-slate-200 dark:hover:bg-[#0B1017]"
              }`}
            >
              <FiFolder className="h-4 w-4" aria-hidden />
              {tx("portfolio", "Portfolio")}
            </button>
            <button
              type="button"
              aria-pressed={myOnly}
              onClick={() => setMyOnly((v) => !v)}
              className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-semibold ${
                myOnly
                  ? "bg-[#F0F3F7] text-slate-900 dark:bg-[#2A3548] dark:text-white"
                  : "text-slate-700 hover:bg-[#F4F6F9] dark:text-slate-200 dark:hover:bg-[#0B1017]"
              }`}
            >
              <FiCheckSquare className="h-4 w-4" aria-hidden />
              <span className="flex-1">{tx("myTasks", "My tasks")}</span>
              <span className="rounded-full bg-slate-200 px-1.5 text-[11px] tabular-nums text-slate-700 dark:bg-slate-700 dark:text-slate-100">
                {myOpenTasks.length}
              </span>
            </button>
          </div>

          <div className="space-y-1 border-t border-[#D8E0EA] pt-3 dark:border-[#2A3548]">
            <p className="px-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {tx("projects", "Projects")}
            </p>
            {projects.length === 0 ? (
              <p className="px-2 py-2 text-xs text-slate-500">{tx("noProjects", "No projects yet")}</p>
            ) : (
              <ul className="space-y-0.5">
                {projects.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(p.id);
                        setTab("overview");
                      }}
                      className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm ${
                        p.id === selectedId
                          ? "bg-[#F0F3F7] font-semibold text-slate-900 dark:bg-[#2A3548] dark:text-white"
                          : "text-slate-700 hover:bg-[#F4F6F9] dark:text-slate-200 dark:hover:bg-[#0B1017]"
                      }`}
                    >
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} aria-hidden />
                      <span className="min-w-0 flex-1 truncate">{p.name}</span>
                      <span className="shrink-0 text-[10px] font-semibold uppercase text-slate-400">
                        {p.kind === "Proposal" ? tx("kindProposalShort", "RFP") : tx("kindAwardShort", "AWD")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main */}
        <main className="min-w-0 space-y-4">
          {!project && portfolioHeading ? (
            <MyTasksView tx={tx} tasks={myOpenTasks} projects={projects} people={personFor} onOpen={(task) => {
              setSelectedId(task.p);
              setDrawer({ isNew: false, task });
            }} />
          ) : null}

          {!project && !portfolioHeading && !hydrating ? (
            <PortfolioView
              tx={tx}
              projects={projects}
              tasks={tasks}
              updates={updates}
              onSelect={(id) => {
                setSelectedId(id);
                setTab("overview");
              }}
              onCreate={() => setShowCreate(true)}
              canCreate={canCreate}
            />
          ) : null}

          {project ? (
            <>
              <section className={`${GRANARY_PANEL} flex flex-wrap items-start justify-between gap-3`}>
                <div className="min-w-0 space-y-1">
                  <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900 dark:text-white">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: project.color }} aria-hidden />
                    <span className="truncate">{project.name}</span>
                  </h2>
                  <p className="text-xs text-slate-500">
                    {[
                      project.funder,
                      project.kind === "Proposal" ? tx("kindProposal", "Proposal") : tx("kindAward", "Award"),
                      `${fmtDate(project.start)} → ${fmtDate(project.end)}`,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50 dark:text-red-300 dark:hover:bg-red-950/40"
                  onClick={() => {
                    if (window.confirm(tx("confirmDeleteProject", "Delete this project and all of its tasks?"))) {
                      actions.removeProject(project.id);
                      setSelectedId("");
                    }
                  }}
                >
                  <FiTrash2 className="h-3.5 w-3.5" aria-hidden />
                  {tx("deleteProject", "Delete project")}
                </button>
              </section>

              <div className="flex flex-wrap gap-1 border-b border-[#D8E0EA] dark:border-[#2A3548]" role="tablist">
                {[
                  ["overview", tx("tabs.overview", "Overview")],
                  ["work", tx("tabs.scope", "Scope & Tasks")],
                  ["budget", tx("tabs.budget", "Budget")],
                  ["resources", tx("tabs.resources", "Resources")],
                  ["status", tx("tabs.status", "Status")],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={tab === key}
                    onClick={() => setTab(key)}
                    className={`-mb-px border-b-2 px-3 py-2 text-sm font-semibold transition ${
                      tab === key
                        ? "border-[#3D4F66] text-slate-900 dark:border-[#8FA3B8] dark:text-white"
                        : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {tab === "overview" ? (
                <OverviewTab
                  tx={tx}
                  project={project}
                  tasks={scopedTasks}
                  updates={updates}
                  people={personFor}
                  onOpenTask={(task) => setDrawer({ isNew: false, task })}
                />
              ) : null}

              {tab === "work" ? (
                <section className={`${GRANARY_PANEL} space-y-4`}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="inline-flex overflow-hidden rounded-[10px] border border-[#B8C5D6] dark:border-[#2A3548]" role="group">
                      {[
                        ["board", FiColumns, tx("views.board", "Board")],
                        ["list", FiList, tx("views.list", "List")],
                        ["calendar", FiCalendar, tx("views.calendar", "Calendar")],
                        ["gantt", FiBarChart2, tx("views.gantt", "Gantt")],
                      ].map(([key, Icon, label]) => (
                        <button
                          key={key}
                          type="button"
                          aria-pressed={workView === key}
                          onClick={() => setWorkView(key)}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold transition ${
                            workView === key
                              ? "bg-[#3D4F66] text-white dark:bg-[#8FA3B8] dark:text-[#0B1017]"
                              : "bg-white text-slate-700 hover:bg-[#F0F3F7] dark:bg-[#0B1017] dark:text-slate-200 dark:hover:bg-[#151D2A]"
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden />
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to="/app/meetings-calendar?view=tasks"
                        className={`${GRANARY_BTN_SECONDARY} !min-h-[38px]`}
                      >
                        <FiCalendar className="h-4 w-4" aria-hidden />
                        {tx("openTaskCalendar", "Task calendar")}
                      </Link>
                      <Link
                        to="/app/meetings-calendar?view=gantt"
                        className={`${GRANARY_BTN_SECONDARY} !min-h-[38px]`}
                      >
                        <FiBarChart2 className="h-4 w-4" aria-hidden />
                        {tx("openGantt", "Timeline / Gantt")}
                      </Link>
                      <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={myOnly}
                          onChange={(e) => setMyOnly(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-300 text-[#3D4F66] focus:ring-[#3D4F66]"
                        />
                        {tx("myTasks", "My tasks")}
                      </label>
                      <button type="button" className={GRANARY_BTN_PRIMARY} onClick={() => openNewTask("todo")}>
                        <FiPlus className="h-4 w-4" aria-hidden />
                        {tx("addTask", "Add task")}
                      </button>
                    </div>
                  </div>

                  {workView === "board" ? (
                    <BoardView
                      tx={tx}
                      tasks={scopedTasks}
                      lookupTasks={projectTasks}
                      people={personFor}
                      demoMode={demoMode}
                      ownerOptions={ownerOptions}
                      onOpen={(task) => setDrawer({ isNew: false, task })}
                      onAdd={openNewTask}
                      onQuickAdd={(status, title) =>
                        actions.addTask({
                          p: project.id,
                          title,
                          status,
                          owner: meKey,
                          pri: "med",
                          start: todayIso(),
                          due: toIso(addDays(new Date(), 5)),
                          est: 4,
                        })
                      }
                      onMove={(id, status) => actions.updateTask(id, { status })}
                    />
                  ) : null}
                  {workView === "list" ? (
                    <TaskListView
                      tx={tx}
                      tasks={scopedTasks}
                      lookupTasks={projectTasks}
                      people={personFor}
                      demoMode={demoMode}
                      ownerOptions={ownerOptions}
                      onOpen={(task) => setDrawer({ isNew: false, task })}
                      onPatch={(id, patch) => actions.updateTask(id, patch)}
                      onPatchMany={(ids, patch) => actions.updateManyTasks(ids, patch)}
                      onAdd={openNewTask}
                    />
                  ) : null}
                  {workView === "calendar" ? (
                    <CalendarView
                      tx={tx}
                      tasks={scopedTasks}
                      onOpen={(task) => setDrawer({ isNew: false, task })}
                    />
                  ) : null}
                  {workView === "gantt" ? (
                    <GanttView
                      tx={tx}
                      tasks={scopedTasks}
                      color={project.color}
                      onOpen={(task) => setDrawer({ isNew: false, task })}
                    />
                  ) : null}
                </section>
              ) : null}

              {tab === "budget" ? (
                <BudgetTab
                  tx={tx}
                  project={project}
                  tasks={projectTasks}
                  demoMode={demoMode}
                  onPatchProject={(patch) => actions.updateProject(project.id, patch)}
                />
              ) : null}

              {tab === "resources" ? (
                <ResourcesTab
                  projects={projects}
                  tasks={tasks}
                  people={personFor}
                  demoMode={demoMode}
                />
              ) : null}

              {tab === "status" ? (
                <StatusTab
                  tx={tx}
                  project={project}
                  updates={updates}
                  people={personFor}
                  onPost={({ rag, t: text }) =>
                    actions.addUpdate({ p: project.id, rag, t: text, w: meKey, d: todayIso() })
                  }
                />
              ) : null}
            </>
          ) : null}
        </main>
      </div>

      {showCreate ? (
        <CreateProjectModal
          tx={tx}
          defaultColor={PROJECT_COLORS[projects.length % PROJECT_COLORS.length]}
          onClose={() => setShowCreate(false)}
          onSave={(input) => {
            const created = actions.addProject(input);
            setShowCreate(false);
            setMyOnly(false);
            if (created?.id) {
              setSelectedId(created.id);
              setTab("overview");
            }
          }}
        />
      ) : null}

      {drawer && project ? (
        <TaskDrawer
          key={drawer.task.id}
          tx={tx}
          task={drawerTask}
          isNew={drawer.isNew}
          projectTasks={projectTasks}
          people={demoMode ? DEMO_PW_PEOPLE : {}}
          demoMode={demoMode}
          ownerOptions={ownerOptions}
          meKey={meKey}
          onClose={() => setDrawer(null)}
          onSave={saveTask}
          onDelete={(id) => {
            actions.removeTask(id);
            setDrawer(null);
          }}
        />
      ) : null}
    </div>
  );
}
