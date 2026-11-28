import { loadCalendarState, registerCalendarPersistOnExit } from "./calendarPersistence.js";
import { calendarRouter } from "./calendarController.js";

export function initCalendar() {
  loadCalendarState();
  registerCalendarPersistOnExit();
}

export { calendarRouter };
