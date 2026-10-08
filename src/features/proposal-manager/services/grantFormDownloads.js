/**
 * Extract downloadable grant forms / attachments from Grants.gov (and similar) opportunity detail.
 */

export const GRANTS_GOV_ATTACHMENT_DOWNLOAD =
  "https://www.grants.gov/grantsws/rest/opportunity/att/download";

export function grantsGovAttachmentDownloadUrl(attachmentId) {
  const id = String(attachmentId ?? "").trim();
  if (!id) return "";
  return `${GRANTS_GOV_ATTACHMENT_DOWNLOAD}/${encodeURIComponent(id)}`;
}

function asText(value, max = 240) {
  const s = String(value || "").trim();
  if (!s) return "";
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function pushUnique(list, form) {
  if (!form?.url && !form?.portalUrl) return;
  const key = `${form.id || ""}|${form.url || form.portalUrl}`;
  if (list.some((f) => `${f.id || ""}|${f.url || f.portalUrl}` === key)) return;
  list.push(form);
}

/**
 * Normalize forms from a Grants.gov opportunity payload (fetchFederalGrantOpportunity).
 * @returns {{ id: string, name: string, detail?: string, url?: string, portalUrl?: string, kind: string }[]}
 */
export function extractFormsFromOpportunityDetail(detail = {}) {
  const forms = [];
  const opp = detail.opportunity || detail;
  const opportunityId = String(opp.id || opp.opportunityId || detail.opportunityId || "").trim();
  const grantsGovUrl =
    detail.grantsGovUrl ||
    (opportunityId ? `https://www.grants.gov/search-results-detail/${opportunityId}` : "");

  const folders = Array.isArray(opp.attachmentFolders) ? opp.attachmentFolders : [];
  folders.forEach((folder, fi) => {
    const folderLabel = asText(folder.folderType || folder.folderName || "Attachments", 120);
    (Array.isArray(folder.synopsisAttachments) ? folder.synopsisAttachments : []).forEach((att, ai) => {
      const id = String(att.id ?? `att-${fi}-${ai}`).trim();
      const url = grantsGovAttachmentDownloadUrl(att.id);
      if (!url) return;
      pushUnique(forms, {
        id: `att-${id}`,
        name: asText(att.fileName || att.fileDescription || `Attachment ${ai + 1}`, 200),
        detail: [folderLabel, att.fileDescription].filter(Boolean).join(" · "),
        url,
        kind: "attachment",
      });
    });
  });

  const docUrls = Array.isArray(opp.documentUrls) ? opp.documentUrls : [];
  docUrls.forEach((doc, i) => {
    const url = asText(doc.url || doc.docUrl || doc.link || doc.href, 500);
    if (!url) return;
    pushUnique(forms, {
      id: `docurl-${i + 1}`,
      name: asText(doc.description || doc.docDescription || doc.title || doc.fileName || `Document ${i + 1}`, 200),
      detail: asText(doc.folderType || doc.type || "", 120),
      url,
      kind: "document_url",
    });
  });

  const synopsis = opp.synopsis || {};
  if (synopsis.fundingDescLinkUrl) {
    pushUnique(forms, {
      id: "funding-desc",
      name: asText(synopsis.fundingDescLinkDesc || "Funding description", 200),
      url: asText(synopsis.fundingDescLinkUrl, 500),
      kind: "funding_link",
    });
  }

  if (opp.assistURL) {
    pushUnique(forms, {
      id: "assist",
      name: "Workspace / ASSIST application",
      detail: "Open the official application workspace",
      portalUrl: asText(opp.assistURL, 500),
      kind: "workspace",
    });
  }

  const packages = [
    ...(Array.isArray(opp.packages) ? opp.packages : []),
    ...(Array.isArray(opp.closedPackages) ? opp.closedPackages : []),
  ];
  packages.forEach((pkg, i) => {
    const name = asText(
      pkg.packageName || pkg.competitionTitle || pkg.opportunityPackageId || `Application package ${i + 1}`,
      200,
    );
    // Packages typically require Grants.gov Workspace — link to opportunity page.
    pushUnique(forms, {
      id: `pkg-${pkg.opportunityPackageId || pkg.id || i + 1}`,
      name,
      detail: "Open Grants.gov Package tab to preview / apply",
      portalUrl: grantsGovUrl,
      kind: "package",
    });
  });

  if (!forms.length && grantsGovUrl) {
    pushUnique(forms, {
      id: "portal",
      name: "Official Grants.gov opportunity page",
      detail: "Download forms and instructions from the Related Documents / Package tabs",
      portalUrl: grantsGovUrl,
      kind: "portal",
    });
  }

  return forms.slice(0, 40);
}

/** Merge forms onto a brief object (does not mutate if no forms). */
export function mergeFormsOntoBrief(brief, forms) {
  if (!brief || !Array.isArray(forms) || !forms.length) return brief;
  const existing = Array.isArray(brief.forms) ? brief.forms : [];
  const merged = [];
  [...existing, ...forms].forEach((f) => pushUnique(merged, f));
  return { ...brief, forms: merged };
}

export function isGrantsGovSource(source) {
  const s = String(source || "").toLowerCase();
  return s === "grants" || s === "federal" || s.includes("grants.gov");
}
