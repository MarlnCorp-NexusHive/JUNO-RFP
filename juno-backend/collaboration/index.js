import { seedUsers } from "./seedData.js";
import {
  setCollaborationOpenAI,
  hydrateTrialUsersFromWorkspaces,
  ensureTrialProposalManager,
  ensureTrialAuditor,
} from "./collaborationService.js";
import {
  loadCollaborationState,
  registerCollaborationPersistOnExit,
  hydrateTrialCollabFromFeatureStore,
} from "./collaborationPersistence.js";
import collaborationRouter from "./collaborationRoutes.js";

/**
 * @param {import("openai").OpenAI} openai
 */
export function initCollaboration(openai) {
  seedUsers();
  loadCollaborationState();
  hydrateTrialUsersFromWorkspaces();
  hydrateTrialCollabFromFeatureStore({
    ensurePm: ensureTrialProposalManager,
    ensureAuditor: ensureTrialAuditor,
  });
  hydrateTrialUsersFromWorkspaces();
  setCollaborationOpenAI(openai);
  registerCollaborationPersistOnExit();
}

export { collaborationRouter };
