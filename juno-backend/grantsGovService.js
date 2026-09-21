/**
 * US Federal Grants — live Grants.gov proxy (search2 + fetchOpportunity).
 * Public endpoints; no API key required.
 */

const GRANTS_GOV_BASE = "https://api.grants.gov/v1/api";

async function postGrantsGov(path, body) {
  const res = await fetch(`${GRANTS_GOV_BASE}/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body || {}),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Grants.gov returned non-JSON (${res.status}): ${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(json?.msg || json?.error || `Grants.gov HTTP ${res.status}`);
  }
  if (json.errorcode != null && Number(json.errorcode) !== 0) {
    throw new Error(json.msg || `Grants.gov error ${json.errorcode}`);
  }
  return json;
}

function normalizeHit(hit) {
  if (!hit || typeof hit !== "object") return null;
  return {
    id: String(hit.id ?? ""),
    number: hit.number || "",
    title: hit.title || "",
    agencyCode: hit.agencyCode || "",
    agency: hit.agency || "",
    openDate: hit.openDate || "",
    closeDate: hit.closeDate || "",
    oppStatus: hit.oppStatus || "",
    docType: hit.docType || "",
    cfdaList: Array.isArray(hit.cfdaList) ? hit.cfdaList : [],
    grantsGovUrl: hit.id
      ? `https://www.grants.gov/search-results-detail/${hit.id}`
      : "https://www.grants.gov/",
  };
}

function pick(...vals) {
  for (const v of vals) {
    if (v == null) continue;
    if (typeof v === "string" && !v.trim()) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    return v;
  }
  return vals.find((v) => v !== undefined) ?? null;
}

function hasSynopsis(synopsis) {
  return synopsis && typeof synopsis === "object" && Object.keys(synopsis).length > 0;
}

function hasForecast(forecast) {
  return forecast && typeof forecast === "object" && Object.keys(forecast).length > 0;
}

/** Merge posted synopsis + forecast so forecasted opportunities still surface amounts/dates/contacts. */
function buildUnifiedDetails(data = {}) {
  const s = data.synopsis || {};
  const f = data.forecast || {};
  const agency =
    data.agencyDetails || s.agencyDetails || f.agencyDetails || data.topAgencyDetails || null;

  const sourceKind = hasSynopsis(s) ? "synopsis" : hasForecast(f) ? "forecast" : "none";

  return {
    sourceKind,
    agencyName: pick(s.agencyName, agency?.agencyName, ""),
    agencyCode: pick(s.agencyCode, agency?.agencyCode, data.owningAgencyCode, ""),
    agencyPhone: pick(s.agencyPhone, ""),
    agencyAddressDesc: pick(s.agencyAddressDesc, ""),
    agencyContactName: pick(s.agencyContactName, f.agencyContactName, ""),
    agencyContactPhone: pick(s.agencyContactPhone, f.agencyContactPhone, ""),
    agencyContactEmail: pick(s.agencyContactEmail, f.agencyContactEmail, ""),
    agencyContactEmailDesc: pick(s.agencyContactEmailDesc, f.agencyContactEmailDesc, ""),
    agencyContactDesc: pick(s.agencyContactDesc, ""),
    description: pick(s.synopsisDesc, f.forecastDesc, ""),
    applicantEligibilityDesc: pick(s.applicantEligibilityDesc, ""),
    responseDate: pick(s.responseDate, f.estApplicationResponseDate, ""),
    responseDateDesc: pick(s.responseDateDesc, f.estApplicationResponseDateDesc, ""),
    responseDateStr: pick(s.responseDateStr, f.estApplicationResponseDateStr, ""),
    postingDate: pick(s.postingDate, f.postingDate, ""),
    postingDateStr: pick(s.postingDateStr, f.postingDateStr, ""),
    archiveDate: pick(s.archiveDate, ""),
    archiveDateStr: pick(s.archiveDateStr, ""),
    estSynopsisPostingDate: pick(f.estSynopsisPostingDate, ""),
    estSynopsisPostingDateStr: pick(f.estSynopsisPostingDateStr, ""),
    estAwardDate: pick(f.estAwardDate, ""),
    estAwardDateStr: pick(f.estAwardDateStr, ""),
    estProjectStartDate: pick(f.estProjectStartDate, ""),
    estProjectStartDateStr: pick(f.estProjectStartDateStr, ""),
    fiscalYear: pick(f.fiscalYear, ""),
    costSharing: pick(s.costSharing, f.costSharing),
    numberOfAwards: pick(s.numberOfAwards, f.numberOfAwards),
    estimatedFunding: pick(s.estimatedFunding, f.estimatedFunding),
    estimatedFundingFormatted: pick(s.estimatedFundingFormatted, f.estimatedFundingFormatted, ""),
    awardCeiling: pick(s.awardCeiling, f.awardCeiling),
    awardCeilingFormatted: pick(s.awardCeilingFormatted, f.awardCeilingFormatted, ""),
    awardFloor: pick(s.awardFloor, f.awardFloor),
    awardFloorFormatted: pick(s.awardFloorFormatted, f.awardFloorFormatted, ""),
    fundingDescLinkUrl: pick(s.fundingDescLinkUrl, ""),
    fundingDescLinkDesc: pick(s.fundingDescLinkDesc, ""),
    applicantTypes: pick(s.applicantTypes, f.applicantTypes, []) || [],
    fundingInstruments: pick(s.fundingInstruments, f.fundingInstruments, []) || [],
    fundingActivityCategories: pick(s.fundingActivityCategories, f.fundingActivityCategories, []) || [],
    createdDate: pick(s.createdDate, f.createdDate, ""),
    lastUpdatedDate: pick(s.lastUpdatedDate, f.lastUpdatedDate, ""),
  };
}

export function registerGrantsGovRoutes(app) {
  app.post("/grants/search", async (req, res) => {
    try {
      const {
        keyword = "",
        oppStatuses = "posted|forecasted",
        rows = 25,
        startRecordNum = 0,
        agencies = "",
        fundingCategories = "",
        fundingInstruments = "",
        eligibilities = "",
        aln = "",
        oppNum = "",
        sortBy = "",
      } = req.body || {};

      const payload = {
        keyword: String(keyword || "").trim(),
        oppStatuses: String(oppStatuses || "posted|forecasted"),
        rows: Math.min(Math.max(Number(rows) || 25, 1), 100),
        startRecordNum: Math.max(Number(startRecordNum) || 0, 0),
        agencies: String(agencies || ""),
        fundingCategories: String(fundingCategories || ""),
        fundingInstruments: String(fundingInstruments || ""),
        eligibilities: String(eligibilities || ""),
        aln: String(aln || ""),
        oppNum: String(oppNum || ""),
        sortBy: String(sortBy || ""),
      };

      const raw = await postGrantsGov("search2", payload);
      const data = raw.data || {};
      const hits = Array.isArray(data.oppHits) ? data.oppHits.map(normalizeHit).filter(Boolean) : [];

      return res.json({
        source: "Grants.gov",
        geography: "United States (Federal)",
        fetchedAt: new Date().toISOString(),
        hitCount: Number(data.hitCount) || hits.length,
        startRecord: Number(data.startRecord) || 0,
        rows: payload.rows,
        searchParams: data.searchParams || payload,
        results: hits,
        facets: {
          oppStatuses: data.oppStatusOptions || [],
          fundingCategories: data.fundingCategories || [],
          fundingInstruments: data.fundingInstruments || [],
          eligibilities: data.eligibilities || [],
          agencies: data.agencies || [],
        },
      });
    } catch (err) {
      console.error("[grants/search]", err);
      return res.status(502).json({
        error: err.message || "Failed to search Grants.gov",
        code: "grants_search_failed",
      });
    }
  });

  app.post("/grants/opportunity", async (req, res) => {
    try {
      const opportunityId = req.body?.opportunityId ?? req.body?.id;
      if (opportunityId == null || String(opportunityId).trim() === "") {
        return res.status(400).json({ error: "opportunityId is required", code: "missing_opportunity_id" });
      }

      const raw = await postGrantsGov("fetchOpportunity", {
        opportunityId: Number(opportunityId) || String(opportunityId).trim(),
      });
      const data = raw.data || {};
      const synopsis = data.synopsis || {};
      const forecast = data.forecast || {};
      const details = buildUnifiedDetails(data);
      const id = String(
        synopsis.opportunityId || forecast.opportunityId || data.id || opportunityId,
      );

      return res.json({
        source: "Grants.gov",
        geography: "United States (Federal)",
        fetchedAt: new Date().toISOString(),
        grantsGovUrl: id ? `https://www.grants.gov/search-results-detail/${id}` : "https://www.grants.gov/",
        opportunity: {
          id,
          opportunityNumber: data.opportunityNumber || "",
          opportunityTitle: data.opportunityTitle || "",
          owningAgencyCode: data.owningAgencyCode || "",
          opportunityCategory: data.opportunityCategory || null,
          docType: data.docType || "",
          draftMode: data.draftMode || "",
          originalDueDate: data.originalDueDate || "",
          originalDueDateDesc: data.originalDueDateDesc || "",
          assistCompatible: data.assistCompatible,
          assistURL: data.assistURL || "",
          agencyDetails: data.agencyDetails || synopsis.agencyDetails || forecast.agencyDetails || null,
          topAgencyDetails: data.topAgencyDetails || synopsis.topAgencyDetails || null,
          details,
          synopsis: {
            agencyName: synopsis.agencyName || "",
            agencyCode: synopsis.agencyCode || "",
            agencyPhone: synopsis.agencyPhone || "",
            agencyAddressDesc: synopsis.agencyAddressDesc || "",
            agencyContactName: synopsis.agencyContactName || "",
            agencyContactPhone: synopsis.agencyContactPhone || "",
            agencyContactEmail: synopsis.agencyContactEmail || "",
            agencyContactEmailDesc: synopsis.agencyContactEmailDesc || "",
            agencyContactDesc: synopsis.agencyContactDesc || "",
            synopsisDesc: synopsis.synopsisDesc || "",
            responseDate: synopsis.responseDate || "",
            responseDateDesc: synopsis.responseDateDesc || "",
            responseDateStr: synopsis.responseDateStr || "",
            postingDate: synopsis.postingDate || "",
            postingDateStr: synopsis.postingDateStr || "",
            archiveDate: synopsis.archiveDate || "",
            archiveDateStr: synopsis.archiveDateStr || "",
            costSharing: synopsis.costSharing,
            numberOfAwards: synopsis.numberOfAwards,
            estimatedFunding: synopsis.estimatedFunding,
            estimatedFundingFormatted: synopsis.estimatedFundingFormatted || "",
            awardCeiling: synopsis.awardCeiling,
            awardCeilingFormatted: synopsis.awardCeilingFormatted || "",
            awardFloor: synopsis.awardFloor,
            awardFloorFormatted: synopsis.awardFloorFormatted || "",
            applicantEligibilityDesc: synopsis.applicantEligibilityDesc || "",
            fundingDescLinkUrl: synopsis.fundingDescLinkUrl || "",
            fundingDescLinkDesc: synopsis.fundingDescLinkDesc || "",
            applicantTypes: synopsis.applicantTypes || [],
            fundingInstruments: synopsis.fundingInstruments || [],
            fundingActivityCategories: synopsis.fundingActivityCategories || [],
            createdDate: synopsis.createdDate || "",
            lastUpdatedDate: synopsis.lastUpdatedDate || "",
          },
          forecast: hasForecast(forecast) ? forecast : null,
          cfdas: data.cfdas || data.alns || [],
          attachmentFolders: data.synopsisAttachmentFolders || [],
          documentUrls: data.synopsisDocumentURLs || [],
          relatedOpps: data.relatedOpps || [],
          history: data.opportunityHistoryDetails || [],
          packages: data.opportunityPkgs || [],
          closedPackages: data.closedOpportunityPkgs || [],
          raw: data,
        },
      });
    } catch (err) {
      console.error("[grants/opportunity]", err);
      return res.status(502).json({
        error: err.message || "Failed to fetch opportunity from Grants.gov",
        code: "grants_detail_failed",
      });
    }
  });

  console.log("Grants.gov API: POST /grants/search, POST /grants/opportunity");
}
