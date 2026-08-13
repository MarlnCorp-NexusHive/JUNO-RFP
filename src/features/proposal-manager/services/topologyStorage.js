const KEY = "juno_proposal_manager_topology";

export function loadTopologyPrefs() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { templateId: null, overlay: true };
    const parsed = JSON.parse(raw);
    return {
      templateId: parsed.templateId || null,
      overlay: parsed.overlay !== false,
    };
  } catch {
    return { templateId: null, overlay: true };
  }
}

export function saveTopologyPrefs(prefs) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...prefs, savedAt: new Date().toISOString() }));
  } catch {
    /* ignore */
  }
}
