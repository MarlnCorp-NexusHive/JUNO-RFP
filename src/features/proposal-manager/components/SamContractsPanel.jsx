import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiClipboard,
  FiDollarSign,
  FiExternalLink,
  FiPaperclip,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import {
  SAM_CONTRACT_OPPORTUNITIES,
  SAM_DATA_SNAPSHOT,
  SAM_QUICK_AGENCIES,
  SAM_SET_ASIDES,
  SAM_SOURCE_LABEL,
  filterSamOpportunities,
} from "../data/samContractOpportunities";

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

function daysUntil(iso) {
  if (!iso) return null;
  const parsed = Date.parse(iso);
  if (!Number.isFinite(parsed)) return null;
  return Math.ceil((parsed - Date.now()) / (24 * 60 * 60 * 1000));
}

function money(n, label) {
  if (label) return label;
  if (n == null || n === "") return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n));
}

function urgencyTone(days) {
  if (days == null) return "";
  if (days < 0) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (days <= 7) return "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200";
  if (days <= 14) return "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100";
  if (days <= 30) return "bg-yellow-100 text-yellow-950 dark:bg-yellow-950/40 dark:text-yellow-100";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function Field({ label, children }) {
  if (children == null || children === "" || (Array.isArray(children) && !children.length)) return null;
  return (
    <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50/80 p-3 dark:border-slate-700 dark:bg-slate-800/50">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {label}
      </dt>
      <dd className="mt-1.5 text-sm leading-relaxed text-slate-900 dark:text-slate-100 whitespace-pre-wrap break-words">
        {children}
      </dd>
    </div>
  );
}

export default function SamContractsPanel() {
  const { t } = useTranslation("common");
  const { isRTLMode } = useLocalization();

  const [draftKeyword, setDraftKeyword] = useState("");
  const [keyword, setKeyword] = useState("");
  const [naics, setNaics] = useState("");
  const [psc, setPsc] = useState("");
  const [agency, setAgency] = useState("");
  const [setAside, setSetAside] = useState("");
  const [noticeType, setNoticeType] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [copiedId, setCopiedId] = useState("");

  const filtered = useMemo(
    () =>
      filterSamOpportunities(SAM_CONTRACT_OPPORTUNITIES, {
        keyword,
        naics,
        psc,
        agency,
        setAside,
        noticeType,
      }),
    [keyword, naics, psc, agency, setAside, noticeType],
  );

  const filtersDirty =
    !!draftKeyword.trim() ||
    !!keyword.trim() ||
    !!naics.trim() ||
    !!psc.trim() ||
    !!agency.trim() ||
    !!setAside ||
    !!noticeType;

  const clearFilters = () => {
    setDraftKeyword("");
    setKeyword("");
    setNaics("");
    setPsc("");
    setAgency("");
    setSetAside("");
    setNoticeType("");
    setExpandedId(null);
  };

  const applySearch = (e) => {
    e?.preventDefault?.();
    setKeyword(draftKeyword.trim());
    setExpandedId(null);
  };

  const copyNotice = async (id, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 1600);
    } catch {
      /* ignore */
    }
  };

  const noticeTypes = useMemo(
    () => [...new Set(SAM_CONTRACT_OPPORTUNITIES.map((o) => o.noticeType))],
    [],
  );

  return (
    <div className="space-y-5" dir={isRTLMode ? "rtl" : "ltr"}>
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {t("proposalManagerSam.eyebrow")}
            </p>
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("proposalManagerSam.title")}
            </h2>
          </div>
          <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600">
            {t("proposalManagerSam.curatedFrom", {
              source: SAM_SOURCE_LABEL,
              date: SAM_DATA_SNAPSHOT,
            })}
          </p>
        </div>
      </header>

      <section className="sticky top-0 z-20 -mx-1 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
        <form className="space-y-3" onSubmit={applySearch}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerSam.keyword")}
              </span>
              <div className="relative">
                <FiSearch
                  aria-hidden
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRTLMode ? "right-3" : "left-3"}`}
                />
                <input
                  value={draftKeyword}
                  onChange={(e) => setDraftKeyword(e.target.value)}
                  placeholder={t("proposalManagerSam.keywordPlaceholder")}
                  className={`${inputClass} ${isRTLMode ? "pr-10 pl-10" : "pl-10 pr-10"}`}
                />
                {draftKeyword && (
                  <button
                    type="button"
                    onClick={() => setDraftKeyword("")}
                    className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 ${isRTLMode ? "left-2" : "right-2"}`}
                    aria-label={t("proposalManagerGrants.clearKeyword")}
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </label>

            <label className="w-full lg:w-32">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerSam.naics")}
              </span>
              <input
                value={naics}
                onChange={(e) => setNaics(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="541512"
                className={inputClass}
              />
            </label>

            <label className="w-full lg:w-28">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerSam.psc")}
              </span>
              <input
                value={psc}
                onChange={(e) => setPsc(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="DA01"
                className={inputClass}
              />
            </label>

            <label className="w-full lg:w-36">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerSam.agency")}
              </span>
              <input
                value={agency}
                onChange={(e) => setAgency(e.target.value.toUpperCase())}
                placeholder="DHS, DOD…"
                className={inputClass}
              />
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 lg:flex-none"
              >
                <FiSearch aria-hidden />
                {t("proposalManagerGrants.search")}
              </button>
              {filtersDirty && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {t("proposalManagerGrants.clearFilters")}
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerSam.noticeType")}
              </span>
              <select
                value={noticeType}
                onChange={(e) => setNoticeType(e.target.value)}
                className={inputClass}
              >
                <option value="">{t("proposalManagerSam.anyNoticeType")}</option>
                {noticeTypes.map((nt) => (
                  <option key={nt} value={nt}>
                    {nt}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerSam.setAside")}
              </span>
              <select
                value={setAside}
                onChange={(e) => setSetAside(e.target.value)}
                className={inputClass}
              >
                <option value="">{t("proposalManagerSam.anySetAside")}</option>
                {SAM_SET_ASIDES.map((sa) => (
                  <option key={sa} value={sa}>
                    {sa}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{t("proposalManagerSam.quickAgencies")}</span>
            {SAM_QUICK_AGENCIES.map((code) => {
              const active = agency.trim().toUpperCase() === code;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setAgency(active ? "" : code)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {code}
                </button>
              );
            })}
            <span className="mx-1 text-slate-300">·</span>
            <span className="text-xs font-medium text-slate-500">{t("proposalManagerSam.quickNaics")}</span>
            {["541512", "541519", "518210"].map((code) => {
              const active = naics === code;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setNaics(active ? "" : code)}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </form>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          {t("proposalManagerSam.results", { count: filtered.length })}
        </p>
        <p className="text-xs text-slate-500">{t("proposalManagerSam.combineHint")}</p>
      </div>

      {!filtered.length ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-600">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {t("proposalManagerSam.empty")}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t("proposalManagerSam.emptyHint")}</p>
          {filtersDirty && (
            <button
              type="button"
              onClick={clearFilters}
              className="mt-4 text-sm font-semibold text-indigo-700 dark:text-indigo-300"
            >
              {t("proposalManagerGrants.clearFilters")}
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((opp) => {
            const open = expandedId === opp.id;
            const days = daysUntil(opp.responseDeadline);
            return (
              <li
                key={opp.id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(open ? null : opp.id)}
                  className="flex w-full items-start gap-3 p-4 text-start hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500 dark:hover:bg-slate-800/50"
                  aria-expanded={open}
                >
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-indigo-800 ring-1 ring-indigo-100 dark:bg-indigo-950/50 dark:text-indigo-200 dark:ring-indigo-800">
                        {opp.noticeType}
                      </span>
                      <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 ring-1 ring-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200">
                        {opp.status}
                      </span>
                      {opp.setAside && opp.setAside !== "None" && (
                        <span className="rounded-md bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-900 ring-1 ring-violet-100 dark:bg-violet-950/40 dark:text-violet-200">
                          {opp.setAside}
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold leading-snug text-slate-900 dark:text-white">
                      {opp.title}
                    </h3>
                    <p className="text-xs text-slate-500">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{opp.noticeId}</span>
                      {" · "}
                      {opp.agencyCode} · {opp.office}
                    </p>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        NAICS {opp.naics}
                      </span>
                      <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                        PSC {opp.psc}
                      </span>
                      {opp.responseDeadline && (
                        <span
                          className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-semibold ${urgencyTone(days)}`}
                        >
                          <FiCalendar aria-hidden className="opacity-70" />
                          {days == null
                            ? opp.responseDeadline
                            : days < 0
                              ? t("proposalManagerGrants.pastDue")
                              : t("proposalManagerGrants.daysLeft", { count: days })}
                        </span>
                      )}
                      {(opp.awardCeiling != null || opp.awardCeilingLabel) && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-slate-100 px-2 py-0.5 font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                          <FiDollarSign aria-hidden className="opacity-60" />
                          {money(opp.awardCeiling, opp.awardCeilingLabel)}
                        </span>
                      )}
                    </div>
                  </div>
                  <FiChevronDown
                    aria-hidden
                    className={`mt-1 shrink-0 text-slate-400 transition ${open ? "rotate-180" : ""}`}
                  />
                </button>

                {open && (
                  <div className="space-y-4 border-t border-slate-100 px-4 py-4 dark:border-slate-700">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={opp.samUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500"
                      >
                        {t("proposalManagerSam.openOnSam")}
                        <FiExternalLink aria-hidden />
                      </a>
                      <button
                        type="button"
                        onClick={() => copyNotice(opp.id, opp.noticeId)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-800 dark:text-indigo-300"
                      >
                        {copiedId === opp.id ? <FiCheck aria-hidden /> : <FiClipboard aria-hidden />}
                        {copiedId === opp.id
                          ? t("proposalManagerGrants.copied")
                          : t("proposalManagerSam.copyNoticeId")}
                      </button>
                    </div>

                    {(opp.awardCeiling != null || opp.awardFloor != null || opp.awardCeilingLabel) && (
                      <div className="grid gap-2 sm:grid-cols-3">
                        {(opp.awardCeiling != null || opp.awardCeilingLabel) && (
                          <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {t("proposalManagerSam.awardCeiling")}
                            </p>
                            <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                              {money(opp.awardCeiling, opp.awardCeilingLabel)}
                            </p>
                          </div>
                        )}
                        {opp.awardFloor != null && (
                          <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {t("proposalManagerSam.awardFloor")}
                            </p>
                            <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                              {money(opp.awardFloor)}
                            </p>
                          </div>
                        )}
                        {opp.periodOfPerformance && (
                          <div className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                              {t("proposalManagerSam.period")}
                            </p>
                            <p className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                              {opp.periodOfPerformance}
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      <Field label={t("proposalManagerSam.department")}>{opp.department}</Field>
                      <Field label={t("proposalManagerSam.subtier")}>{opp.subtier}</Field>
                      <Field label={t("proposalManagerSam.office")}>{opp.office}</Field>
                      <Field label={t("proposalManagerSam.naics")}>
                        {opp.naics} — {opp.naicsTitle}
                      </Field>
                      <Field label={t("proposalManagerSam.psc")}>
                        {opp.psc} — {opp.pscTitle}
                      </Field>
                      <Field label={t("proposalManagerSam.setAside")}>{opp.setAside}</Field>
                      <Field label={t("proposalManagerSam.posted")}>{opp.postedDate}</Field>
                      <Field label={t("proposalManagerSam.responseDue")}>
                        {opp.responseDeadline || t("proposalManagerSam.noDeadline")}
                      </Field>
                      <Field label={t("proposalManagerSam.place")}>{opp.placeOfPerformance}</Field>
                    </dl>

                    <section className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {t("proposalManagerSam.description")}
                      </h4>
                      <p className="mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap">
                        {opp.description}
                      </p>
                      {opp.notes && (
                        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                          {opp.notes}
                        </p>
                      )}
                    </section>

                    {!!opp.contacts?.length && (
                      <section className="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {t("proposalManagerSam.contacts")}
                        </h4>
                        <ul className="mt-2 space-y-2 text-sm text-slate-800 dark:text-slate-100">
                          {opp.contacts.map((c, i) => (
                            <li key={i}>
                              <span className="font-semibold">{c.name}</span>
                              {c.role ? ` — ${c.role}` : ""}
                              {c.email ? (
                                <>
                                  <br />
                                  <a
                                    href={`mailto:${c.email}`}
                                    className="text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
                                  >
                                    {c.email}
                                  </a>
                                </>
                              ) : null}
                              {c.phone ? ` · ${c.phone}` : ""}
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}

                    {!!opp.attachments?.length && (
                      <section className="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
                        <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <FiPaperclip aria-hidden />
                          {t("proposalManagerSam.attachments")}
                        </h4>
                        <ul className="mt-2 space-y-1 text-sm text-slate-800 dark:text-slate-100">
                          {opp.attachments.map((a, i) => (
                            <li key={i}>
                              {a.name}
                              {a.updated ? (
                                <span className="text-xs text-slate-500"> · {a.updated}</span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                        <p className="mt-2 text-[11px] text-slate-500">
                          {t("proposalManagerSam.attachmentsHint")}
                        </p>
                      </section>
                    )}

                    {!!opp.keywords?.length && (
                      <div className="flex flex-wrap gap-1.5">
                        {opp.keywords.map((k) => (
                          <span
                            key={k}
                            className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          >
                            {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
