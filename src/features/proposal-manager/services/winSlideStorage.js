import { scopedStorageKey } from "../../../services/tenantScopedStorage.js";
import { persistTrialFeatureData, canUseTrialFeatures, loadTrialFeatureData } from "../../../services/trialFeatureApi.js";

const KEY = "juno_proposal_manager_win_slide";

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

export async function hydrateWinSlideFromBackend() {
  if (!canUseTrialFeatures()) return loadWinSlideDraft();
  const data = await loadTrialFeatureData("winSlide", { draft: null, settings: {} });
  if (data?.draft) {
    localStorage.setItem(scopedStorageKey(KEY), JSON.stringify(data.draft));
    return data.draft;
  }
  return null;
}
