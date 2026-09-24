import { isRTL } from './rtl.js';

/**
 * Flip to `true` to re-enable Arabic UI + language switchers.
 * Arabic locale files and i18n resources stay loaded either way — do not delete them.
 */
export const ARABIC_LANGUAGE_ENABLED = false;

/** Full catalog (kept for when Arabic is re-enabled). */
export const ALL_SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

/** Languages offered in the UI right now. */
export const SUPPORTED_LANGUAGES = ARABIC_LANGUAGE_ENABLED
  ? ALL_SUPPORTED_LANGUAGES
  : ALL_SUPPORTED_LANGUAGES.filter((lang) => lang.code === 'en');

export const getLanguageByCode = (code) => {
  return ALL_SUPPORTED_LANGUAGES.find(lang => lang.code === code) || ALL_SUPPORTED_LANGUAGES[0];
};

export const getLanguageName = (code, currentLanguage = 'en') => {
  const language = getLanguageByCode(code);
  return currentLanguage === 'ar' ? language.nativeName : language.name;
};

export const saveLanguagePreference = (languageCode) => {
  try {
    const code = !ARABIC_LANGUAGE_ENABLED && languageCode === 'ar' ? 'en' : languageCode;
    localStorage.setItem('preferred-language', code);
    document.documentElement.lang = code;
    document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
  } catch (error) {
    console.error('Failed to save language preference:', error);
  }
};

export const getLanguagePreference = () => {
  try {
    const saved = localStorage.getItem('preferred-language') || 'en';
    if (!ARABIC_LANGUAGE_ENABLED && String(saved).toLowerCase().startsWith('ar')) {
      return 'en';
    }
    return saved;
  } catch (error) {
    console.error('Failed to get language preference:', error);
    return 'en';
  }
};

export const detectUserLanguage = () => {
  if (!ARABIC_LANGUAGE_ENABLED) return 'en';

  const saved = getLanguagePreference();
  if (saved) return saved;
  
  try {
    const browserLang = navigator.language.split('-')[0];
    return ALL_SUPPORTED_LANGUAGES.find(lang => lang.code === browserLang) ? browserLang : 'en';
  } catch (error) {
    console.error('Failed to detect browser language:', error);
    return 'en';
  }
};

export const isLanguageSupported = (languageCode) => {
  return SUPPORTED_LANGUAGES.some(lang => lang.code === languageCode);
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
