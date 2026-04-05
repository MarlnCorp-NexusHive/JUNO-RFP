import axios from "axios";

/* ================= BASE API ================= */

// Use ONE consistent env variable everywhere
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
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

  // IMPORTANT: do NOT set headers manually
  const res = await API.post("/ask-with-file", formData);

  return res.data.answer;
};

export default API;