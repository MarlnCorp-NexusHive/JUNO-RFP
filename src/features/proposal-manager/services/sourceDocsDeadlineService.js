import { extractFromFile } from "./extractFromDocument.js";
import {
  extractImportantDatesFromDocument,
  extractQaLibraryFromDocument,
} from "../../../services/api.js";
import { calendarApi } from "../../../services/calendarApi.js";
import { canUseTrialFeatures } from "../../../services/trialFeatureApi.js";
import { scopedStorageKey } from "../../../services/tenantScopedStorage.js";
import { parseDateToISO } from "./calendarDateParse.js";
import { daysUntilDeadline, urgencyAlertColor } from "./shortlistStore.js";
import { replaceExtractedQAsInContentHub } from "./proposalManagerStorage.js";
import { DOCUMENT_TYPE_TO_TAGS } from "../data/documentTypes.js";

export const SOURCE_DOCS_DEADLINES_CHANGED = "juno-source-docs-deadlines-changed";

const SOURCE_DOCS_KEY = "proposal_manager_source_docs";
const SOURCE_DOC_DEADLINE_COLOR = "#dc2626";

function notifySourceDocsDeadlinesChanged() {
  try {
    window.dispatchEvent(new CustomEvent(SOURCE_DOCS_DEADLINES_CHANGED));
  } catch {
    /* ignore */
  }
}

/** Labels that count as application / submission deadlines for calendar + alerts. */
const APPLICATION_DEADLINE_RE =
  /submission|proposal\s*due|bid\s*(due|deadline|opening)|application|response\s*due|offer\s*due|closing|close\s*date|due\s*date|deadline|intent\s*to\s*bid|rfp\s*due|rfq\s*due|solicitation\s*due/i;

export function isApplicationDeadlineEvent(eventLabel) {
  return APPLICATION_DEADLINE_RE.test(String(eventLabel || ""));
}

export function sourceDocDeadlineEventId(docId, date, eventLabel) {
  const safeDoc = String(docId || "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 60);
  const safeEvent = String(eventLabel || "deadline")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .slice(0, 40);
  return `srcdoc_${safeDoc}_${date}_${safeEvent}`.slice(0, 160);
}

function loadSourceDocsRaw() {
  try {
    const raw = localStorage.getItem(scopedStorageKey(SOURCE_DOCS_KEY));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Application deadlines extracted from Source Docs uploads (company-wide via feature store cache).
 * @returns {{ id: string, docId: string, docName: string, event: string, date: string, rawText?: string }[]}
 */
export function listSourceDocDeadlines() {
  const docs = loadSourceDocsRaw().filter((d) => !d.preUploaded);
  const out = [];
  for (const doc of docs) {
    const dates = Array.isArray(doc.importantDates) ? doc.importantDates : [];
    for (const row of dates) {
      if (!row?.date || !isApplicationDeadlineEvent(row.event)) continue;
      const iso = parseDateToISO(row.date);
      if (!iso) continue;
      out.push({
        id: sourceDocDeadlineEventId(doc.id, iso, row.event),
        docId: doc.id,
        docName: doc.shareLabel || doc.name || "Source document",
        event: row.event || "Application deadline",
        date: iso,
        rawText: row.raw_text || row.rawText || "",
      });
    }
  }
  return out.sort((a, b) => a.date.localeCompare(b.date));
}

export async function syncSourceDocDeadlineToCalendar(item, present = true) {
  if (!canUseTrialFeatures() || !item?.id) return;
  if (!present) {
    try {
      await calendarApi.deleteEvent(item.id);
    } catch {
      /* gone */
    }
    return;
  }
  const body = {
    id: item.id,
    title: `${item.event}: ${item.docName}`,
    start: item.date,
    end: null,
    allDay: true,
    type: "deadline",
    source: "source-doc",
    documentId: item.docId,
    bidName: item.docName,
    description: item.rawText || item.event,
    color: SOURCE_DOC_DEADLINE_COLOR,
  };
  try {
    await calendarApi.updateEvent(item.id, body);
  } catch {
    try {
      await calendarApi.createEvent(body);
    } catch (err) {
      console.warn("[source-docs] calendar sync failed:", err?.message || err);
    }
  }
}

export async function syncSourceDocDeadlinesForDoc(doc) {
  if (!doc?.id) return [];
  const dates = Array.isArray(doc.importantDates) ? doc.importantDates : [];
  const synced = [];
  for (const row of dates) {
    if (!isApplicationDeadlineEvent(row.event)) continue;
    const iso = parseDateToISO(row.date);
    if (!iso) continue;
    const item = {
      id: sourceDocDeadlineEventId(doc.id, iso, row.event),
      docId: doc.id,
      docName: doc.shareLabel || doc.name || "Source document",
      event: row.event || "Application deadline",
      date: iso,
      rawText: row.raw_text || row.rawText || "",
    };
    await syncSourceDocDeadlineToCalendar(item, true);
    synced.push(item);
  }
  notifySourceDocsDeadlinesChanged();
  return synced;
}

export async function removeSourceDocDeadlinesFromCalendar(doc) {
  if (!doc?.id) return;
  const dates = Array.isArray(doc.importantDates) ? doc.importantDates : [];
  for (const row of dates) {
    const iso = parseDateToISO(row.date);
    if (!iso) continue;
    const id = sourceDocDeadlineEventId(doc.id, iso, row.event);
    await syncSourceDocDeadlineToCalendar({ id }, false);
  }
  notifySourceDocsDeadlinesChanged();
}

/**
 * Extract text once, then AI-scan for application deadlines and Q&A library items.
 */
export async function scanFileForImportantDates(file, onProgress = null) {
  const { text } = await extractFromFile(file, onProgress);
  const trimmed = String(text || "").trim();
  if (trimmed.length < 40) {
    return {
      importantDates: [],
      qaItems: [],
      qaAdded: 0,
      textLength: trimmed.length,
      truncated: false,
    };
  }
  const payload = trimmed.slice(0, 400_000);
  const [datesResult, qaResult] = await Promise.all([
    extractImportantDatesFromDocument(payload).catch((err) => {
      console.warn("[source-docs] date extract failed:", err?.message || err);
      return { important_dates: [] };
    }),
    extractQaLibraryFromDocument(payload).catch((err) => {
      console.warn("[source-docs] Q&A extract failed:", err?.message || err);
      return { qa_items: [] };
    }),
  ]);

  const rows = Array.isArray(datesResult?.important_dates) ? datesResult.important_dates : [];
  const importantDates = rows
    .map((row) => {
      const iso = parseDateToISO(row.date);
      if (!iso) return null;
      return {
        event: String(row.event || "Unknown Event").slice(0, 200),
        date: iso,
        raw_text: String(row.raw_text || "").slice(0, 500),
      };
    })
    .filter(Boolean);

  const qaItems = Array.isArray(qaResult?.qa_items) ? qaResult.qa_items : [];

  return {
    importantDates,
    qaItems,
    textLength: trimmed.length,
    truncated: trimmed.length > 400_000,
    documentText: payload,
  };
}

/** Persist AI Q&As from a Source Docs upload into the shared Content Hub library. */
export function ingestSourceDocQAsToLibrary(docId, qaItems) {
  if (!docId || !Array.isArray(qaItems) || !qaItems.length) return 0;
  return replaceExtractedQAsInContentHub(docId, qaItems, "solicitation", DOCUMENT_TYPE_TO_TAGS);
}

/** Build dashboard alert rows for source-doc application deadlines. */
export function buildSourceDocDeadlineAlerts(t) {
  return listSourceDocDeadlines().map((item) => {
    const days = daysUntilDeadline(item.date);
    const daysPart =
      days == null
        ? ""
        : days < 0
          ? ` (${t("dashboard.alerts.proposalManager.shortlistPastDue")})`
          : ` (${t("dashboard.alerts.proposalManager.shortlistDaysLeft", { count: days })})`;
    return {
      text: t("dashboard.alerts.proposalManager.sourceDocDeadline", {
        date: item.date,
        event: item.event,
        title: item.docName,
        daysPart,
      }),
      color: urgencyAlertColor(days),
    };
  });
}
