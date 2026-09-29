import { scopedStorageKey } from "../../../services/tenantScopedStorage.js";
import { persistTrialFeatureData, canUseTrialFeatures, loadTrialFeatureData } from "../../../services/trialFeatureApi.js";

const KEY = "juno_proposal_manager_win_slide";

/** Blank draft for trial clean slate (and as hydrate fallback). */
export function emptyWinSlideDraft() {
  return {
    pursuitId: "",
    competitorIds: [],
    customCompetitors: [],
    outcome: "",
    pov: "",
    testing: "",
    whyUs: "",
    whyThem: "",
  };
}

export function loadWinSlideDraft() {
  try {
    const raw = localStorage.getItem(scopedStorageKey(KEY));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveWinSlideDraft(draft) {
  try {
    const next = { ...draft, savedAt: new Date().toISOString() };
    localStorage.setItem(scopedStorageKey(KEY), JSON.stringify(next));
    if (canUseTrialFeatures()) {
      persistTrialFeatureData("winSlide", { draft: next, settings: {} });
    }
  } catch {
    /* ignore */
  }
}

function clearLocalDraft() {
  try {
    localStorage.removeItem(scopedStorageKey(KEY));
  } catch {
    /* ignore */
  }
}

export async function hydrateWinSlideFromBackend() {
  if (!canUseTrialFeatures()) return loadWinSlideDraft();
  const data = await loadTrialFeatureData("winSlide", { draft: null, settings: {} });
  const draft = data?.draft && typeof data.draft === "object" ? data.draft : null;
  const hasContent =
    draft &&
    Boolean(
      draft.pursuitId ||
        draft.pov ||
        draft.testing ||
        draft.whyUs ||
        draft.whyThem ||
        (Array.isArray(draft.competitorIds) && draft.competitorIds.length > 0) ||
        draft.outcome
    );
  if (hasContent) {
    localStorage.setItem(scopedStorageKey(KEY), JSON.stringify(draft));
    return draft;
  }
  // No saved trial draft — wipe any leftover local demo copy.
  clearLocalDraft();
  return emptyWinSlideDraft();
}
