import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getTrialSession } from "../../services/trialAuthSession.js";
import { parseLocalStorageJson } from "../../utils/safeStorage.js";

/** True when the main app session is a self-serve trial (not demo). */
export function isTrialUserSession() {
  const session = getTrialSession();
  const user = parseLocalStorageJson("rbac_current_user");
  return Boolean(session?.token || user?.isTrialUser);
}

/**
 * i18n keys whose demo copy says "auditor" — trial uses parallel *.trial.* keys
 * that say "Team member" instead. API roles / field names stay "auditor".
 */
const TRIAL_COPY_KEYS = {
  "rfpCollaboration.pmHubTitle": "rfpCollaboration.trial.pmHubTitle",
  "rfpCollaboration.pmOnlyPortal": "rfpCollaboration.trial.pmOnlyPortal",
  "rfpCollaboration.auditorOnlyPortal": "rfpCollaboration.trial.auditorOnlyPortal",
  "rfpCollaboration.signInAsAuditor": "rfpCollaboration.trial.signInAsAuditor",
  "rfpCollaboration.pmHubSubtitle": "rfpCollaboration.trial.pmHubSubtitle",
  "rfpCollaboration.reviewCommentPlaceholder": "rfpCollaboration.trial.reviewCommentPlaceholder",
  "rfpCollaboration.replyPlaceholder": "rfpCollaboration.trial.replyPlaceholder",
  "rfpCollaboration.assignAuditor": "rfpCollaboration.trial.assignAuditor",
  "rfpCollaboration.noAuditorsHint": "rfpCollaboration.trial.noAuditorsHint",
  "rfpCollaboration.askToAudit": "rfpCollaboration.trial.askToAudit",
  "rfpCollaboration.auditorPortalTitle": "rfpCollaboration.trial.auditorPortalTitle",
  "rfpCollaboration.auditorPortalSubtitle": "rfpCollaboration.trial.auditorPortalSubtitle",
  "rfpCollaboration.auditorLoginTitle": "rfpCollaboration.trial.auditorLoginTitle",
  "rfpCollaboration.auditorLoginHint": "rfpCollaboration.trial.auditorLoginHint",
  "rfpCollaboration.auditorMainLoginHint": "rfpCollaboration.trial.auditorMainLoginHint",
  "rfpCollaboration.rfpAuditorNavTitle": "rfpCollaboration.trial.rfpAuditorNavTitle",
  "rfpCollaboration.auditorLinkPrefix": "rfpCollaboration.trial.auditorLinkPrefix",
  "proposalManagerWorkspace.rfpWorkspace.auditLinkStale":
    "proposalManagerWorkspace.rfpWorkspace.trial.auditLinkStale",
  "proposalManagerWorkspace.rfpWorkspace.auditorSubmittedLabel":
    "proposalManagerWorkspace.rfpWorkspace.trial.auditorSubmittedLabel",
  "proposalManagerWorkspace.rfpWorkspace.insertAuditorResponse":
    "proposalManagerWorkspace.rfpWorkspace.trial.insertAuditorResponse",
  "proposalManagerWorkspace.rfpWorkspace.auditDraftInProgress":
    "proposalManagerWorkspace.rfpWorkspace.trial.auditDraftInProgress",
  "proposalManagerWorkspace.rfpWorkspace.auditWaitingAuditor":
    "proposalManagerWorkspace.rfpWorkspace.trial.auditWaitingAuditor",
  "proposalManagerWorkspace.rfpWorkspace.auditModalTitle":
    "proposalManagerWorkspace.rfpWorkspace.trial.auditModalTitle",
  "proposalManagerWorkspace.rfpWorkspace.auditSelectAuditor":
    "proposalManagerWorkspace.rfpWorkspace.trial.auditSelectAuditor",
  "proposalManagerWorkspace.rfpWorkspace.auditNoAuditors":
    "proposalManagerWorkspace.rfpWorkspace.trial.auditNoAuditors",
};

/**
 * Translation helper: same as `t`, but for trial sessions remaps auditor wording
 * to "Team member". Demo / non-trial is unchanged.
 */
export function useTrialCollabT() {
  const { t } = useTranslation();
  const trial = isTrialUserSession();

  return useCallback(
    (key, options) => {
      if (trial && TRIAL_COPY_KEYS[key]) {
        return t(TRIAL_COPY_KEYS[key], options);
      }
      return t(key, options);
    },
    [t, trial],
  );
}
