import axios from "axios";

/* ================= BASE API ================= */

/**
 * Dev: empty base URL → requests go to the Vite dev origin and are proxied to the backend (vite.config.js).
 * Prod: set VITE_API_URL to your API origin, or default to localhost:3000 for local preview.
 */
function resolveApiBaseUrl() {
  // In local development always use same-origin + Vite proxy.
  // This avoids stale/wrong VITE_API_URL values causing 404 HTML pages like "Cannot POST ...".
  if (import.meta.env.DEV) return "";
  const fromEnv = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  // Fallback for local preview builds.
  return "http://localhost:3000";
}

const API = axios.create({
  baseURL: resolveApiBaseUrl(),
  /** Styled export + AI generation can run for several minutes. */
  timeout: 600_000,
});

/** DOCX is a ZIP (PK…). If the server returned JSON/HTML, surface it as a normal Error. */
async function assertBlobIsDocxOrThrow(response, label) {
  const blob = response.data;
  if (!(blob instanceof Blob)) {
    throw new Error(`${label}: invalid response`);
  }
  const head = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  const looksLikeZip = head[0] === 0x50 && head[1] === 0x4b;
  if (!looksLikeZip) {
    const text = await blob.text();
    let msg = text.slice(0, 2000);
    try {
      const j = JSON.parse(text);
      if (typeof j?.error === "string") msg = j.error;
    } catch {
      /* HTML or plain text */
    }
    throw new Error(`${label}: ${msg.slice(0, 800)}`);
  }
  return blob;
}

/* ================= BASIC AI ================= */
export const generateAnswer = async (question) => {
  const res = await API.post("/generate-answer", { question });
  return res.data.answer;
};

/* ================= RFP STRUCTURING ================= */
export const structureRfpRequirementsWithAi = async (text) => {
  const res = await API.post("/structure-rfp-requirements", { text });
  return res.data;
};

/* ================= CONTEXT ================= */
export const askWithContext = async (question, document) => {
  const res = await API.post("/ask-with-context", {
    question,
    document,
  });
  return res.data.answer;
};

/* ================= COMPANY INTELLIGENCE ================= */
export const fetchCompanyIntelligenceRemote = async ({ query }) => {
  const res = await API.post("/company-intelligence-remote", { query });
  return res.data;
};

/* ================= COMPANY PROFILE ================= */
export const generateCompanyProfile = async (payload) => {
  const res = await API.post("/generate-company-profile", {
    companyName: payload.companyName ?? "",
    companyWebsite: payload.companyWebsite ?? "",
    companyText: payload.companyText ?? "",
  });
  return res.data;
};

/* ================= FILE UPLOAD ================= */
export const askWithFile = async (file, question) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("question", question);

  const res = await API.post("/ask-with-file", formData);

  return res.data.answer;
};

/* ================= RFP IMPORTANT DATES ================= */
export const extractImportantDatesFromDocument = async (document) => {
  const res = await API.post("/extract-dates", { document });
  return res.data;
};

/** Tables + figures from RFP text; optional workspaceId + documentId persist server-side (in-memory). */
export const extractStructuredRfpData = async (document, options = {}) => {
  const { workspaceId, documentId, skipAi } = options;
  const res = await API.post("/extract-structured-data", {
    document,
    ...(workspaceId != null ? { workspaceId } : {}),
    ...(documentId != null ? { documentId } : {}),
    ...(skipAi != null ? { skipAi } : {}),
  });
  return res.data;
};

export const getStructuredTablesForWorkspace = async (workspaceId) => {
  const res = await API.get(`/get-tables/${encodeURIComponent(workspaceId)}`);
  return res.data;
};

/* ================= WORKSPACE DOCUMENT MODEL ================= */
export const seedWorkspaceDocument = async (workspaceId, payload) => {
  const res = await API.post(`/workspace-document/${encodeURIComponent(workspaceId)}/seed`, payload);
  return res.data;
};

export const saveWorkspaceDocument = async (workspaceId, document) => {
  const res = await API.post(`/workspace-document/${encodeURIComponent(workspaceId)}`, { document });
  return res.data;
};

export const getWorkspaceDocument = async (workspaceId) => {
  const res = await API.get(`/workspace-document/${encodeURIComponent(workspaceId)}`);
  return res.data;
};

export const exportWorkspaceDocument = async (workspaceId) => {
  const res = await API.get(`/export-document/${encodeURIComponent(workspaceId)}`, {
    responseType: "blob",
  });
  return assertBlobIsDocxOrThrow(res, "Export document");
};

/** Marln DXC-styled template merge (OpenAI + OOXML) — same path as plain export + ?style=styled (proxies reliably). Optional: issuerName = workspace-linked client for template placeholders. */
export const exportWorkspaceDocumentStyled = async (workspaceId, issuerDisplayName) => {
  const q = new URLSearchParams();
  q.set("style", "styled");
  const name = typeof issuerDisplayName === "string" ? issuerDisplayName.trim() : "";
  if (name) q.set("issuerName", name);
  const res = await API.get(
    `/export-document/${encodeURIComponent(workspaceId)}?${q.toString()}`,
    { responseType: "blob" },
  );
  return assertBlobIsDocxOrThrow(res, "Styled export");
};

/* ================= RFP DOCUMENT ================= */
export const generateRfpDocument = async (payload) => {
  const res = await API.post("/generate-rfp-document", payload, {
    responseType: "blob",
  });
  return assertBlobIsDocxOrThrow(res, "Generate RFP document");
};

/* ================= ERROR HANDLER ================= */
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const detail = error?.response?.data;
    if (detail instanceof Blob) {
      console.error("API error:", error.message, "(response body is a Blob; status", error.response?.status + ")");
    } else {
      console.error("API error:", detail || error.message);
    }
    return Promise.reject(error);
  }
);

export default API;