import { seedUsers } from "./seedData.js";
import { setCollaborationOpenAI } from "./collaborationService.js";
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
  setCollaborationOpenAI(openai);
  registerCollaborationPersistOnExit();
}

export { collaborationRouter };
