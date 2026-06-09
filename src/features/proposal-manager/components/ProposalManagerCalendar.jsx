import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import listPlugin from "@fullcalendar/list";
import interactionPlugin from "@fullcalendar/interaction";
import {
  FiCalendar,
  FiClock,
  FiFilter,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiTarget,
} from "react-icons/fi";
import { calendarApi } from "../../../services/calendarApi.js";
import {
  loadCalendarBundle,
  toFullCalendarEvent,
} from "../services/proposalManagerCalendarService.js";
import { EVENT_TYPE_ICONS } from "../services/proposalManagerCalendarMockData.js";
const TYPE_OPTIONS = [
  "all",
  "deadline",
  "meeting",
  "milestone",
  "assignment",
  "submission",
  "review",
  "task",
];

const EMPTY_FORM = {
  title: "",
  start: "",
  end: "",
  allDay: true,
  type: "meeting",
  location: "",
  description: "",
  bidName: "",
};

function typeBadgeClass(type) {
  const map = {
    deadline: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    meeting: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    milestone: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    assignment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
    submission: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    review: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300",
    task: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300",
  };
  return map[type] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
}

export default function ProposalManagerCalendar() {
  const { t } = useTranslation("common");
  const [events, setEvents] = useState([]);
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const calendarRef = useRef(null);
  const [visibleMonthLabel, setVisibleMonthLabel] = useState("");
  const [hasDemo, setHasDemo] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await loadCalendarBundle();
      setEvents(data.events);
      setTeam(data.team);
      setHasDemo(Boolean(data.hasDemo));
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not load calendar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredEvents = useMemo(() => {
    if (typeFilter === "all") return events;
    return events.filter((e) => e.type === typeFilter);
  }, [events, typeFilter]);

  const fcEvents = useMemo(
    () => filteredEvents.map(toFullCalendarEvent),
    [filteredEvents],
  );

  const eventsInVisibleMonth = useMemo(() => {
    const now = new Date();
    const monthKey =
      visibleMonthLabel ||
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    return events.filter((e) => String(e.start || "").slice(0, 7) === monthKey).length;
  }, [events, visibleMonthLabel]);

  const stats = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    let meetings = 0;
    let deadlines = 0;
    let submissions = 0;
    for (const e of events) {
      const d = new Date(String(e.start).slice(0, 10));
      if (Number.isNaN(d.getTime()) || d < now || d > weekEnd) continue;
      if (e.type === "meeting") meetings += 1;
      if (e.type === "deadline") deadlines += 1;
      if (e.type === "submission") submissions += 1;
    }
    return { meetings, deadlines, submissions, total: events.length };
  }, [events]);

  const upcomingList = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return events
      .map((e) => ({
        ...e,
        d: new Date(String(e.start).slice(0, 19)),
      }))
      .filter((e) => !Number.isNaN(e.d.getTime()) && e.d >= now)
      .sort((a, b) => a.d - b.d)
      .slice(0, 8);
  }, [events]);

  const renderEventContent = (arg) => {
    const type = arg.event.extendedProps?.type || "task";
    const icon = EVENT_TYPE_ICONS[type] || "•";
    return (
      <div className="fc-event-inner-custom flex items-center gap-1 px-1 py-0.5 overflow-hidden">
        <span className="shrink-0 text-[10px]">{icon}</span>
        <span className="truncate font-medium">{arg.event.title}</span>
      </div>
    );
  };

  const nextDeadline = useMemo(() => {
    const now = new Date();
    const upcoming = events
      .filter((e) => e.type === "deadline" && e.start)
      .map((e) => ({ ...e, d: new Date(`${String(e.start).slice(0, 10)}T12:00:00`) }))
      .filter((e) => e.d >= now)
      .sort((a, b) => a.d - b.d);
    return upcoming[0] || null;
  }, [events]);

  const openCreate = (dateStr) => {
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      start: dateStr ? `${dateStr}T09:00` : "",
      allDay: Boolean(dateStr),
    });
    setFormOpen(true);
  };

  const openEditManual = (ev) => {
    if (ev.source === "collaboration" || ev.source === "demo") {
      setSelected(ev);
      return;
    }
    setEditingId(ev.id);
    setForm({
      title: ev.title || "",
      start: ev.allDay ? String(ev.start).slice(0, 10) : ev.start?.slice(0, 16) || "",
      end: ev.end ? (ev.allDay ? String(ev.end).slice(0, 10) : ev.end.slice(0, 16)) : "",
      allDay: Boolean(ev.allDay),
      type: ev.type || "meeting",
      location: ev.location || "",
      description: ev.description || "",
      bidName: ev.bidName || "",
    });
    setFormOpen(true);
  };

  const handleEventClick = (info) => {
    const ev = info.event.extendedProps;
    setSelected(ev);
  };

  const handleDateClick = (info) => {
    openCreate(info.dateStr);
  };

  const saveForm = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const body = {
        title: form.title,
        start: form.allDay ? form.start : new Date(form.start).toISOString(),
        end: form.end
          ? form.allDay
            ? form.end
            : new Date(form.end).toISOString()
          : null,
        allDay: form.allDay,
        type: form.type,
        location: form.location || null,
        description: form.description || null,
        bidName: form.bidName || null,
      };
      if (editingId) {
        await calendarApi.updateEvent(editingId, body);
      } else {
        await calendarApi.createEvent(body);
      }
      setFormOpen(false);
      setForm(EMPTY_FORM);
      setEditingId(null);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = async () => {
    if (!selected || selected.source === "collaboration") return;
    if (!window.confirm(t("proposalManagerCalendar.confirmDelete"))) return;
    try {
      await calendarApi.deleteEvent(selected.id);
      setSelected(null);
      await refresh();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || "Delete failed");
    }
  };

  return (
    <div className="w-full space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <FiCalendar className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              {t("proposalManagerCalendar.title")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              {t("proposalManagerCalendar.subtitle")}
            </p>
            {hasDemo && (
              <span className="inline-flex mt-2 items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800/50">
                {t("proposalManagerCalendar.demoBadge")}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {nextDeadline && (
              <div className="px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40">
                <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                  {t("proposalManagerCalendar.nextDeadline")}
                </div>
                <div className="text-sm font-semibold text-red-800 dark:text-red-200 truncate max-w-[240px]">
                  {nextDeadline.title}
                </div>
                <div className="text-xs text-red-600/80 dark:text-red-300">
                  {String(nextDeadline.start).slice(0, 10)}
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => refresh()}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
            >
              <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              {t("proposalManagerCalendar.refresh")}
            </button>
            <button
              type="button"
              onClick={() => openCreate("")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center gap-2"
            >
              <FiPlus className="w-4 h-4" />
              {t("proposalManagerCalendar.addEvent")}
            </button>
          </div>
        </div>
      </motion.div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800 px-4 py-3 text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t("proposalManagerCalendar.statTotal"), value: stats.total, color: "text-gray-900 dark:text-white", bg: "bg-gray-50 dark:bg-gray-700/50" },
          { label: t("proposalManagerCalendar.statMeetings"), value: stats.meetings, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: t("proposalManagerCalendar.statDeadlines"), value: stats.deadlines, color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/20" },
          { label: t("proposalManagerCalendar.statSubmissions"), value: stats.submissions, color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/20" },
        ].map((s) => (
          <div key={s.label} className={`rounded-xl p-4 border border-gray-100 dark:border-gray-700 ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <div className="xl:col-span-3 space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <FiFilter className="w-4 h-4 text-gray-500" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              >
                {TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {t(`proposalManagerCalendar.types.${opt}`)}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2 text-xs">
                {TYPE_OPTIONS.filter((x) => x !== "all").map((type) => (
                  <span key={type} className={`px-2 py-1 rounded-full ${typeBadgeClass(type)}`}>
                    {t(`proposalManagerCalendar.types.${type}`)}
                  </span>
                ))}
              </div>
            </div>

            {!loading && events.length === 0 && (
              <div className="mb-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-4 text-sm text-gray-600 dark:text-gray-300">
                {t("proposalManagerCalendar.emptyHint")}
              </div>
            )}
            <div className="pm-calendar-theme rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: "prev,next today",
                  center: "title",
                  right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
                }}
                height={720}
                events={fcEvents}
                eventContent={renderEventContent}
                eventClick={handleEventClick}
                dateClick={handleDateClick}
                datesSet={(arg) => {
                  const d = arg.start;
                  setVisibleMonthLabel(
                    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
                  );
                }}
                editable={false}
                selectable
                nowIndicator
                eventDisplay="block"
                dayMaxEvents={3}
                moreLinkClick="popover"
                weekends
                slotMinTime="07:00:00"
                slotMaxTime="20:00:00"
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2 text-center">
              {t("proposalManagerCalendar.monthEventCount", { count: eventsInVisibleMonth })}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <FiClock className="w-5 h-5 text-blue-600" />
              {t("proposalManagerCalendar.upcoming")}
            </h2>
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {upcomingList.map((ev) => (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => setSelected(ev)}
                  className="w-full text-left rounded-xl border border-gray-100 dark:border-gray-600 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{EVENT_TYPE_ICONS[ev.type] || "•"}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">{ev.title}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {String(ev.start).slice(0, 16).replace("T", " · ")}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
              <FiUsers className="w-5 h-5 text-purple-600" />
              {t("proposalManagerCalendar.teamPanel")}
            </h2>
            {team ? (
              <>
                <div className="grid grid-cols-2 gap-2 mb-4 text-center">
                  <div className="rounded-lg bg-purple-50 dark:bg-purple-900/20 p-2">
                    <div className="text-lg font-bold text-purple-700 dark:text-purple-300">
                      {team.totals?.assigned ?? 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t("proposalManagerCalendar.inProgress")}
                    </div>
                  </div>
                  <div className="rounded-lg bg-green-50 dark:bg-green-900/20 p-2">
                    <div className="text-lg font-bold text-green-700 dark:text-green-300">
                      {team.totals?.submitted ?? 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t("proposalManagerCalendar.awaitingReview")}
                    </div>
                  </div>
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-2">
                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">
                      {team.totals?.approved ?? 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t("proposalManagerCalendar.approved")}
                    </div>
                  </div>
                  <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-2">
                    <div className="text-lg font-bold text-gray-700 dark:text-gray-200">
                      {team.totals?.unassigned ?? 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {t("proposalManagerCalendar.unassigned")}
                    </div>
                  </div>
                </div>
                <div className="space-y-3 max-h-[320px] overflow-y-auto">
                  {(team.auditors || []).map((aud) => (
                    <div
                      key={aud.id}
                      className="rounded-xl border border-gray-100 dark:border-gray-600 p-3 bg-gray-50 dark:bg-gray-700/50"
                    >
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{aud.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex flex-wrap gap-2">
                        <span>{aud.inProgress + aud.assigned} active</span>
                        <span>{aud.submitted} submitted</span>
                        <span>{aud.approved} approved</span>
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  to="/rbac/proposal-manager/rfp-collaboration"
                  className="mt-4 block text-center text-sm text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {t("proposalManagerCalendar.openCollab")}
                </Link>
              </>
            ) : (
              <p className="text-sm text-gray-500">{t("proposalManagerCalendar.teamLoading")}</p>
            )}
          </div>

          {selected && (
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-gray-900 dark:text-white">{selected.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${typeBadgeClass(selected.type)}`}>
                  {t(`proposalManagerCalendar.types.${selected.type || "task"}`)}
                </span>
              </div>
              <div className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-2">
                  <FiClock className="w-4 h-4" />
                  {String(selected.start).slice(0, 16).replace("T", " ")}
                </div>
                {selected.bidName && (
                  <div className="flex items-center gap-2">
                    <FiTarget className="w-4 h-4" />
                    {selected.bidName}
                  </div>
                )}
                {selected.assigneeNames?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4" />
                    {selected.assigneeNames.join(", ")}
                  </div>
                )}
                {selected.status && (
                  <div className="flex items-center gap-2">
                    <FiCheckCircle className="w-4 h-4" />
                    {selected.status}
                  </div>
                )}
                {selected.description && <p className="text-xs mt-2">{selected.description}</p>}
                {selected.source === "collaboration" && selected.workspaceId && (
                  <Link
                    to={`/rbac/proposal-manager/rfp-collaboration/w/${selected.workspaceId}`}
                    className="inline-block text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    {t("proposalManagerCalendar.openWorkspace")}
                  </Link>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                {selected.source !== "collaboration" && selected.source !== "rfp-deadline" && selected.source !== "demo" && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEditManual(selected)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      {t("proposalManagerCalendar.edit")}
                    </button>
                    <button
                      type="button"
                      onClick={deleteSelected}
                      className="px-3 py-1.5 text-sm rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-1"
                    >
                      <FiTrash2 className="w-3 h-3" />
                      {t("proposalManagerCalendar.delete")}
                    </button>
                  </>
                )}
                {(selected.source === "collaboration" || selected.source === "demo") && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <FiAlertCircle className="w-3 h-3" />
                    {selected.source === "demo"
                      ? t("proposalManagerCalendar.demoEvent")
                      : t("proposalManagerCalendar.autoEvent")}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
              {editingId
                ? t("proposalManagerCalendar.editEvent")
                : t("proposalManagerCalendar.addEvent")}
            </h3>
            <form onSubmit={saveForm} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t("proposalManagerCalendar.formTitle")}</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("proposalManagerCalendar.formType")}</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  >
                    {TYPE_OPTIONS.filter((x) => x !== "all").map((type) => (
                      <option key={type} value={type}>
                        {t(`proposalManagerCalendar.types.${type}`)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.allDay}
                      onChange={(e) => setForm((f) => ({ ...f, allDay: e.target.checked }))}
                    />
                    {t("proposalManagerCalendar.allDay")}
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("proposalManagerCalendar.formStart")}</label>
                  <input
                    required
                    type={form.allDay ? "date" : "datetime-local"}
                    value={form.start}
                    onChange={(e) => setForm((f) => ({ ...f, start: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("proposalManagerCalendar.formEnd")}</label>
                  <input
                    type={form.allDay ? "date" : "datetime-local"}
                    value={form.end}
                    onChange={(e) => setForm((f) => ({ ...f, end: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("proposalManagerCalendar.formBid")}</label>
                <input
                  value={form.bidName}
                  onChange={(e) => setForm((f) => ({ ...f, bidName: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("proposalManagerCalendar.formLocation")}</label>
                <input
                  value={form.location}
                  onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">{t("proposalManagerCalendar.formNotes")}</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setFormOpen(false);
                    setEditingId(null);
                  }}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-600"
                >
                  {t("proposalManagerCalendar.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {saving ? t("proposalManagerCalendar.saving") : t("proposalManagerCalendar.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .pm-calendar-theme .fc {
          font-family: inherit;
          --fc-border-color: rgb(229 231 235);
          --fc-button-bg-color: rgb(37 99 235);
          --fc-button-border-color: rgb(37 99 235);
          --fc-button-hover-bg-color: rgb(29 78 216);
          --fc-button-hover-border-color: rgb(29 78 216);
          --fc-button-active-bg-color: rgb(30 64 175);
          --fc-today-bg-color: rgb(239 246 255);
          --fc-page-bg-color: rgb(249 250 251);
          --fc-event-border-color: transparent;
          --fc-small-font-size: 0.8rem;
        }
        .dark .pm-calendar-theme .fc {
          --fc-border-color: rgb(55 65 81);
          --fc-page-bg-color: rgb(17 24 39);
          --fc-neutral-bg-color: rgb(31 41 55);
          --fc-list-event-hover-bg-color: rgb(55 65 81);
          --fc-today-bg-color: rgb(30 58 138 / 0.35);
          color: rgb(229 231 235);
        }
        .pm-calendar-theme .fc .fc-toolbar {
          padding: 0.75rem 1rem;
          gap: 0.5rem;
          flex-wrap: wrap;
        }
        .pm-calendar-theme .fc .fc-toolbar-title {
          font-size: 1.25rem;
          font-weight: 700;
        }
        .pm-calendar-theme .fc .fc-button {
          border-radius: 0.625rem;
          font-weight: 500;
          text-transform: capitalize;
          padding: 0.35rem 0.75rem;
          box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
        }
        .pm-calendar-theme .fc .fc-button-group > .fc-button {
          border-radius: 0;
        }
        .pm-calendar-theme .fc .fc-button-group > .fc-button:first-child {
          border-radius: 0.625rem 0 0 0.625rem;
        }
        .pm-calendar-theme .fc .fc-button-group > .fc-button:last-child {
          border-radius: 0 0.625rem 0.625rem 0;
        }
        .pm-calendar-theme .fc-theme-standard td,
        .pm-calendar-theme .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }
        .pm-calendar-theme .fc .fc-col-header-cell {
          padding: 0.6rem 0;
          font-weight: 600;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .pm-calendar-theme .fc .fc-col-header-cell-cushion,
        .pm-calendar-theme .fc .fc-daygrid-day-number {
          color: inherit;
          text-decoration: none;
        }
        .pm-calendar-theme .fc .fc-daygrid-day-number {
          font-weight: 600;
          padding: 0.35rem 0.5rem;
        }
        .pm-calendar-theme .fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
          background: rgb(37 99 235);
          color: white;
          border-radius: 9999px;
          width: 1.75rem;
          height: 1.75rem;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }
        .pm-calendar-theme .fc .fc-event {
          border-radius: 0.375rem;
          font-size: 0.72rem;
          border: none;
          box-shadow: 0 1px 2px rgb(0 0 0 / 0.12);
          margin-bottom: 2px;
        }
        .pm-calendar-theme .fc .fc-event:hover {
          filter: brightness(1.05);
        }
        .pm-calendar-theme .fc .fc-more-link {
          font-weight: 600;
          color: rgb(37 99 235);
        }
        .pm-calendar-theme .fc .fc-timegrid-slot {
          height: 2.25rem;
        }
        .pm-calendar-theme .fc .fc-day-sat,
        .pm-calendar-theme .fc .fc-day-sun,
        .pm-calendar-theme .fc .fc-day-sat .fc-daygrid-day-frame,
        .pm-calendar-theme .fc .fc-day-sun .fc-daygrid-day-frame,
        .pm-calendar-theme .fc .fc-non-business {
          background: var(--fc-page-bg-color) !important;
        }
        .pm-calendar-theme .fc .fc-day-sat.fc-day-today,
        .pm-calendar-theme .fc .fc-day-sun.fc-day-today {
          background: var(--fc-today-bg-color) !important;
        }
        .pm-calendar-theme .fc .fc-list-event:hover td {
          background: rgb(239 246 255);
        }
        .dark .pm-calendar-theme .fc .fc-list-event:hover td {
          background: rgb(30 58 138 / 0.2);
        }
      `}</style>
    </div>
  );
}
