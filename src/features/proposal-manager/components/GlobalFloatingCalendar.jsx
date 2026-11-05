import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { FiCalendar, FiExternalLink, FiX } from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import {
  loadCalendarBundle,
  resolveCalendarWorkspaceTarget,
  toFullCalendarEvent,
} from "../services/proposalManagerCalendarService.js";
import { subscribeShortlist } from "../services/shortlistStore.js";
import { subscribeAwardManagement } from "../services/awardManagementStore.js";
import { subscribePursuit } from "../services/grantPursuitStore.js";
import { WORKSPACE_DOCS_CHANGED_EVENT } from "../services/proposalManagerStorage.js";
import {
  GRANARY_BTN_SECONDARY,
  GRANARY_CARD,
  GRANARY_CHIP,
} from "../../../styles/granarySurfaces.js";

const TYPE_FILTERS = ["all", "deadline", "meeting", "milestone", "assignment", "review", "task"];

function eventStartDay(ev) {
  return String(ev.start || "").slice(0, 10);
}

function daysFromToday(iso, now = new Date()) {
  if (!iso) return null;
  const start = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(start.getTime())) return null;
  const today = new Date(now);
  today.setHours(12, 0, 0, 0);
  return Math.round((start.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
}

function sourceLabelKey(source) {
  const map = {
    shortlist: "sourceShortlist",
    assignment: "sourceAssignment",
    "source-doc": "sourceDoc",
    award: "sourceAward",
    pursuit: "sourcePursuit",
    "grant_brief": "sourcePursuit",
    "rfp-deadline": "sourceRfp",
    collaboration: "sourceCollab",
    api: "sourceApi",
  };
  return map[source] || "sourceOther";
}

export default function GlobalFloatingCalendar() {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const { isRTLMode } = useLocalization();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedDay, setSelectedDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedEvent, setSelectedEvent] = useState(null);
  const panelRef = useRef(null);
  const refreshTimer = useRef(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const bundle = await loadCalendarBundle({ hydrate: true });
      setEvents(Array.isArray(bundle.events) ? bundle.events : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const scheduleRefresh = useCallback(() => {
    clearTimeout(refreshTimer.current);
    refreshTimer.current = setTimeout(() => {
      void refresh();
    }, 250);
  }, [refresh]);

  useEffect(() => {
    void refresh();
    const unsubShort = subscribeShortlist(scheduleRefresh);
    const unsubAwards = subscribeAwardManagement(scheduleRefresh);
    const unsubPursuit = subscribePursuit(scheduleRefresh);
    const onDocs = () => scheduleRefresh();
    window.addEventListener(WORKSPACE_DOCS_CHANGED_EVENT, onDocs);
    return () => {
      clearTimeout(refreshTimer.current);
      unsubShort();
      unsubAwards();
      unsubPursuit();
      window.removeEventListener(WORKSPACE_DOCS_CHANGED_EVENT, onDocs);
    };
  }, [refresh, scheduleRefresh]);

  const openEventOrWorkspace = useCallback(
    (ev) => {
      if (!ev) return;
      const target = resolveCalendarWorkspaceTarget(ev);
      if (target?.href) {
        setOpen(false);
        navigate(target.href);
        return;
      }
      setSelectedEvent(ev);
      if (ev.start) setSelectedDay(eventStartDay(ev));
    },
    [navigate],
  );

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e) => {
      if (!panelRef.current) return;
      if (panelRef.current.contains(e.target)) return;
      // Keep FAB clicks from immediately re-closing via outside handler race
      if (e.target?.closest?.("[data-floating-cal-fab]")) return;
      setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  const filtered = useMemo(() => {
    if (typeFilter === "all") return events;
    return events.filter((ev) => String(ev.type || "") === typeFilter);
  }, [events, typeFilter]);

  const fcEvents = useMemo(
    () => filtered.map((ev) => toFullCalendarEvent(ev)),
    [filtered],
  );

  const upcomingWeekCount = useMemo(() => {
    return events.filter((ev) => {
      const d = daysFromToday(eventStartDay(ev));
      return d != null && d >= 0 && d <= 7;
    }).length;
  }, [events]);

  const upcomingList = useMemo(() => {
    const dayEvents = filtered
      .filter((ev) => eventStartDay(ev) === selectedDay)
      .sort((a, b) => String(a.title).localeCompare(String(b.title)));
    if (dayEvents.length) return dayEvents;
    const today = new Date().toISOString().slice(0, 10);
    return filtered
      .filter((ev) => {
        const day = eventStartDay(ev);
        const d = daysFromToday(day);
        return day >= today && d != null && d <= 14;
      })
      .sort((a, b) => String(a.start).localeCompare(String(b.start)))
      .slice(0, 12);
  }, [filtered, selectedDay]);

  const listIsDayScoped = useMemo(
    () => filtered.some((ev) => eventStartDay(ev) === selectedDay),
    [filtered, selectedDay],
  );

  const side = isRTLMode ? "left-4" : "right-4";

  return (
    <div className={`fixed bottom-5 ${side} z-[45] flex flex-col items-end gap-3`}>
      {open ? (
        <div
          ref={panelRef}
          className={`${GRANARY_CARD} flex max-h-[min(78vh,36rem)] w-[min(100vw-2rem,22.5rem)] flex-col overflow-hidden shadow-lg dark:shadow-black/40`}
          role="dialog"
          aria-label={t("proposalManagerFloatingCalendar.panelLabel")}
        >
          <div className="flex items-center justify-between gap-2 border-b border-[#D8E0EA] px-3 py-2.5 dark:border-[#2A3548]">
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {t("proposalManagerFloatingCalendar.title")}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {loading
                  ? t("proposalManagerFloatingCalendar.loading")
                  : t("proposalManagerFloatingCalendar.subtitle", { count: filtered.length })}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={t("proposalManagerFloatingCalendar.close")}
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5 border-b border-[#D8E0EA] px-3 py-2 dark:border-[#2A3548]">
            {TYPE_FILTERS.map((id) => {
              const active = typeFilter === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTypeFilter(id)}
                  className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition ${
                    active
                      ? "bg-[#3D4F66] text-white dark:bg-[#8FA3B8] dark:text-[#0B1017]"
                      : "bg-[#F0F3F7] text-slate-600 hover:text-slate-900 dark:bg-[#2A3548] dark:text-slate-300"
                  }`}
                >
                  {t(`proposalManagerFloatingCalendar.filter.${id}`)}
                </button>
              );
            })}
          </div>

          <div className="border-b border-[#D8E0EA] px-2 py-1 dark:border-[#2A3548] [&_.fc]:text-[11px] [&_.fc-toolbar-title]:text-sm [&_.fc-button]:!rounded-md [&_.fc-button]:!border-[#B8C5D6] [&_.fc-button]:!bg-white [&_.fc-button]:!text-slate-700 [&_.fc-button-primary]:!bg-[#3D4F66] [&_.fc-button-primary]:!border-[#3D4F66] [&_.fc-daygrid-day.fc-day-today]:!bg-[#F0F3F7] dark:[&_.fc-button]:!bg-[#0B1017] dark:[&_.fc-button]:!text-slate-200 dark:[&_.fc-daygrid-day.fc-day-today]:!bg-[#2A3548]">
            <FullCalendar
              plugins={[dayGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              height={220}
              headerToolbar={{ left: "prev,next", center: "title", right: "" }}
              events={fcEvents}
              dateClick={(info) => {
                setSelectedDay(info.dateStr);
                setSelectedEvent(null);
              }}
              eventClick={(info) => {
                info.jsEvent.preventDefault();
                const raw = info.event.extendedProps || {};
                openEventOrWorkspace({
                  id: info.event.id,
                  title: info.event.title,
                  start: info.event.startStr,
                  ...raw,
                });
              }}
              dayMaxEvents={2}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
              {listIsDayScoped
                ? t("proposalManagerFloatingCalendar.dayEvents", { date: selectedDay })
                : t("proposalManagerFloatingCalendar.upcoming")}
            </p>
            {upcomingList.length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">
                {t("proposalManagerFloatingCalendar.empty")}
              </p>
            ) : (
              <ul className="space-y-1.5">
                {upcomingList.map((ev) => (
                  <li key={ev.id}>
                    <button
                      type="button"
                      onClick={() => openEventOrWorkspace(ev)}
                      className="w-full rounded-[8px] border border-transparent px-2 py-1.5 text-left hover:border-[#D8E0EA] hover:bg-[#F4F6F9] dark:hover:border-[#2A3548] dark:hover:bg-[#0B1017]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-semibold leading-snug text-slate-900 dark:text-white">
                          {ev.title}
                        </p>
                        <span className="shrink-0 text-[10px] tabular-nums text-slate-500">
                          {eventStartDay(ev)}
                        </span>
                      </div>
                      <span className={`${GRANARY_CHIP} mt-1`}>
                        {t(`proposalManagerFloatingCalendar.${sourceLabelKey(ev.source)}`)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {selectedEvent ? (
              <div className="mt-3 space-y-1 rounded-[8px] border border-[#D8E0EA] bg-[#F4F6F9] p-2.5 dark:border-[#2A3548] dark:bg-[#0B1017]">
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedEvent.title}
                </p>
                <p className="text-[11px] text-slate-500">
                  {eventStartDay(selectedEvent)}
                  {selectedEvent.description ? ` · ${selectedEvent.description}` : ""}
                </p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-[#3D4F66] dark:text-[#B8C5D6]">
                  {t(`proposalManagerFloatingCalendar.${sourceLabelKey(selectedEvent.source)}`)}
                </p>
                {resolveCalendarWorkspaceTarget(selectedEvent)?.href ? (
                  <button
                    type="button"
                    onClick={() => openEventOrWorkspace(selectedEvent)}
                    className="mt-1 text-[11px] font-semibold text-[#3D4F66] underline dark:text-[#B8C5D6]"
                  >
                    {t("proposalManagerFloatingCalendar.openWorkspace")}
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="border-t border-[#D8E0EA] p-2.5 dark:border-[#2A3548]">
            <Link
              to="/app/meetings-calendar"
              onClick={() => setOpen(false)}
              className={`${GRANARY_BTN_SECONDARY} w-full text-xs`}
            >
              {t("proposalManagerFloatingCalendar.openFull")}
              <FiExternalLink className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>
        </div>
      ) : null}

      <button
        type="button"
        data-floating-cal-fab
        aria-expanded={open}
        aria-label={t("proposalManagerFloatingCalendar.open")}
        onClick={() => {
          setOpen((v) => !v);
          if (!open) void refresh();
        }}
        className="relative inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#3D4F66] text-white shadow-lg transition hover:bg-[#2A3548] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3D4F66] dark:bg-[#8FA3B8] dark:text-[#0B1017] dark:hover:bg-[#B8C5D6]"
      >
        <FiCalendar className="h-5 w-5" aria-hidden />
        {upcomingWeekCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
            {upcomingWeekCount > 99 ? "99+" : upcomingWeekCount}
          </span>
        ) : null}
      </button>
    </div>
  );
}
