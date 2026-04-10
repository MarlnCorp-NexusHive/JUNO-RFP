/**
 * JSDoc shapes for in-memory collaboration (no runtime import).
 * @typedef {{ id: string; email: string; password: string; name: string; role: 'proposal_manager'|'auditor' }} UserRecord
 * @typedef {{ id: string; title: string; documentText: string; createdBy: string; createdAt: string }} Workspace
 * @typedef {'unassigned'|'assigned'|'in_progress'|'submitted'|'approved'|'rejected'|'changes_requested'} QuestionStatus
 * @typedef {{ id: string; workspaceId: string; number: number; text: string; status: QuestionStatus; assignedTo: string|null; answerDraft: string; submittedAnswer: string|null; pmReviewComment: string|null; updatedAt: string }} Question
 * @typedef {{ id: string; workspaceId: string; questionId: string; fromUserId: string; body: string; thread: 'clarification'|'reply'; createdAt: string }} ClarificationMessage
 * @typedef {{ workspaceId: string; user: string; action: string; question_id: number|null; question_db_id: string|null; timestamp: string; [key: string]: unknown }} ActivityLogEntry
 * @typedef {{ id: string; workspaceId: string; category: 'product_roadmap'|'company_info'|'technical_capabilities'; title: string; status: 'up_to_date'|'needs_update'|'outdated'|null; lastReviewedAt: string|null; lastReviewedBy: string|null }} QuarterlyItem
 */

export {};
