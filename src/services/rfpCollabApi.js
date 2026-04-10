/**
 * RFP collaboration API (backend in-memory). After login, pass `Authorization: Bearer <token>`
 * on every request (token is the user id).
 */
import API from "./api.js";

const C = "/rfp-collab";

function streamBaseUrl() {
  if (import.meta.env.DEV) {
    return typeof window !== "undefined" ? window.location.origin : "";
  }
  const fromEnv = (import.meta.env.VITE_API_URL ?? "").trim().replace(/\/$/, "");
  if (fromEnv) return fromEnv;
  return typeof window !== "undefined" ? window.location.origin : "";
}

function auth(token) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export const rfpCollab = {
  login: (email, password) => API.post(`${C}/auth/login`, { email, password }),

  listAuditors: (token) => API.get(`${C}/auditors`, auth(token)),
  listWorkspaces: (token) => API.get(`${C}/workspaces`, auth(token)),
  createWorkspace: (token, body) => API.post(`${C}/create-workspace`, body, auth(token)),
  getWorkspace: (token, workspaceId) =>
    API.get(`${C}/workspace/${workspaceId}`, auth(token)),
  assignQuestion: (token, body) => API.post(`${C}/assign-question`, body, auth(token)),

  auditorDashboard: (token, auditorId) =>
    API.get(`${C}/auditor-dashboard/${auditorId}`, auth(token)),

  saveDraft: (token, body) => API.post(`${C}/save-draft`, body, auth(token)),
  draftAnswerAi: (token, body) => API.post(`${C}/draft-answer-ai`, body, auth(token)),
  submitAnswer: (token, body) => API.post(`${C}/submit-answer`, body, auth(token)),

  reviewAnswer: (token, body) => API.post(`${C}/review-answer`, body, auth(token)),

  askClarification: (token, body) => API.post(`${C}/ask-clarification`, body, auth(token)),
  replyClarification: (token, body) => API.post(`${C}/reply-clarification`, body, auth(token)),
  clarifications: (token, workspaceId, questionId) =>
    API.get(`${C}/clarifications/${workspaceId}`, {
      ...auth(token),
      params: questionId ? { questionId } : {},
    }),

  logs: (token, workspaceId, params) =>
    API.get(`${C}/logs/${workspaceId}`, { ...auth(token), params }),

  quarterlyReview: (token, workspaceId) =>
    API.get(`${C}/quarterly-review/${workspaceId}`, auth(token)),
  quarterlyReviewUpdate: (token, body) =>
    API.post(`${C}/quarterly-review`, body, auth(token)),

  /**
   * Server-Sent Events (EventSource cannot send Authorization header). Backend accepts ?token=
   */
  subscribeLogsStream(workspaceId, token, { onEvent, onError } = {}) {
    const base = streamBaseUrl();
    const url = `${base}${C}/logs/${encodeURIComponent(workspaceId)}/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent?.(data);
      } catch {
        onEvent?.({ raw: e.data });
      }
    };
    es.onerror = () => {
      onError?.();
    };
    return () => {
      es.close();
    };
  },
};
