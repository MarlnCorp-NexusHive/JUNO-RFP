import { seedUsers } from "./seedData.js";
import { setCollaborationOpenAI, hydrateTrialUsersFromWorkspaces } from "./collaborationService.js";
import {
  loadCollaborationState,
  registerCollaborationPersistOnExit,
} from "./collaborationPersistence.js";
import collaborationRouter from "./collaborationRoutes.js";

/**
 * @param {import("openai").OpenAI} openai
 */
export function initCollaboration(openai) {
  seedUsers();
  loadCollaborationState();
  hydrateTrialUsersFromWorkspaces();
  setCollaborationOpenAI(openai);
  registerCollaborationPersistOnExit();
}

export { collaborationRouter };
