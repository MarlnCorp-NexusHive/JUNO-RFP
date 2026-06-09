import { loadCalendarState } from "./calendarPersistence.js";
import { calendarRouter } from "./calendarController.js";

export function initCalendar() {
  loadCalendarState();
}

export { calendarRouter };
