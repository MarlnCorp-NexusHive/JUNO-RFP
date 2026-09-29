/** App-wide 24-hour clock formatting (no AM/PM). */

const TIME_24 = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

/**
 * @param {Date|string|number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatTime24(value, options = {}) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString(undefined, { ...TIME_24, ...options, hour12: false });
}

/**
 * Date + time with 24-hour clock.
 * @param {Date|string|number} value
 * @param {Intl.DateTimeFormatOptions} [options]
 * @returns {string}
 */
export function formatDateTime24(value, options = {}) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, { ...options, hour12: false });
}

/** FullCalendar event/slot label options (24-hour). */
export const FULLCALENDAR_TIME_24 = {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  meridiem: false,
};
