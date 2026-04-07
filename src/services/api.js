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
});

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

/* ================= RFP DOCUMENT ================= */
export const generateRfpDocument = async (payload) => {
  const res = await API.post("/generate-rfp-document", payload, {
    responseType: "blob",
  });
  return res.data;
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