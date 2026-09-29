/**
 * After Source Docs dates/Q&A scan: deep AI parse → dashboard + Bid Vault + Compliance.
 */
import { extractDashboardInsightsFromDocument } from "../../../services/api.js";
import { canUseTrialFeatures } from "../../../services/trialFeatureApi.js";
import {
  openOrCreateFromSourceDoc,
  updateSubmission,
} from "./bidVaultStore.js";
import {
  getComplianceData,
  addComplianceArea,
  updateComplianceArea,
  addComplianceRisk,
  updateComplianceRisk,
} from "./complianceStore.js";
import { applyDocInsights } from "./dashboardStore.js";

function findAreaByName(name) {
  const n = String(name || "").trim().toLowerCase();
  if (!n) return null;
  return (getComplianceData().areas || []).find(
    (a) => String(a.name || "").trim().toLowerCase() === n,
  );
}

function findRiskByName(name) {
  const n = String(name || "").trim().toLowerCase();
  if (!n) return null;
  return (getComplianceData().risks || []).find(
    (r) => String(r.name || "").trim().toLowerCase() === n,
  );
}

function mergeComplianceFromInsights(insights, docId) {
  (insights.complianceAreas || []).forEach((area) => {
    if (!area?.name) return;
    const existing = findAreaByName(area.name);
    if (existing) {
      updateComplianceArea(existing.id, {
        status: area.status,
        score: area.score,
        lastAudit: new Date().toISOString().slice(0, 10),
      });
    } else {
      addComplianceArea({
        name: area.name,
        status: area.status || "pending",
        score: area.score ?? 50,
        lastAudit: new Date().toISOString().slice(0, 10),
      });
    }
  });

  (insights.risks || []).forEach((risk) => {
    if (!risk?.name) return;
    const taggedName = risk.name;
    const existing = findRiskByName(taggedName);
    const mitigation = [risk.mitigation, docId ? `Source: ${docId}` : ""]
      .filter(Boolean)
      .join(" · ");
    if (existing) {
      updateComplianceRisk(existing.id, {
        level: risk.level,
        score: risk.score,
        mitigation: mitigation || existing.mitigation,
      });
    } else {
      addComplianceRisk({
        name: taggedName,
        level: risk.level || "medium",
        score: risk.score ?? 50,
        mitigation,
      });
    }
  });
}

function upsertVaultFromInsights(doc, insights) {
  const opp = insights.opportunity || {};
  const result = openOrCreateFromSourceDoc({
    id: doc.id,
    name: opp.title || doc.shareLabel || doc.name,
    importantDates: doc.importantDates || [],
  });
  if (!result?.submission) return null;
  const patch = {
    title: opp.title || result.submission.title,
    number: opp.number || result.submission.number,
    agency: opp.agency || result.submission.agency,
    segment: opp.segment || result.submission.segment,
    value: opp.valueEstimate != null ? opp.valueEstimate : result.submission.value,
    deadline: opp.deadline || result.submission.deadline,
    stage: result.created ? opp.stageHint || "pipeline" : result.submission.stage,
    sourceDocIds: [...new Set([...(result.submission.sourceDocIds || []), doc.id])],
    notes: insights.summary
      ? `AI summary: ${insights.summary}`
      : result.submission.notes,
  };
  return updateSubmission(result.submission.id, patch);
}

/**
 * @param {{ id: string, name?: string, shareLabel?: string, importantDates?: object[] }} doc
 * @param {string} documentText
 * @returns {Promise<{ insights: object|null, error?: string }>}
 */
export async function ingestSourceDocForDashboard(doc, documentText) {
  if (!doc?.id) return { insights: null, error: "missing_doc" };
  if (!canUseTrialFeatures()) return { insights: null, error: "not_trial" };

  const text = String(documentText || "").trim();
  if (text.length < 40) {
    return { insights: null, error: "text_too_short" };
  }

  try {
    const insights = await extractDashboardInsightsFromDocument({
      document: text.slice(0, 120_000),
      documentName: doc.shareLabel || doc.name || "",
      context: {
        importantDates: Array.isArray(doc.importantDates) ? doc.importantDates.slice(0, 12) : [],
      },
    });

    applyDocInsights(doc.id, insights, { docName: doc.shareLabel || doc.name || "" });
    upsertVaultFromInsights(doc, insights);
    mergeComplianceFromInsights(insights, doc.id);

    return { insights };
  } catch (err) {
    console.warn("[dashboard-ingest] failed:", err?.message || err);
    return {
      insights: null,
      error: err?.response?.data?.error || err?.message || "dashboard_ingest_failed",
    };
  }
}
