const KEY = "juno_proposal_manager_win_slide";

export function loadWinSlideDraft() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWinSlideDraft(draft) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
  } catch {
    /* ignore */
  }
}
