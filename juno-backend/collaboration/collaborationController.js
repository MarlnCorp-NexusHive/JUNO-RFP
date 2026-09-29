import * as svc from "./collaborationService.js";
import { activityBus } from "./store.js";
import { hydrateTrialCollabForTenant } from "./collaborationPersistence.js";

export async function login(req, res) {
  try {
    const { email, password } = req.body || {};
    const out = svc.login(email, password);
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

/** Trial tenants: company-wide collab PM + sync reviewers from company roster. */
export function trialSession(req, res) {
  try {
    const out = svc.ensureTrialProposalManager({
      tenantId: req.tenantId,
      name: req.trialUser?.name,
    });
    hydrateTrialCollabForTenant(req.tenantId, {
      ensurePm: svc.ensureTrialProposalManager,
      ensureAuditor: svc.ensureTrialAuditor,
    });
    svc.hydrateTrialUsersFromWorkspaces();
    const auditors = svc.syncTrialCompanyAuditors(req.tenantId);
    res.json({ ...out, auditors });
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

/** Trial teammate: company-scoped reviewer session for the signed-in trial user. */
export function trialAuditorSession(req, res) {
  try {
    const out = svc.ensureTrialAuditorSession({
      tenantId: req.tenantId,
      email: req.trialUser?.email,
      name: req.trialUser?.name,
    });
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function listAuditors(req, res) {
  try {
    res.json({ auditors: svc.listAuditors(req.userId) });
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

/** Refresh company reviewer pool from tenant members + Manage Team. */
export function syncTrialAuditors(req, res) {
  try {
    const tenantId = req.tenantId;
    if (!tenantId) {
      return res.status(400).json({ error: "Trial tenant required", code: "tenant_required" });
    }
    const auditors = svc.syncTrialCompanyAuditors(tenantId);
    res.json({ ok: true, auditors });
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function listWorkspaces(req, res) {
  try {
    res.json({ workspaces: svc.listWorkspaces(req.userId) });
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function createWorkspace(req, res) {
  try {
    const out = svc.createWorkspace(req.userId, req.body || {});
    res.status(201).json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function getWorkspace(req, res) {
  try {
    const out = svc.getWorkspaceDetail(req.params.workspaceId, req.userId);
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function assignQuestion(req, res) {
  try {
    const out = svc.assignQuestion(req.userId, req.body || {});
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function auditorDashboard(req, res) {
  try {
    const out = svc.getAuditorDashboard(req.params.auditorId);
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function saveDraft(req, res) {
  try {
    const out = svc.saveDraft(req.userId, req.body || {});
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export async function draftAnswerAi(req, res) {
  try {
    const out = await svc.draftAnswerWithAi(req.userId, req.body || {});
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function submitAnswer(req, res) {
  try {
    const out = svc.submitAnswer(req.userId, req.body || {});
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function reviewAnswer(req, res) {
  try {
    const out = svc.reviewAnswer(req.userId, req.body || {});
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function askClarification(req, res) {
  try {
    const out = svc.askClarification(req.userId, req.body || {});
    res.status(201).json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function replyClarification(req, res) {
  try {
    const out = svc.replyClarification(req.userId, req.body || {});
    res.status(201).json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function clarifications(req, res) {
  try {
    const qid = req.query.questionId || undefined;
    const list = svc.listClarifications(req.params.workspaceId, req.userId, {
      questionId: qid,
    });
    res.json({ messages: list });
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function logs(req, res) {
  try {
    const since = req.query.since;
    const rows = svc.getLogs(req.params.workspaceId, req.userId, { since });
    res.json({ logs: rows });
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function logsStream(req, res) {
  const { workspaceId } = req.params;
  try {
    svc.getLogs(workspaceId, req.userId, {});
  } catch (e) {
    return svc.handleServiceError(res, e);
  }

  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  const send = (payload) => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`);
  };

  const onActivity = (payload) => {
    if (payload.workspaceId === workspaceId) {
      const { workspaceId: _w, ...rest } = payload;
      send(rest);
    }
  };

  activityBus.on("activity", onActivity);
  send({ type: "connected", workspaceId, timestamp: new Date().toISOString() });

  const ping = setInterval(() => {
    res.write(`: ping ${Date.now()}\n\n`);
  }, 25000);

  req.on("close", () => {
    clearInterval(ping);
    activityBus.off("activity", onActivity);
  });
}

export function quarterlyGet(req, res) {
  try {
    const out = svc.getQuarterlyReview(req.params.workspaceId, req.userId);
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}

export function quarterlyPost(req, res) {
  try {
    const out = svc.updateQuarterlyReview(req.userId, req.body || {});
    res.json(out);
  } catch (e) {
    svc.handleServiceError(res, e);
  }
}
