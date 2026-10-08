import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckSquare,
  FiExternalLink,
  FiLoader,
  FiRefreshCw,
  FiSquare,
  FiX,
} from "react-icons/fi";
import { getGrantBrief, regenerateGrantBrief } from "../../../services/api.js";
import {
  getPursuitState,
  startPursuitFromBrief,
  subscribePursuit,
  syncBriefDatesToCalendar,
  togglePursuitCheckItem,
} from "../services/grantPursuitStore.js";

function confidenceTone(level) {
  if (level === "high") return "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-200";
  if (level === "low") return "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function Section({ title, children }) {
  if (!children) return null;
  return (
    <section className="space-y-2">
      <h3 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h3>
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-100">
        {children}
      </div>
    </section>
  );
}

/**
 * Shared Grant Pursuit Brief viewer — generate-once cache, optional pursuit checklist + calendar.
 * readOnly hides Start pursuit / calendar / checklist edits (view template only).
 */
export default function GrantPursuitBriefModal({
  open,
  onClose,
  source,
  opportunityId,
  opportunity = {},
  readOnly = false,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const titleId = useId();
  const opportunityRef = useRef(opportunity);
  opportunityRef.current = opportunity;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [brief, setBrief] = useState(null);
  const [cached, setCached] = useState(false);
  const [stale, setStale] = useState(false);
  const [pursuit, setPursuit] = useState(null);
  const [actionBusy, setActionBusy] = useState("");
  const [actionMsg, setActionMsg] = useState("");

  const refreshPursuit = useCallback((key) => {
    setPursuit(key ? getPursuitState(key) : null);
  }, []);

  const loadBrief = useCallback(
    async ({ refresh = false } = {}) => {
      if (!source || !opportunityId) return;
      const snap = opportunityRef.current || {};
      setLoading(true);
      setError("");
      setActionMsg("");
      try {
        const fn = refresh ? regenerateGrantBrief : getGrantBrief;
        const data = await fn({
          source,
          opportunityId,
          opportunity: {
            ...snap,
            id: opportunityId,
            title: snap.title,
            number: snap.number,
            agency: snap.agency,
            deadline: snap.deadline,
          },
          forceRefresh: refresh,
        });
        setBrief(data.brief || null);
        setCached(Boolean(data.cached));
        setStale(Boolean(data.stale));
        refreshPursuit(data.brief?.key);
      } catch (err) {
        setError(err?.response?.data?.error || err?.message || t("proposalManagerGrants.briefFailed"));
        setBrief(null);
      } finally {
        setLoading(false);
      }
    },
    [source, opportunityId, refreshPursuit, t],
  );

  useEffect(() => {
    if (!open) return undefined;
    setBrief(null);
    setError("");
    loadBrief();
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, source, opportunityId, loadBrief, onClose]);

  useEffect(() => {
    if (!open || !brief?.key) return undefined;
    refreshPursuit(brief.key);
    return subscribePursuit(() => refreshPursuit(brief.key));
  }, [open, brief?.key, refreshPursuit]);

  if (!open || typeof document === "undefined") return null;

  const handleStartPursuit = () => {
    if (!brief || readOnly) return;
    const state = startPursuitFromBrief(brief);
    setPursuit(state);
    setActionMsg(t("proposalManagerGrants.briefPursuitStarted"));
    onClose?.();
    if (state?.briefKey) {
      navigate(`/app/workspace?grantPursuit=${encodeURIComponent(state.briefKey)}`);
    }
  };

  const handleToggleCheck = (itemId) => {
    if (readOnly || !brief?.key) return;
    setPursuit(togglePursuitCheckItem(brief.key, itemId));
  };

  const handleCalendarSync = async () => {
    if (!brief || readOnly) return;
    setActionBusy("calendar");
    setActionMsg("");
    try {
      const { synced } = await syncBriefDatesToCalendar(brief);
      setActionMsg(
        synced > 0
          ? t("proposalManagerGrants.briefCalendarSynced", { count: synced })
          : t("proposalManagerGrants.briefCalendarNone"),
      );
      refreshPursuit(brief.key);
    } catch (err) {
      setActionMsg(err?.message || t("proposalManagerGrants.briefCalendarFailed"));
    } finally {
      setActionBusy("");
    }
  };

  const checklistItems = pursuit?.checklist?.length
    ? pursuit.checklist
    : (brief?.checklistTemplate || []).map((item) => ({ ...item, done: false }));
  const checklistEditable = Boolean(pursuit?.checklist?.length) && !readOnly;

  return createPortal(
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/50 p-0 sm:items-center sm:p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3 dark:border-slate-700 sm:px-5">
          <div className="min-w-0 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              {t("proposalManagerGrants.briefEyebrow")}
            </p>
            <h2 id={titleId} className="text-base font-semibold leading-snug text-slate-900 dark:text-white sm:text-lg">
              {brief?.title || opportunity.title || t("proposalManagerGrants.briefTitle")}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {[brief?.snapshot?.number || opportunity.number, brief?.snapshot?.agency || opportunity.agency]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800"
            aria-label={t("proposalManagerGrants.closeDetail")}
          >
            <FiX className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300" aria-busy="true">
              <FiLoader className="h-4 w-4 animate-spin" aria-hidden />
              {t("proposalManagerGrants.briefLoading")}
            </div>
          )}

          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-100">
              <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden />
              <div>
                <p>{error}</p>
                <button type="button" onClick={() => loadBrief()} className="mt-2 font-semibold underline underline-offset-2">
                  {t("proposalManagerGrants.retry")}
                </button>
              </div>
            </div>
          )}

          {!loading && brief && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-full px-2.5 py-0.5 font-semibold ${confidenceTone(brief.confidence)}`}>
                  {t(`proposalManagerGrants.briefConfidence.${brief.confidence || "medium"}`)}
                </span>
                {cached ? (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {t("proposalManagerGrants.briefCached")}
                  </span>
                ) : (
                  <span className="rounded-full bg-indigo-100 px-2.5 py-0.5 font-medium text-indigo-800 dark:bg-indigo-950/50 dark:text-indigo-200">
                    {t("proposalManagerGrants.briefFresh")}
                  </span>
                )}
                {stale ? (
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
                    {t("proposalManagerGrants.briefStale")}
                  </span>
                ) : null}
                {brief.snapshot?.deadline ? (
                  <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                    <FiCalendar aria-hidden />
                    {brief.snapshot.deadline}
                  </span>
                ) : null}
              </div>

              <Section title={t("proposalManagerGrants.eligibility")}>
                {brief.eligibility?.summary ? <p className="leading-relaxed">{brief.eligibility.summary}</p> : null}
                {brief.eligibility?.fitNotes ? (
                  <p className="mt-2 leading-relaxed text-slate-600 dark:text-slate-300">{brief.eligibility.fitNotes}</p>
                ) : null}
                {brief.eligibility?.watchOuts?.length ? (
                  <ul className="mt-2 list-disc space-y-1 ps-4">
                    {brief.eligibility.watchOuts.map((w) => (
                      <li key={w}>{w}</li>
                    ))}
                  </ul>
                ) : null}
              </Section>

              <Section title={t("proposalManagerGrants.briefHowToApply")}>
                {brief.howToApply?.portal ? (
                  <p>
                    <span className="font-semibold">{t("proposalManagerGrants.briefPortal")}: </span>
                    {brief.howToApply.portal}
                  </p>
                ) : null}
                {brief.howToApply?.packageType ? (
                  <p className="mt-1">
                    <span className="font-semibold">{t("proposalManagerGrants.briefPackage")}: </span>
                    {brief.howToApply.packageType}
                  </p>
                ) : null}
                {brief.howToApply?.submissionPath ? (
                  <p className="mt-2 leading-relaxed">{brief.howToApply.submissionPath}</p>
                ) : null}
                {brief.howToApply?.notes ? (
                  <p className="mt-2 text-slate-600 dark:text-slate-300">{brief.howToApply.notes}</p>
                ) : null}
              </Section>

              {brief.steps?.length ? (
                <Section title={t("proposalManagerGrants.briefSteps")}>
                  <ol className="space-y-3">
                    {brief.steps.map((step, i) => (
                      <li key={step.id || i} className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-bold text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-200">
                          {step.order || i + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{step.title}</p>
                          {step.detail ? <p className="mt-0.5 text-slate-600 dark:text-slate-300">{step.detail}</p> : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </Section>
              ) : null}

              {brief.dates?.length ? (
                <Section title={t("proposalManagerGrants.briefDates")}>
                  <ul className="space-y-2">
                    {brief.dates.map((d) => (
                      <li key={d.id || d.label} className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium">{d.label}</span>
                        <span className="text-slate-600 dark:text-slate-300">{d.date || "—"}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {brief.documents?.length ? (
                <Section title={t("proposalManagerGrants.briefDocuments")}>
                  <ul className="space-y-2">
                    {brief.documents.map((d) => (
                      <li key={d.id || d.name}>
                        <span className="font-medium">{d.name}</span>
                        {d.required === false ? (
                          <span className="ms-2 text-xs text-slate-500">{t("proposalManagerGrants.briefOptional")}</span>
                        ) : (
                          <span className="ms-2 text-xs font-semibold text-rose-700 dark:text-rose-300">
                            {t("proposalManagerGrants.briefRequired")}
                          </span>
                        )}
                        {d.notes ? <p className="text-slate-600 dark:text-slate-300">{d.notes}</p> : null}
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {brief.contacts?.length ? (
                <Section title={t("proposalManagerGrants.contact")}>
                  <ul className="space-y-2">
                    {brief.contacts.map((c) => (
                      <li key={c.id || c.email || c.name}>
                        <p className="font-medium">{c.name || c.role}</p>
                        <p className="text-slate-600 dark:text-slate-300">
                          {[c.role, c.email, c.phone].filter(Boolean).join(" · ")}
                        </p>
                        {c.notes ? <p className="text-xs text-slate-500">{c.notes}</p> : null}
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}

              {(brief.followUp?.afterSubmit?.length || brief.followUp?.tips?.length) ? (
                <Section title={t("proposalManagerGrants.briefFollowUp")}>
                  {brief.followUp.afterSubmit?.length ? (
                    <ul className="list-disc space-y-1 ps-4">
                      {brief.followUp.afterSubmit.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  ) : null}
                  {brief.followUp.tips?.length ? (
                    <ul className="mt-2 list-disc space-y-1 ps-4 text-slate-600 dark:text-slate-300">
                      {brief.followUp.tips.map((x) => (
                        <li key={x}>{x}</li>
                      ))}
                    </ul>
                  ) : null}
                </Section>
              ) : null}

              {checklistItems.length ? (
                <Section
                  title={
                    checklistEditable
                      ? t("proposalManagerGrants.briefChecklist")
                      : t("proposalManagerGrants.briefChecklistReadonly")
                  }
                >
                  <ul className="space-y-2">
                    {checklistItems.map((item) => (
                      <li key={item.id}>
                        {checklistEditable ? (
                          <button
                            type="button"
                            onClick={() => handleToggleCheck(item.id)}
                            className="flex w-full items-start gap-2 text-start hover:text-indigo-700 dark:hover:text-indigo-300"
                          >
                            {item.done ? (
                              <FiCheckSquare className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden />
                            ) : (
                              <FiSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
                            )}
                            <span className={item.done ? "line-through text-slate-500" : ""}>{item.label}</span>
                          </button>
                        ) : (
                          <div className="flex items-start gap-2">
                            <FiSquare className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                            <span>{item.label}</span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </Section>
              ) : null}
            </>
          )}
        </div>

        <footer className="flex shrink-0 flex-col gap-2 border-t border-slate-200 px-4 py-3 dark:border-slate-700 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
          <div className="min-h-[1.25rem] text-xs text-slate-500 dark:text-slate-400">{actionMsg}</div>
          <div className="flex flex-wrap items-center gap-2">
            {brief?.snapshot?.url ? (
              <a
                href={brief.snapshot.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                {t("proposalManagerGrants.briefOpenPortal")}
                <FiExternalLink aria-hidden />
              </a>
            ) : null}
            {!readOnly && brief && !pursuit?.startedAt ? (
              <button
                type="button"
                onClick={handleStartPursuit}
                className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
              >
                {t("proposalManagerGrants.briefStartPursuit")}
              </button>
            ) : null}
            {!readOnly && brief ? (
              <button
                type="button"
                disabled={actionBusy === "calendar"}
                onClick={handleCalendarSync}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <FiCalendar aria-hidden />
                {t("proposalManagerGrants.briefAddToCalendar")}
              </button>
            ) : null}
            {!readOnly ? (
              <button
                type="button"
                disabled={loading}
                onClick={() => loadBrief({ refresh: true })}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              >
                <FiRefreshCw className={loading ? "animate-spin" : ""} aria-hidden />
                {t("proposalManagerGrants.briefRegenerate")}
              </button>
            ) : null}
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  );
}
