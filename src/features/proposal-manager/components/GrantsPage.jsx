import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  FiAlertCircle,
  FiCalendar,
  FiCheck,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiClipboard,
  FiDollarSign,
  FiExternalLink,
  FiPaperclip,
  FiRefreshCw,
  FiSearch,
  FiX,
} from "react-icons/fi";
import { useLocalization } from "../../../hooks/useLocalization";
import { fetchFederalGrantOpportunity, searchFederalGrants } from "../../../services/api.js";

const STATUS_OPTIONS = [
  { value: "posted|forecasted", labelKey: "openAndForecasted" },
  { value: "posted", labelKey: "posted" },
  { value: "forecasted", labelKey: "forecasted" },
  { value: "closed", labelKey: "closed" },
  { value: "archived", labelKey: "archived" },
];

const QUICK_AGENCIES = ["HHS", "NSF", "ED", "USDA", "DOE", "DOD", "EPA", "DOT"];
const PAGE_SIZE = 25;

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-indigo-500/30 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500";

function daysUntil(closeDate) {
  if (!closeDate) return null;
  const parsed = Date.parse(closeDate);
  if (!Number.isFinite(parsed)) {
    const m = String(closeDate).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]));
    if (Number.isNaN(d.getTime())) return null;
    return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  }
  return Math.ceil((parsed - Date.now()) / (24 * 60 * 60 * 1000));
}

function money(value, formatted) {
  if (formatted) return formatted;
  if (value == null || value === "") return "—";
  const n = Number(value);
  if (!Number.isFinite(n)) return String(value);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function listLabels(items, key = "description") {
  if (!Array.isArray(items) || !items.length) return [];
  return items
    .map((item) => {
      if (typeof item === "string") return item;
      return item?.[key] || item?.label || item?.name || item?.id || "";
    })
    .filter(Boolean);
}

function statusTone(status) {
  switch (String(status || "").toLowerCase()) {
    case "posted":
      return "bg-emerald-100 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200 dark:ring-emerald-800";
    case "forecasted":
      return "bg-sky-100 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-200 dark:ring-sky-800";
    case "closed":
      return "bg-amber-100 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-950/50 dark:text-amber-100 dark:ring-amber-800";
    case "archived":
      return "bg-slate-200 text-slate-800 ring-1 ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600";
    default:
      return "bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200";
  }
}

function urgencyTone(days) {
  if (days == null) return "";
  if (days < 0) return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  if (days <= 7) return "bg-rose-100 text-rose-900 dark:bg-rose-950/50 dark:text-rose-200";
  if (days <= 14) return "bg-amber-100 text-amber-950 dark:bg-amber-950/50 dark:text-amber-100";
  if (days <= 30) return "bg-yellow-100 text-yellow-950 dark:bg-yellow-950/40 dark:text-yellow-100";
  return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
}

function stripHtml(input) {
  if (input == null) return "";
  let s = String(input);
  if (!s) return "";
  s = s
    .replace(/<\s*br\s*\/?\s*>/gi, "\n")
    .replace(/<\s*\/\s*p\s*>/gi, "\n")
    .replace(/<\s*p[^>]*>/gi, "")
    .replace(/<\s*\/\s*div\s*>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "• ")
    .replace(/<\s*\/\s*li\s*>/gi, "\n")
    .replace(/<\s*\/\s*h[1-6]\s*>/gi, "\n")
    .replace(/<[^>]+>/g, "");
  s = s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => {
      const code = parseInt(h, 16);
      return Number.isFinite(code) ? String.fromCharCode(code) : "";
    });
  return s
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

function formatAlnPreview(list, moreFn) {
  if (!Array.isArray(list) || !list.length) return null;
  if (list.length <= 4) return `ALN ${list.join(", ")}`;
  return `ALN ${list.slice(0, 4).join(", ")} · ${moreFn(list.length - 4)}`;
}

function DetailField({ label, children }) {
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

function ExpandableText({ text, label, moreLabel, lessLabel }) {
  const [open, setOpen] = useState(false);
  const clean = stripHtml(text);
  if (!clean) return null;
  const long = clean.length > 700;
  return (
    <section aria-label={label} className="rounded-xl border border-slate-100 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</h3>
      <p
        className={`mt-2 text-sm leading-relaxed text-slate-800 dark:text-slate-100 whitespace-pre-wrap break-words ${
          !open && long ? "max-h-48 overflow-hidden" : ""
        }`}
      >
        {clean}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-2 text-sm font-semibold text-indigo-700 underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-indigo-300"
        >
          {open ? lessLabel : moreLabel}
        </button>
      )}
    </section>
  );
}

function hasMoney(value, formatted) {
  if (formatted && String(formatted).trim() && String(formatted).trim() !== "—") return true;
  if (value == null || value === "") return false;
  const n = Number(value);
  return Number.isFinite(n);
}

function GrantDetailBody({ detail, t, copied, onCopy }) {
  const d = detail?.opportunity?.details || detail?.opportunity?.synopsis || {};
  const isForecast = d.sourceKind === "forecast" || (!detail?.opportunity?.synopsis?.synopsisDesc && detail?.opportunity?.forecast);
  if (!detail?.opportunity) return null;

  const moneyCards = [
    {
      label: t("proposalManagerGrants.awardCeiling"),
      value: money(d.awardCeiling, d.awardCeilingFormatted),
      show: hasMoney(d.awardCeiling, d.awardCeilingFormatted),
      icon: true,
    },
    {
      label: t("proposalManagerGrants.awardFloor"),
      value: money(d.awardFloor, d.awardFloorFormatted),
      show: hasMoney(d.awardFloor, d.awardFloorFormatted),
    },
    {
      label: t("proposalManagerGrants.estimatedFunding"),
      value: money(d.estimatedFunding, d.estimatedFundingFormatted),
      show: hasMoney(d.estimatedFunding, d.estimatedFundingFormatted),
    },
  ].filter((c) => c.show);

  return (
    <div className="space-y-5">
      {isForecast && (
        <p className="rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-xs text-sky-950 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-100">
          {t("proposalManagerGrants.forecastNotice")}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={detail.grantsGovUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
        >
          {t("proposalManagerGrants.openOnGrantsGov")}
          <FiExternalLink aria-hidden />
        </a>
        {d.fundingDescLinkUrl && (
          <a
            href={d.fundingDescLinkUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          >
            {d.fundingDescLinkDesc || t("proposalManagerGrants.fundingLink")}
            <FiExternalLink aria-hidden />
          </a>
        )}
        <button
          type="button"
          onClick={() => onCopy(detail.opportunity.opportunityNumber)}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-indigo-300"
        >
          {copied ? <FiCheck aria-hidden /> : <FiClipboard aria-hidden />}
          {copied ? t("proposalManagerGrants.copied") : t("proposalManagerGrants.copyNumber")}
        </button>
        {detail.fetchedAt && (
          <span className="text-[11px] text-slate-500">
            {t("proposalManagerGrants.liveFrom", {
              source: detail.source || "Grants.gov",
              time: new Date(detail.fetchedAt).toLocaleString(),
            })}
          </span>
        )}
      </div>

      {moneyCards.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-3">
          {moneyCards.map((card) => (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3 dark:border-slate-700 dark:from-slate-800 dark:to-slate-900"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{card.label}</p>
              <p className="mt-1.5 flex items-center gap-1 text-sm font-bold text-slate-900 dark:text-white">
                {card.icon && <FiDollarSign aria-hidden className="opacity-60" />}
                {card.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("proposalManagerGrants.amountsNotPublished")}</p>
      )}

      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        <DetailField label={t("proposalManagerGrants.agency")}>
          {d.agencyName || detail.opportunity.agencyDetails?.agencyName}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.postingDate")}>
          {d.postingDateStr || d.postingDate}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.closeDate")}>
          {stripHtml(d.responseDateStr || d.responseDate || "")}
          {d.responseDateDesc ? ` — ${stripHtml(d.responseDateDesc)}` : ""}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.estSynopsisPosting")}>
          {d.estSynopsisPostingDateStr || d.estSynopsisPostingDate}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.estAwardDate")}>
          {d.estAwardDateStr || d.estAwardDate}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.estProjectStart")}>
          {d.estProjectStartDateStr || d.estProjectStartDate}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.fiscalYear")}>{d.fiscalYear}</DetailField>
        <DetailField label={t("proposalManagerGrants.archiveDate")}>
          {d.archiveDateStr || d.archiveDate}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.numberOfAwards")}>{d.numberOfAwards}</DetailField>
        <DetailField label={t("proposalManagerGrants.costSharing")}>
          {d.costSharing == null
            ? null
            : d.costSharing === true || d.costSharing === "true" || d.costSharing === "Y"
              ? t("proposalManagerGrants.yes")
              : t("proposalManagerGrants.no")}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.fundingInstruments")}>
          {listLabels(d.fundingInstruments).join(", ")}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.fundingCategories")}>
          {listLabels(d.fundingActivityCategories).join(", ")}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.applicantTypes")}>
          {listLabels(d.applicantTypes).join(", ")}
        </DetailField>
        <DetailField label={t("proposalManagerGrants.contact")}>
          {[d.agencyContactName, d.agencyContactPhone].filter(Boolean).join(" · ")}
          {d.agencyContactDesc ? `\n${stripHtml(d.agencyContactDesc)}` : ""}
          {d.agencyContactEmailDesc ? `\n${stripHtml(d.agencyContactEmailDesc)}` : ""}
          {d.agencyContactEmail ? (
            <>
              {"\n"}
              <a
                href={`mailto:${d.agencyContactEmail}`}
                className="font-medium text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300"
              >
                {d.agencyContactEmail}
              </a>
            </>
          ) : null}
        </DetailField>
      </dl>

      <ExpandableText
        label={t("proposalManagerGrants.eligibility")}
        text={d.applicantEligibilityDesc}
        moreLabel={t("proposalManagerGrants.showMore")}
        lessLabel={t("proposalManagerGrants.showLess")}
      />
      <ExpandableText
        label={t("proposalManagerGrants.description")}
        text={d.description || d.synopsisDesc || d.forecastDesc}
        moreLabel={t("proposalManagerGrants.showMore")}
        lessLabel={t("proposalManagerGrants.showLess")}
      />

      {Array.isArray(detail.opportunity.cfdas) && detail.opportunity.cfdas.length > 0 && (
        <section className="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t("proposalManagerGrants.assistanceListings")}
          </h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-800 dark:text-slate-100">
            {detail.opportunity.cfdas.map((c, i) => (
              <li key={i} className="leading-snug">
                <span className="font-semibold">{c.alnNumber || c.cfdaNumber || c.id}</span>
                {c.programTitle ? ` — ${c.programTitle}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}

      {Array.isArray(detail.opportunity.attachmentFolders) &&
        detail.opportunity.attachmentFolders.length > 0 && (
          <section className="rounded-xl border border-slate-100 p-4 dark:border-slate-700">
            <h3 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <FiPaperclip aria-hidden />
              {t("proposalManagerGrants.attachments")}
            </h3>
            <ul className="mt-2 space-y-2 text-sm">
              {detail.opportunity.attachmentFolders.map((folder) => (
                <li
                  key={folder.id || folder.folderName}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-2.5 dark:border-slate-700 dark:bg-slate-800/60"
                >
                  <p className="font-medium text-slate-800 dark:text-slate-100">
                    {folder.folderType || folder.folderName}
                  </p>
                  {(folder.synopsisAttachments || []).map((att) => (
                    <p key={att.id || att.fileName} className="text-xs text-slate-500">
                      {att.fileName}
                      {att.fileDescription ? ` — ${att.fileDescription}` : ""}
                    </p>
                  ))}
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[11px] text-slate-500">{t("proposalManagerGrants.attachmentsHint")}</p>
          </section>
        )}
    </div>
  );
}

export default function GrantsPage() {
  const { t } = useTranslation("common");
  const { isRTLMode } = useLocalization();
  const searchInputRef = useRef(null);
  const formId = useId();
  const resultsId = useId();

  const [keyword, setKeyword] = useState("");
  const [draftKeyword, setDraftKeyword] = useState("");
  const [oppStatuses, setOppStatuses] = useState("posted|forecasted");
  const [agencyFilter, setAgencyFilter] = useState("");
  const [startRecord, setStartRecord] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [payload, setPayload] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");

  const [expandedId, setExpandedId] = useState(null);
  const [detailById, setDetailById] = useState({});
  const [loadingIds, setLoadingIds] = useState({});
  const [errorById, setErrorById] = useState({});
  const [copiedId, setCopiedId] = useState("");

  const runSearch = useCallback(
    async ({
      nextStart = 0,
      nextKeyword = keyword,
      nextStatuses = oppStatuses,
      nextAgency = agencyFilter,
    } = {}) => {
      setLoading(true);
      setError("");
      setStatusMessage(t("proposalManagerGrants.searching"));
      try {
        const data = await searchFederalGrants({
          keyword: nextKeyword,
          oppStatuses: nextStatuses,
          agencies: nextAgency.trim(),
          rows: PAGE_SIZE,
          startRecordNum: nextStart,
        });
        setPayload(data);
        setStartRecord(nextStart);
        setExpandedId(null);
        const count = Number(data.hitCount) || 0;
        setStatusMessage(t("proposalManagerGrants.resultsAnnounce", { count }));
      } catch (err) {
        const msg = err?.response?.data?.error || err.message || t("proposalManagerGrants.searchFailed");
        setError(msg);
        setPayload(null);
        setStatusMessage(msg);
      } finally {
        setLoading(false);
      }
    },
    [agencyFilter, keyword, oppStatuses, t],
  );

  useEffect(() => {
    runSearch({ nextStart: 0 });
    searchInputRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && expandedId) setExpandedId(null);
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expandedId]);

  const loadDetail = useCallback(
    async (id) => {
      if (!id || detailById[id] || loadingIds[id]) return;
      setLoadingIds((prev) => ({ ...prev, [id]: true }));
      setErrorById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      try {
        const data = await fetchFederalGrantOpportunity(id);
        setDetailById((prev) => ({ ...prev, [id]: data }));
      } catch (err) {
        setErrorById((prev) => ({
          ...prev,
          [id]: err?.response?.data?.error || err.message || t("proposalManagerGrants.detailFailed"),
        }));
      } finally {
        setLoadingIds((prev) => {
          const next = { ...prev };
          delete next[id];
          return next;
        });
      }
    },
    [detailById, loadingIds, t],
  );

  const toggleExpand = useCallback(
    (id) => {
      setExpandedId((current) => {
        const next = current === id ? null : id;
        if (next) loadDetail(next);
        return next;
      });
    },
    [loadDetail],
  );

  const clearFilters = () => {
    setDraftKeyword("");
    setKeyword("");
    setOppStatuses("posted|forecasted");
    setAgencyFilter("");
    runSearch({
      nextStart: 0,
      nextKeyword: "",
      nextStatuses: "posted|forecasted",
      nextAgency: "",
    });
  };

  const copyNumber = async (id, value) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 1600);
    } catch {
      /* ignore */
    }
  };

  const results = payload?.results || [];
  const hitCount = payload?.hitCount || 0;
  const page = Math.floor(startRecord / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(hitCount / PAGE_SIZE) || 1);
  const rangeStart = hitCount === 0 ? 0 : startRecord + 1;
  const rangeEnd = Math.min(startRecord + PAGE_SIZE, hitCount);
  const filtersDirty =
    !!draftKeyword.trim() ||
    !!keyword.trim() ||
    oppStatuses !== "posted|forecasted" ||
    !!agencyFilter.trim();

  const statusLabel = useMemo(
    () => (value) => t(`proposalManagerGrants.status.${value}`, { defaultValue: value }),
    [t],
  );

  return (
    <div className="space-y-5" dir={isRTLMode ? "rtl" : "ltr"}>
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {statusMessage}
      </div>

      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
              {t("proposalManagerGrants.eyebrow")}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {t("proposalManagerGrants.title")}
            </h1>
          </div>
          {payload?.fetchedAt && (
            <p className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:ring-emerald-800">
              {t("proposalManagerGrants.liveFrom", {
                source: payload.source || "Grants.gov",
                time: new Date(payload.fetchedAt).toLocaleString(),
              })}
            </p>
          )}
        </div>
        <p className="max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          {t("proposalManagerGrants.subtitle")}
        </p>
      </header>

      <section
        aria-labelledby={`${formId}-legend`}
        className="sticky top-0 z-20 -mx-1 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
      >
        <h2 id={`${formId}-legend`} className="sr-only">
          {t("proposalManagerGrants.searchFilters")}
        </h2>
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            const next = draftKeyword.trim();
            setKeyword(next);
            runSearch({ nextStart: 0, nextKeyword: next });
          }}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <label className="min-w-0 flex-1">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerGrants.keyword")}
              </span>
              <div className="relative">
                <FiSearch
                  aria-hidden
                  className={`pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400 ${isRTLMode ? "right-3" : "left-3"}`}
                />
                <input
                  ref={searchInputRef}
                  value={draftKeyword}
                  onChange={(e) => setDraftKeyword(e.target.value)}
                  placeholder={t("proposalManagerGrants.keywordPlaceholder")}
                  autoComplete="off"
                  className={`${inputClass} ${isRTLMode ? "pr-10 pl-10" : "pl-10 pr-10"}`}
                />
                {draftKeyword && (
                  <button
                    type="button"
                    onClick={() => {
                      setDraftKeyword("");
                      searchInputRef.current?.focus();
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-slate-700 ${isRTLMode ? "left-2" : "right-2"}`}
                    aria-label={t("proposalManagerGrants.clearKeyword")}
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </label>

            <label className="w-full lg:w-56">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerGrants.statusFilter")}
              </span>
              <select
                value={oppStatuses}
                onChange={(e) => setOppStatuses(e.target.value)}
                className={inputClass}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {t(`proposalManagerGrants.statusOptions.${opt.labelKey}`)}
                  </option>
                ))}
              </select>
            </label>

            <label className="w-full lg:w-40">
              <span className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-200">
                {t("proposalManagerGrants.agencyCode")}
              </span>
              <input
                value={agencyFilter}
                onChange={(e) => setAgencyFilter(e.target.value.toUpperCase())}
                placeholder="HHS, NSF…"
                className={inputClass}
              />
            </label>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-60 lg:flex-none"
              >
                {loading ? <FiRefreshCw aria-hidden className="animate-spin" /> : <FiSearch aria-hidden />}
                {loading ? t("proposalManagerGrants.searching") : t("proposalManagerGrants.search")}
              </button>
              {filtersDirty && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                >
                  {t("proposalManagerGrants.clearFilters")}
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">{t("proposalManagerGrants.quickAgencies")}</span>
            {QUICK_AGENCIES.map((code) => {
              const active = agencyFilter.trim().toUpperCase() === code;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    const next = active ? "" : code;
                    setAgencyFilter(next);
                    runSearch({
                      nextStart: 0,
                      nextKeyword: draftKeyword.trim() || keyword,
                      nextAgency: next,
                    });
                  }}
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${
                    active
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {code}
                </button>
              );
            })}
          </div>
        </form>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/40 dark:text-red-100"
        >
          <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden />
          <div className="space-y-2">
            <p>{error}</p>
            <button
              type="button"
              onClick={() => runSearch({ nextStart: startRecord })}
              className="text-sm font-semibold underline underline-offset-2"
            >
              {t("proposalManagerGrants.retry")}
            </button>
          </div>
        </div>
      )}

      <section className="space-y-3" aria-labelledby={resultsId}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 id={resultsId} className="text-sm font-semibold text-slate-900 dark:text-white">
              {t("proposalManagerGrants.results", { count: hitCount })}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t("proposalManagerGrants.showingRange", {
                start: rangeStart,
                end: rangeEnd,
                count: hitCount,
              })}
            </p>
          </div>
          <nav aria-label={t("proposalManagerGrants.pagination")} className="flex items-center gap-1">
            <button
              type="button"
              disabled={loading || startRecord <= 0}
              onClick={() => runSearch({ nextStart: Math.max(0, startRecord - PAGE_SIZE) })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              aria-label={t("proposalManagerGrants.prev")}
            >
              {isRTLMode ? <FiChevronRight /> : <FiChevronLeft />}
            </button>
            <span className="min-w-[7rem] text-center text-xs font-medium text-slate-600 dark:text-slate-300">
              {t("proposalManagerGrants.pageOf", { page, total: totalPages })}
            </span>
            <button
              type="button"
              disabled={loading || startRecord + PAGE_SIZE >= hitCount}
              onClick={() => runSearch({ nextStart: startRecord + PAGE_SIZE })}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              aria-label={t("proposalManagerGrants.next")}
            >
              {isRTLMode ? <FiChevronLeft /> : <FiChevronRight />}
            </button>
          </nav>
        </div>

        <div className="relative space-y-2" aria-busy={loading}>
          {loading && !results.length && (
            <div className="space-y-2" aria-hidden>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800" />
              ))}
            </div>
          )}
          {!loading && !results.length && !error && (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-600">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {t("proposalManagerGrants.empty")}
              </p>
              <p className="mt-1 text-xs text-slate-500">{t("proposalManagerGrants.emptyHint")}</p>
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
          )}

          <ul className="space-y-2" aria-label={t("proposalManagerGrants.resultsList")}>
            {results.map((hit) => {
              const days = daysUntil(hit.closeDate);
              const open = expandedId === hit.id;
              const panelId = `grant-panel-${hit.id}`;
              const headerId = `grant-header-${hit.id}`;
              const detail = detailById[hit.id];
              const isLoadingDetail = !!loadingIds[hit.id];
              const detailError = errorById[hit.id];
              const alnPreview = formatAlnPreview(hit.cfdaList, (n) =>
                t("proposalManagerGrants.alnMore", { count: n }),
              );

              return (
                <li
                  key={hit.id}
                  className={`overflow-hidden rounded-xl border transition ${
                    open
                      ? "border-indigo-400 bg-white shadow-sm dark:border-indigo-500 dark:bg-slate-900"
                      : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900"
                  }`}
                >
                  <button
                    type="button"
                    id={headerId}
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggleExpand(hit.id)}
                    className="flex w-full items-start gap-3 p-4 text-start hover:bg-slate-50/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-indigo-500 dark:hover:bg-slate-800/50"
                  >
                    <span
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition dark:border-slate-600 dark:text-slate-300 ${
                        open ? "rotate-0 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" : ""
                      }`}
                      aria-hidden
                    >
                      <FiChevronDown className={`transition-transform ${open ? "rotate-180" : ""}`} />
                    </span>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 space-y-1">
                          <p className="text-sm font-semibold leading-snug text-slate-900 dark:text-white">
                            {hit.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            <span className="font-medium text-slate-700 dark:text-slate-200">{hit.number}</span>
                            {" · "}
                            {hit.agency || hit.agencyCode}
                          </p>
                        </div>
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${statusTone(hit.oppStatus)}`}
                        >
                          {statusLabel(hit.oppStatus)}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                          <FiCalendar aria-hidden />
                          {hit.closeDate
                            ? t("proposalManagerGrants.closes", { date: hit.closeDate })
                            : t("proposalManagerGrants.noCloseDate")}
                        </span>
                        {days != null && (
                          <span className={`rounded-full px-2 py-1 font-semibold ${urgencyTone(days)}`}>
                            {days < 0
                              ? t("proposalManagerGrants.pastDue")
                              : t("proposalManagerGrants.daysLeft", { count: days })}
                          </span>
                        )}
                        {alnPreview && (
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                            {alnPreview}
                          </span>
                        )}
                        <span className="text-indigo-700 dark:text-indigo-300">
                          {open ? t("proposalManagerGrants.hideDetails") : t("proposalManagerGrants.showDetails")}
                        </span>
                      </div>
                    </div>
                  </button>

                  {open && (
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={headerId}
                      className="border-t border-slate-100 px-4 pb-4 pt-3 dark:border-slate-800 sm:px-5 sm:pb-5"
                    >
                      {isLoadingDetail && (
                        <div className="space-y-3" aria-busy="true">
                          <p className="text-sm text-slate-500">{t("proposalManagerGrants.loadingDetail")}</p>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                            ))}
                          </div>
                          <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
                        </div>
                      )}
                      {detailError && (
                        <div role="alert" className="flex items-start gap-2 text-sm text-red-800 dark:text-red-200">
                          <FiAlertCircle className="mt-0.5 shrink-0" aria-hidden />
                          <div>
                            <p>{detailError}</p>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailById((prev) => {
                                  const next = { ...prev };
                                  delete next[hit.id];
                                  return next;
                                });
                                loadDetail(hit.id);
                              }}
                              className="mt-2 font-semibold underline underline-offset-2"
                            >
                              {t("proposalManagerGrants.retry")}
                            </button>
                          </div>
                        </div>
                      )}
                      {!isLoadingDetail && detail && (
                        <GrantDetailBody
                          detail={detail}
                          t={t}
                          copied={copiedId === hit.id}
                          onCopy={(value) => copyNumber(hit.id, value)}
                        />
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>
    </div>
  );
}
