import { isRTL } from './rtl.js';

/**
 * Master switch for Proposal Manager demo Arabic support.
 * When true: Arabic is available on login + for Proposal Manager sessions.
 * Other RBAC roles still stay English-only. Locale files remain loaded either way.
 */
export const ARABIC_LANGUAGE_ENABLED = true;

/** Full catalog (kept for when Arabic is re-enabled). */
export const ALL_SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

function readCurrentUser() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('rbac_current_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function isProposalManagerUser(user = readCurrentUser()) {
  if (!user || typeof user !== 'object') return false;
  const username = String(user.username || '').toLowerCase();
  const role = String(user.role || '').toLowerCase();
  const team = String(user.team || '').toLowerCase();
  return (
    username === 'proposal_manager' ||
    role === 'proposal manager' ||
    team === 'proposal team' ||
    Boolean(user.isTrialUser)
  );
}

/**
 * Arabic UI is allowed on the shared login page and for Proposal Manager
 * (demo + trial) sessions — including /app and related chrome.
 */
export function isArabicUiEnabled(pathname) {
  if (!ARABIC_LANGUAGE_ENABLED) return false;

  const path =
    pathname != null
      ? String(pathname)
      : typeof window !== 'undefined'
        ? String(window.location?.pathname || '')
        : '';

  if (path === '/' || path.startsWith('/login')) return true;
  if (path.startsWith('/app')) return true;
  if (path.startsWith('/corporate-info') && isProposalManagerUser()) return true;

  return isProposalManagerUser();
}

/** Languages offered in the UI for the current context. */
export function getSupportedLanguages(pathname) {
  return isArabicUiEnabled(pathname)
    ? ALL_SUPPORTED_LANGUAGES
    : ALL_SUPPORTED_LANGUAGES.filter((lang) => lang.code === 'en');
}

/** @deprecated Prefer getSupportedLanguages() — kept for older imports. */
export const SUPPORTED_LANGUAGES = ALL_SUPPORTED_LANGUAGES;

export const getLanguageByCode = (code) => {
  return ALL_SUPPORTED_LANGUAGES.find(lang => lang.code === code) || ALL_SUPPORTED_LANGUAGES[0];
};

export const getLanguageName = (code, currentLanguage = 'en') => {
  const language = getLanguageByCode(code);
  return currentLanguage === 'ar' ? language.nativeName : language.name;
};

export const saveLanguagePreference = (languageCode, pathname) => {
  try {
    const allowAr = isArabicUiEnabled(pathname);
    const code = !allowAr && languageCode === 'ar' ? 'en' : languageCode;
    localStorage.setItem('preferred-language', code);
    document.documentElement.lang = code;
    document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
};

export const getLanguagePreference = (pathname) => {
  try {
    const saved = localStorage.getItem('preferred-language') || 'en';
    if (!isArabicUiEnabled(pathname) && String(saved).toLowerCase().startsWith('ar')) {
      return 'en';
    }
    return saved;
  } catch (error) {
    console.error('Failed to get language preference:', error);
    return 'en';
  }
};

export const detectUserLanguage = (pathname) => {
  if (!isArabicUiEnabled(pathname)) return 'en';

  const saved = getLanguagePreference(pathname);
  if (saved) return saved;
  
  try {
    const browserLang = navigator.language.split('-')[0];
    return ALL_SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang) ? browserLang : 'en';
  } catch (error) {
    console.error('Failed to detect browser language:', error);
    return 'en';
  }
};

export const isLanguageSupported = (languageCode, pathname) => {
  return getSupportedLanguages(pathname).some(lang => lang.code === languageCode);
};

export const getDefaultLanguage = () => {
  return 'en';
};

export const formatLanguageDisplay = (languageCode, showFlag = true, showNativeName = true) => {
  const language = getLanguageByCode(languageCode);
  if (!language) return languageCode;
  
  let display = '';
  if (showFlag) display += `${language.flag} `;
  if (showNativeName) {
    display += language.nativeName;
  } else {
    display += language.name;
  }
  
  return display;
};
