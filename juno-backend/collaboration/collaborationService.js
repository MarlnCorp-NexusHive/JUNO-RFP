import { store, generateId, activityBus } from "./store.js";
import { seedQuarterlyItems } from "./seedData.js";

/** @type {import("openai").OpenAI | null} */
let openaiClient = null;

export function setCollaborationOpenAI(client) {
  openaiClient = client;
}

function userName(userId) {
  return store.usersById.get(userId)?.name || userId;
}

function pushLog(workspaceId, { user, action, question, extra = {} }) {
  const qNum = question ? question.number : null;
  const qDb = question ? question.id : null;
  const entry = {
    user,
    action,
    question_id: qNum,
    question_db_id: qDb,
    timestamp: new Date().toISOString(),
    ...extra,
  };
  store.logs.push({ workspaceId, ...entry });
  activityBus.emit("activity", { workspaceId, ...entry });
}

function getWorkspaceOrThrow(workspaceId) {
  const ws = store.workspaces.get(workspaceId);
  if (!ws) {
    const e = new Error("Workspace not found");
    e.statusCode = 404;
    throw e;
  }
  return ws;
}

function getQuestionOrThrow(questionId) {
  const q = store.questions.get(questionId);
  if (!q) {
    const e = new Error("Question not found");
    e.statusCode = 404;
    throw e;
  }
  return q;
}

function assertPmWorkspace(pmUserId, workspaceId) {
  const ws = getWorkspaceOrThrow(workspaceId);
  if (ws.createdBy !== pmUserId) {
    const e = new Error("Not the owner of this workspace");
    e.statusCode = 403;
    throw e;
  }
  return ws;
}

export function login(email, password) {
  const id = store.usersByEmail.get(String(email || "").toLowerCase().trim());
  if (!id) {
    const e = new Error("Invalid credentials");
    e.statusCode = 401;
    throw e;
  }
  const u = store.usersById.get(id);
  if (!u || u.password !== password) {
    const e = new Error("Invalid credentials");
    e.statusCode = 401;
    throw e;
  }
  return {
    token: u.id,
    user: { id: u.id, email: u.email, name: u.name, role: u.role },
  };
}

export function listAuditors() {
  return [...store.usersById.values()]
    .filter((u) => u.role === "auditor")
    .map((u) => ({ id: u.id, email: u.email, name: u.name, role: u.role }));
}

export function listWorkspaces(pmUserId) {
  return [...store.workspaces.values()]
    .filter((w) => w.createdBy === pmUserId)
    .map((w) => ({
      id: w.id,
      title: w.title,
      createdAt: w.createdAt,
      questionCount: [...store.questions.values()].filter((q) => q.workspaceId === w.id).length,
    }));
}

export function createWorkspace(pmUserId, { title, document, questions }) {
  const wsId = generateId("ws");
  const ws = {
    id: wsId,
    title: String(title || "Untitled RFP").slice(0, 500),
    documentText: String(document || "").slice(0, 500_000),
    createdBy: pmUserId,
    createdAt: new Date().toISOString(),
  };
  store.workspaces.set(wsId, ws);

  const list = Array.isArray(questions) ? questions : [];
  list.forEach((raw, idx) => {
    const qid = generateId("q");
    const q = {
      id: qid,
      workspaceId: wsId,
      number: Number(raw?.number) || idx + 1,
      text: String(raw?.text || "").slice(0, 50_000),
      status: "unassigned",
      assignedTo: null,
      answerDraft: "",
      submittedAnswer: null,
      pmReviewComment: null,
      updatedAt: new Date().toISOString(),
    };
    store.questions.set(qid, q);
  });

  seedQuarterlyItems(wsId);

  pushLog(wsId, {
    user: userName(pmUserId),
    action: "Workspace created",
    question: null,
    extra: { title: ws.title },
  });

  return getWorkspaceDetail(wsId, pmUserId);
}

export function getWorkspaceDetail(workspaceId, requesterId) {
  getWorkspaceOrThrow(workspaceId);
  const requester = store.usersById.get(requesterId);
  if (!requester) {
    const e = new Error("User not found");
    e.statusCode = 401;
    throw e;
  }
  const ws = store.workspaces.get(workspaceId);
  if (requester.role === "proposal_manager") {
    if (ws.createdBy !== requesterId) {
      const e = new Error("Forbidden");
      e.statusCode = 403;
      throw e;
    }
  } else if (requester.role === "auditor") {
    const hasAssignment = [...store.questions.values()].some(
      (q) => q.workspaceId === workspaceId && q.assignedTo === requesterId,
    );
    if (!hasAssignment) {
      const e = new Error("Forbidden — no assignments in this workspace");
      e.statusCode = 403;
      throw e;
    }
  } else {
    const e = new Error("Forbidden");
    e.statusCode = 403;
    throw e;
  }

  const questions = [...store.questions.values()]
    .filter((q) => q.workspaceId === workspaceId)
    .sort((a, b) => a.number - b.number)
    .map((q) => summarizeQuestion(q, requester));

  return {
    workspace: {
      id: ws.id,
      title: ws.title,
      documentText: ws.documentText,
      createdBy: ws.createdBy,
      createdAt: ws.createdAt,
    },
    questions,
  };
}

function summarizeQuestion(q, requester) {
  const base = {
    id: q.id,
    workspaceId: q.workspaceId,
    number: q.number,
    text: q.text,
    status: q.status,
    assignedTo: q.assignedTo,
    assignedToName: q.assignedTo ? userName(q.assignedTo) : null,
    answerDraft: q.answerDraft,
    submittedAnswer: q.submittedAnswer,
    pmReviewComment: q.pmReviewComment,
    updatedAt: q.updatedAt,
  };
  if (requester.role === "auditor" && q.assignedTo !== requester.id) {
    return {
      id: q.id,
      workspaceId: q.workspaceId,
      number: q.number,
      text: q.status === "assigned" || q.status === "in_progress" ? q.text : "[Restricted]",
      status: q.assignedTo === requester.id ? q.status : "unassigned",
      assignedTo: q.assignedTo,
      assignedToName: base.assignedToName,
      answerDraft: q.assignedTo === requester.id ? q.answerDraft : "",
      submittedAnswer: q.assignedTo === requester.id ? q.submittedAnswer : null,
      pmReviewComment: q.assignedTo === requester.id ? q.pmReviewComment : null,
      updatedAt: q.updatedAt,
    };
  }
  return base;
}

export function assignQuestion(pmUserId, { workspaceId, questionId, auditorUserId }) {
  assertPmWorkspace(pmUserId, workspaceId);
  const q = getQuestionOrThrow(questionId);
  if (q.workspaceId !== workspaceId) {
    const e = new Error("Question does not belong to workspace");
    e.statusCode = 400;
    throw e;
  }
  const auditor = store.usersById.get(auditorUserId);
  if (!auditor || auditor.role !== "auditor") {
    const e = new Error("Invalid auditor");
    e.statusCode = 400;
    throw e;
  }
  q.assignedTo = auditorUserId;
  q.status = "assigned";
  q.updatedAt = new Date().toISOString();

  pushLog(workspaceId, {
    user: userName(pmUserId),
    action: "Question assigned to auditor",
    question: q,
    extra: { auditor: auditor.name, auditor_id: auditorUserId },
  });

  return { question: summarizeQuestion(q, store.usersById.get(pmUserId)) };
}

export function getAuditorDashboard(auditorId) {
  const auditor = store.usersById.get(auditorId);
  if (!auditor || auditor.role !== "auditor") {
    const e = new Error("Invalid auditor");
    e.statusCode = 404;
    throw e;
  }
  const assigned = [...store.questions.values()].filter((q) => q.assignedTo === auditorId);
  return {
    auditor: { id: auditor.id, name: auditor.name, email: auditor.email },
    questions: assigned
      .sort((a, b) => a.number - b.number)
      .map((q) => summarizeQuestion(q, auditor)),
  };
}

export function saveDraft(auditorUserId, { workspaceId, questionId, answerDraft }) {
  const q = getQuestionOrThrow(questionId);
  if (q.workspaceId !== workspaceId) {
    const e = new Error("Mismatch");
    e.statusCode = 400;
    throw e;
  }
  if (q.assignedTo !== auditorUserId) {
    const e = new Error("Not assigned to you");
    e.statusCode = 403;
    throw e;
  }
  const prev = q.answerDraft;
  q.answerDraft = String(answerDraft || "").slice(0, 100_000);
  if (q.status === "assigned") q.status = "in_progress";
  q.updatedAt = new Date().toISOString();

  if (q.answerDraft !== prev) {
    pushLog(workspaceId, {
      user: userName(auditorUserId),
      action: "Answer draft updated",
      question: q,
    });
  }

  return { question: summarizeQuestion(q, store.usersById.get(auditorUserId)) };
}

export async function draftAnswerWithAi(auditorUserId, { workspaceId, questionId }) {
  if (!openaiClient) {
    const e = new Error("OpenAI not configured");
    e.statusCode = 503;
    throw e;
  }
  const q = getQuestionOrThrow(questionId);
  if (q.workspaceId !== workspaceId || q.assignedTo !== auditorUserId) {
    const e = new Error("Forbidden");
    e.statusCode = 403;
    throw e;
  }
  const ws = getWorkspaceOrThrow(workspaceId);
  const docExcerpt = ws.documentText.slice(0, 12_000);

  const response = await openaiClient.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      {
        role: "system",
        content:
          "You are an expert RFP response writer. Write a formal, professional proposal-style answer. Use clear structure. Do not invent facts not supported by the RFP excerpt or the question; if context is thin, state reasonable assumptions briefly. Output only the answer body, no preamble.",
      },
      {
        role: "user",
        content: `RFP excerpt (reference):\n${docExcerpt || "(none)"}\n\n---\nRequirement / question:\n${q.text}\n\n---\nDraft a compliant response suitable for submission.`,
      },
    ],
    temperature: 0.35,
    max_completion_tokens: 2048,
  });

  const text = response.choices[0]?.message?.content?.trim() || "";
  q.answerDraft = text.slice(0, 100_000);
  if (q.status === "assigned") q.status = "in_progress";
  q.updatedAt = new Date().toISOString();

  pushLog(workspaceId, {
    user: userName(auditorUserId),
    action: "AI answer generated",
    question: q,
  });

  return { answerDraft: q.answerDraft, question: summarizeQuestion(q, store.usersById.get(auditorUserId)) };
}

export function submitAnswer(auditorUserId, { workspaceId, questionId, answerText }) {
  const q = getQuestionOrThrow(questionId);
  if (q.workspaceId !== workspaceId || q.assignedTo !== auditorUserId) {
    const e = new Error("Forbidden");
    e.statusCode = 403;
    throw e;
  }
  if (q.status === "approved") {
    const e = new Error("This answer is already approved");
    e.statusCode = 400;
    throw e;
  }
  const body = String(answerText ?? q.answerDraft ?? "").slice(0, 100_000);
  if (!body.trim()) {
    const e = new Error("Answer text required");
    e.statusCode = 400;
    throw e;
  }
  q.submittedAnswer = body;
  q.answerDraft = body;
  q.status = "submitted";
  q.pmReviewComment = null;
  q.updatedAt = new Date().toISOString();

  pushLog(workspaceId, {
    user: userName(auditorUserId),
    action: "Submitted answer",
    question: q,
  });

  return { question: summarizeQuestion(q, store.usersById.get(auditorUserId)) };
}

export function reviewAnswer(pmUserId, { workspaceId, questionId, decision, comment }) {
  assertPmWorkspace(pmUserId, workspaceId);
  const q = getQuestionOrThrow(questionId);
  if (q.workspaceId !== workspaceId) {
    const e = new Error("Bad request");
    e.statusCode = 400;
    throw e;
  }
  if (q.status !== "submitted") {
    const e = new Error("Question must be in submitted status to review");
    e.statusCode = 400;
    throw e;
  }
  const d = String(decision || "").toLowerCase();
  if (!["approve", "reject", "request_changes"].includes(d)) {
    const e = new Error("decision must be approve | reject | request_changes");
    e.statusCode = 400;
    throw e;
  }
  q.pmReviewComment = comment != null ? String(comment).slice(0, 10_000) : null;
  if (d === "approve") q.status = "approved";
  else if (d === "reject") q.status = "rejected";
  else q.status = "changes_requested";
  q.updatedAt = new Date().toISOString();

  const actionMap = {
    approve: "Answer approved",
    reject: "Answer rejected",
    request_changes: "Changes requested",
  };
  pushLog(workspaceId, {
    user: userName(pmUserId),
    action: actionMap[d],
    question: q,
    extra: { comment: q.pmReviewComment },
  });

  return { question: summarizeQuestion(q, store.usersById.get(pmUserId)) };
}

export function askClarification(auditorUserId, { workspaceId, questionId, message }) {
  const q = getQuestionOrThrow(questionId);
  if (q.workspaceId !== workspaceId || q.assignedTo !== auditorUserId) {
    const e = new Error("Forbidden");
    e.statusCode = 403;
    throw e;
  }
  const body = String(message || "").trim();
  if (!body) {
    const e = new Error("message required");
    e.statusCode = 400;
    throw e;
  }
  const msg = {
    id: generateId("msg"),
    workspaceId,
    questionId,
    fromUserId: auditorUserId,
    body: body.slice(0, 20_000),
    thread: "clarification",
    createdAt: new Date().toISOString(),
  };
  store.messages.push(msg);

  pushLog(workspaceId, {
    user: userName(auditorUserId),
    action: "Auditor asked clarification",
    question: q,
    extra: { message_id: msg.id, preview: body.slice(0, 200) },
  });

  return { message: msg };
}

export function replyClarification(pmUserId, { workspaceId, questionId, message }) {
  assertPmWorkspace(pmUserId, workspaceId);
  getQuestionOrThrow(questionId);
  const body = String(message || "").trim();
  if (!body) {
    const e = new Error("message required");
    e.statusCode = 400;
    throw e;
  }
  const msg = {
    id: generateId("msg"),
    workspaceId,
    questionId,
    fromUserId: pmUserId,
    body: body.slice(0, 20_000),
    thread: "reply",
    createdAt: new Date().toISOString(),
  };
  store.messages.push(msg);

  pushLog(workspaceId, {
    user: userName(pmUserId),
    action: "Proposal Manager replied to clarification",
    question: store.questions.get(questionId),
    extra: { message_id: msg.id, preview: body.slice(0, 200) },
  });

  return { message: msg };
}

export function listClarifications(workspaceId, requesterId, { questionId } = {}) {
  const requester = store.usersById.get(requesterId);
  const ws = getWorkspaceOrThrow(workspaceId);
  let allowed = false;
  if (requester?.role === "proposal_manager" && ws.createdBy === requesterId) allowed = true;
  if (requester?.role === "auditor") {
    if (questionId) {
      const q = store.questions.get(questionId);
      allowed = Boolean(q && q.workspaceId === workspaceId && q.assignedTo === requesterId);
    } else {
      allowed = [...store.questions.values()].some(
        (q) => q.workspaceId === workspaceId && q.assignedTo === requesterId,
      );
    }
  }
  if (!allowed) {
    const e = new Error("Forbidden");
    e.statusCode = 403;
    throw e;
  }
  let list = store.messages.filter((m) => m.workspaceId === workspaceId);
  if (questionId) list = list.filter((m) => m.questionId === questionId);
  return list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function getLogs(workspaceId, pmUserId, { since } = {}) {
  assertPmWorkspace(pmUserId, workspaceId);
  let rows = store.logs.filter((l) => l.workspaceId === workspaceId);
  if (since) {
    rows = rows.filter((l) => l.timestamp >= since);
  }
  return rows.map(({ workspaceId: _w, ...rest }) => rest);
}

export function getQuarterlyReview(workspaceId, requesterId) {
  getWorkspaceDetail(workspaceId, requesterId);
  const items = store.quarterlyByWorkspace.get(workspaceId) || [];
  return { items };
}

export function updateQuarterlyReview(auditorUserId, { workspaceId, reviewItemId, status }) {
  const auditor = store.usersById.get(auditorUserId);
  if (!auditor || auditor.role !== "auditor") {
    const e = new Error("Auditors only");
    e.statusCode = 403;
    throw e;
  }
  getWorkspaceOrThrow(workspaceId);
  const hasAssignment = [...store.questions.values()].some(
    (q) => q.workspaceId === workspaceId && q.assignedTo === auditorUserId,
  );
  if (!hasAssignment) {
    const e = new Error("You have no assignments in this workspace");
    e.statusCode = 403;
    throw e;
  }
  const items = store.quarterlyByWorkspace.get(workspaceId);
  if (!items) {
    const e = new Error("No quarterly items");
    e.statusCode = 404;
    throw e;
  }
  const item = items.find((i) => i.id === reviewItemId);
  if (!item) {
    const e = new Error("Review item not found");
    e.statusCode = 404;
    throw e;
  }
  const s = String(status || "");
  if (!["up_to_date", "needs_update", "outdated"].includes(s)) {
    const e = new Error("status must be up_to_date | needs_update | outdated");
    e.statusCode = 400;
    throw e;
  }
  item.status = s;
  item.lastReviewedAt = new Date().toISOString();
  item.lastReviewedBy = auditorUserId;

  pushLog(workspaceId, {
    user: userName(auditorUserId),
    action: "Quarterly content review updated",
    question: null,
    extra: {
      review_item_id: reviewItemId,
      category: item.category,
      status: s,
    },
  });

  return { item };
}

export function handleServiceError(res, err) {
  const code = err.statusCode || 500;
  res.status(code).json({ error: err.message || "Server error" });
}
