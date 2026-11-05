const STORAGE_KEY = "juno_nav_mode";
const EVENT = "juno-nav-mode-changed";

/** @typedef {"guided" | "classic"} NavMode */

/** @returns {NavMode} */
export function getNavMode() {
  try {
    const raw = String(localStorage.getItem(STORAGE_KEY) || "").trim().toLowerCase();
    if (raw === "classic") return "classic";
  } catch {
    /* ignore */
  }
  return "guided";
}

/** @param {NavMode} mode */
export function setNavMode(mode) {
  const next = mode === "classic" ? "classic" : "guided";
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(EVENT, { detail: { mode: next } }));
  }
  return next;
}

export function isGuidedNav() {
  return getNavMode() === "guided";
}

/** Default landing path for Proposal Manager sessions. */
export function proposalManagerLandingPath() {
  return isGuidedNav() ? "/app/home" : "/app/dashboard";
}

export function subscribeNavMode(listener) {
  const onStorage = (e) => {
    if (e.key === STORAGE_KEY) listener(getNavMode());
  };
  const onCustom = () => listener(getNavMode());
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, onCustom);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, onCustom);
  };
}
