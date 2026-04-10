import { seedUsers } from "./seedData.js";
import { setCollaborationOpenAI } from "./collaborationService.js";
import collaborationRouter from "./collaborationRoutes.js";

/**
 * @param {import("openai").OpenAI} openai
 */
export function initCollaboration(openai) {
  seedUsers();
  setCollaborationOpenAI(openai);
}

export { collaborationRouter };
