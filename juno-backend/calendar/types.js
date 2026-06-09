/**
 * @typedef {'deadline'|'milestone'|'meeting'|'assignment'|'submission'|'review'|'task'} CalendarEventType
 * @typedef {'manual'|'collaboration'|'rfp-deadline'} CalendarEventSource
 *
 * @typedef {{
 *   id: string;
 *   title: string;
 *   start: string;
 *   end?: string|null;
 *   allDay?: boolean;
 *   type: CalendarEventType;
 *   source: CalendarEventSource;
 *   workspaceId?: string|null;
 *   documentId?: string|null;
 *   assigneeIds?: string[];
 *   assigneeNames?: string[];
 *   status?: string|null;
 *   description?: string|null;
 *   location?: string|null;
 *   bidName?: string|null;
 *   questionNumber?: number|null;
 *   color?: string|null;
 *   createdAt: string;
 *   updatedAt: string;
 * }} CalendarEventRecord
 */

export {};
