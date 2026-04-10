/**
 * Read JSON from localStorage without throwing. Corrupt or partial values return null.
 */
export function parseLocalStorageJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null || raw === "") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
