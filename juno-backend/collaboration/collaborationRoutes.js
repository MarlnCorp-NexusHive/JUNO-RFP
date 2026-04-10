import { Router } from "express";
import * as ctrl from "./collaborationController.js";
import { requireAuth, requireRoles, requireAuditorSelfOrPm } from "./authMiddleware.js";

const router = Router();

/** Public */
router.post("/auth/login", ctrl.login);

/** Authenticated */
router.use(requireAuth);

router.get("/auditors", requireRoles("proposal_manager"), ctrl.listAuditors);
router.get("/workspaces", requireRoles("proposal_manager"), ctrl.listWorkspaces);
router.post("/create-workspace", requireRoles("proposal_manager"), ctrl.createWorkspace);
router.get("/workspace/:workspaceId", ctrl.getWorkspace);
router.post("/assign-question", requireRoles("proposal_manager"), ctrl.assignQuestion);

router.get(
  "/auditor-dashboard/:auditorId",
  requireAuditorSelfOrPm("auditorId"),
  ctrl.auditorDashboard,
);

router.post("/save-draft", requireRoles("auditor"), ctrl.saveDraft);
router.post("/draft-answer-ai", requireRoles("auditor"), ctrl.draftAnswerAi);
router.post("/submit-answer", requireRoles("auditor"), ctrl.submitAnswer);

router.post("/review-answer", requireRoles("proposal_manager"), ctrl.reviewAnswer);

router.post("/ask-clarification", requireRoles("auditor"), ctrl.askClarification);
router.post("/reply-clarification", requireRoles("proposal_manager"), ctrl.replyClarification);
router.get("/clarifications/:workspaceId", ctrl.clarifications);

router.get("/logs/:workspaceId", requireRoles("proposal_manager"), ctrl.logs);
router.get("/logs/:workspaceId/stream", requireRoles("proposal_manager"), ctrl.logsStream);

router.get("/quarterly-review/:workspaceId", ctrl.quarterlyGet);
router.post("/quarterly-review", requireRoles("auditor"), ctrl.quarterlyPost);

export default router;
