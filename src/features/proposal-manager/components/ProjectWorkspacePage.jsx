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

function KanbanView({ tx, tasks, people, onOpen, onAdd, onMove }) {
  const [dragOver, setDragOver] = useState("");
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
      {TASK_STATUSES.map((status) => {
        const col = tasks.filter((t) => t.status === status);
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
            <div className="flex items-center justify-between px-1">
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${STATUS_TONE[status]}`}>
                {tx(`statuses.${status}`, STATUS_DEFAULTS[status])}
              </span>
              <span className="text-[11px] font-semibold tabular-nums text-slate-500">{col.length}</span>
            </div>
            {col.map((task) => {
              const subDone = task.sub.filter((s) => s.d).length;
              return (
                <article
                  key={task.id}
                  draggable
                  onDragStart={(e) => e.dataTransfer.setData("text/plain", task.id)}
                  onClick={() => onOpen(task)}
                  className={`${GRANARY_CARD} cursor-pointer space-y-2 p-2.5 transition hover:border-[#3D4F66]/40`}
                >
                  <p className="text-sm font-medium leading-snug text-slate-900 dark:text-white">{task.title}</p>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${PRIORITY_TONE[task.pri]}`}>
                      {tx(`priorities.${task.pri}`, PRIORITY_DEFAULTS[task.pri])}
                    </span>
                    {task.ms ? <FiFlag className="h-3 w-3 text-amber-600" aria-hidden /> : null}
                    {task.due ? (
                      <span className={isOverdue(task) ? "font-semibold text-red-600" : "text-slate-500"}>
                        {fmtDate(task.due)}
                      </span>
                    ) : null}
                    {task.sub.length > 0 ? (
                      <span className="inline-flex items-center gap-0.5 text-slate-500">
                        <FiCheckSquare className="h-3 w-3" aria-hidden />
                        {subDone}/{task.sub.length}
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
            <button
              type="button"
              onClick={() => onAdd(status)}
              className="mt-auto inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-semibold text-[#3D4F66] hover:bg-white dark:text-[#B8C5D6] dark:hover:bg-[#151D2A]"
            >
              <FiPlus className="h-3.5 w-3.5" aria-hidden />
              {tx("addTask", "Add task")}
            </button>
          </div>
        );
      })}
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

function TableView({ tx, tasks, people, demoMode, ownerOptions, onOpen, onPatch, onAdd }) {
  const selectCls =
    "w-full rounded border border-transparent bg-transparent px-1 py-1 text-sm text-slate-900 outline-none hover:border-[#D8E0EA] focus:border-[#3D4F66] dark:text-white dark:hover:border-[#2A3548] dark:[&>option]:bg-[#151D2A]";
  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#D8E0EA] text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-[#2A3548] dark:text-slate-400">
              <th className="px-1.5 py-2">{tx("colTitle", "Title")}</th>
              <th className="px-1.5 py-2">{tx("colStatus", "Status")}</th>
              <th className="px-1.5 py-2">{tx("colOwner", "Owner")}</th>
              <th className="px-1.5 py-2">{tx("colPriority", "Priority")}</th>
              <th className="px-1.5 py-2">{tx("colStart", "Start")}</th>
              <th className="px-1.5 py-2">{tx("colDue", "Due")}</th>
              <th className="px-1.5 py-2">{tx("colEst", "Est. hrs")}</th>
              <th className="px-1.5 py-2"><span className="sr-only">{tx("editTask", "Edit task")}</span></th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task) => (
              <tr key={task.id} className="border-b border-[#D8E0EA]/80 last:border-0 dark:border-[#2A3548]/80">
                <td className="min-w-[14rem] px-1 py-1">
                  <CellInput value={task.title} onCommit={(v) => v.trim() && onPatch(task.id, { title: v })} />
                </td>
                <td className="px-1 py-1">
                  <select value={task.status} onChange={(e) => onPatch(task.id, { status: e.target.value })} className={selectCls}>
                    {TASK_STATUSES.map((s) => (<option key={s} value={s}>{tx(`statuses.${s}`, STATUS_DEFAULTS[s])}</option>))}
                  </select>
                </td>
                <td className="px-1 py-1">
                  {demoMode ? (
                    <select value={task.owner} onChange={(e) => onPatch(task.id, { owner: e.target.value })} className={selectCls}>
                      <option value="">{tx("unassigned", "Unassigned")}</option>
                      {Object.entries(DEMO_PW_PEOPLE).map(([key, p]) => (<option key={key} value={key}>{p.n}</option>))}
                    </select>
                  ) : (
                    <CellInput value={task.owner} list="pw-owner-options" onCommit={(v) => onPatch(task.id, { owner: v })} />
                  )}
                </td>
                <td className="px-1 py-1">
                  <select value={task.pri} onChange={(e) => onPatch(task.id, { pri: e.target.value })} className={selectCls}>
                    {TASK_PRIORITIES.map((p) => (<option key={p} value={p}>{tx(`priorities.${p}`, PRIORITY_DEFAULTS[p])}</option>))}
                  </select>
                </td>
                <td className="px-1 py-1"><CellInput type="date" value={task.start} onCommit={(v) => onPatch(task.id, { start: v })} /></td>
                <td className="px-1 py-1">
                  <CellInput
                    type="date"
                    value={task.due}
                    onCommit={(v) => onPatch(task.id, { due: v })}
                    className={isOverdue(task) ? "font-semibold !text-red-600" : ""}
                  />
                </td>
                <td className="w-20 px-1 py-1">
                  <CellInput type="number" min={0} value={task.est} onCommit={(v) => onPatch(task.id, { est: Number(v) || 0 })} />
                </td>
                <td className="px-1 py-1 text-right">
                  <button
                    type="button"
                    onClick={() => onOpen(task)}
                    className="rounded-md px-2 py-1 text-xs font-semibold text-[#3D4F66] hover:bg-[#F0F3F7] dark:text-[#B8C5D6] dark:hover:bg-[#2A3548]"
                  >
                    {tx("details", "Details")}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!demoMode ? (
        <datalist id="pw-owner-options">
          {ownerOptions.map((o) => (<option key={o} value={o} />))}
        </datalist>
      ) : null}
      {tasks.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">{tx("noTasks", "No tasks yet.")}</p>
      ) : null}
      <button type="button" className={GRANARY_BTN_SECONDARY} onClick={() => onAdd("todo")}>
        <FiPlus className="h-4 w-4" aria-hidden />
        {tx("addTask", "Add task")}
      </button>
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

function BudgetTab({ tx, project, tasks, onPatchProject }) {
  const total = projectTotal(project);
  const spentAmt = Math.round((total * project.spent) / 100);
  const remaining = Math.max(0, total - spentAmt);
  const elapsed = timePct(project);
  const totalHours = tasks.reduce((s, t) => s + (Number(t.est) || 0), 0);
  const hoursByStatus = TASK_STATUSES.map((s) => [
    s,
    tasks.filter((t) => t.status === s).reduce((sum, t) => sum + (Number(t.est) || 0), 0),
  ]);
  const burnWarn = project.spent - elapsed > 10;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className={`${GRANARY_CARD} space-y-3 p-4`}>
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
          {project.kind === "Proposal" ? tx("fieldBudgetShort", "Prep budget") : tx("fieldAmountShort", "Award amount")}
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            [tx("budgetTotal", "Total"), formatUsdCompact(total)],
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
          <Bar label={tx("legendSpent", "Spent")} pct={project.spent} className="bg-[#3D4F66] dark:bg-[#8FA3B8]" />
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
              key={`s-${project.spent}`}
              type="number"
              min={0}
              max={100}
              defaultValue={project.spent}
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
  const [workView, setWorkView] = useState("kanban"); // kanban | table (schedule views live under Meetings & Calendar)
  useEffect(() => {
    if (workView !== "kanban" && workView !== "table") setWorkView("kanban");
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
                  ["work", tx("tabs.work", "Work")],
                  ["budget", tx("tabs.budget", "Budget")],
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
                        ["kanban", FiColumns, tx("views.kanban", "Kanban")],
                        ["table", FiList, tx("views.table", "Table")],
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

                  {workView === "kanban" ? (
                    <KanbanView
                      tx={tx}
                      tasks={scopedTasks}
                      people={personFor}
                      onOpen={(task) => setDrawer({ isNew: false, task })}
                      onAdd={openNewTask}
                      onMove={(id, status) => actions.updateTask(id, { status })}
                    />
                  ) : null}
                  {workView === "table" ? (
                    <TableView
                      tx={tx}
                      tasks={scopedTasks}
                      people={personFor}
                      demoMode={demoMode}
                      ownerOptions={ownerOptions}
                      onOpen={(task) => setDrawer({ isNew: false, task })}
                      onPatch={(id, patch) => actions.updateTask(id, patch)}
                      onAdd={openNewTask}
                    />
                  ) : null}
                </section>
              ) : null}

              {tab === "budget" ? (
                <BudgetTab
                  tx={tx}
                  project={project}
                  tasks={projectTasks}
                  onPatchProject={(patch) => actions.updateProject(project.id, patch)}
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
