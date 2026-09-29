const MONTHS = {
  january: 0,
  jan: 0,
  february: 1,
  feb: 1,
  march: 2,
  mar: 2,
  april: 3,
  apr: 3,
  may: 4,
  june: 5,
  jun: 5,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sep: 8,
  sept: 8,
  october: 9,
  oct: 9,
  november: 10,
  nov: 10,
  december: 11,
  dec: 11,
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

/** @returns {string|null} YYYY-MM-DD */
export function parseDateToISO(value) {
  const raw = String(value || "").trim();
  if (!raw) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;

  const slash = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slash) {
    let y = Number(slash[3]);
    if (y < 100) y += 2000;
    const m = Number(slash[1]);
    const d = Number(slash[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) return `${y}-${pad2(m)}-${pad2(d)}`;
  }

  const named = raw.match(/([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})/);
  if (named) {
    const mon = MONTHS[named[1].toLowerCase()];
    if (mon != null) {
      const d = Number(named[2]);
      const y = Number(named[3]);
      return `${y}-${pad2(mon + 1)}-${pad2(d)}`;
    }
  }

  const dmy = raw.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (dmy) {
    const mon = MONTHS[dmy[2].toLowerCase()];
    if (mon != null) {
      return `${dmy[3]}-${pad2(mon + 1)}-${pad2(dmy[1])}`;
    }
  }

  const dt = new Date(raw);
  if (!Number.isNaN(dt.getTime())) {
    return `${dt.getFullYear()}-${pad2(dt.getMonth() + 1)}-${pad2(dt.getDate())}`;
  }
  return null;
}
