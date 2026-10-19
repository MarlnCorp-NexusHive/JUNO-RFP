import { useContext, createContext, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { isRTL, getTextDirection, forceRTLScrollbar, cleanupRTLStyling, debugRTLState } from '../utils/rtl';
import {
  ARABIC_LANGUAGE_ENABLED,
  isArabicUiEnabled,
  getSupportedLanguages,
  saveLanguagePreference,
  getLanguagePreference,
} from '../utils/languageUtils';

const LocalizationContext = createContext();
const normalizeLanguageCode = (lng) => String(lng || 'en').toLowerCase().split('-')[0];

export const LocalizationProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const location = useLocation();
  const arabicEnabled = isArabicUiEnabled(location.pathname);

  const initialLanguage = normalizeLanguageCode(
    arabicEnabled
      ? (i18n?.resolvedLanguage || i18n?.language || getLanguagePreference(location.pathname))
      : 'en',
  );

  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [isRTLMode, setIsRTLMode] = useState(isRTL(initialLanguage));

  const changeLanguage = useCallback(async (languageCode) => {
    let normalized = normalizeLanguageCode(languageCode);
    if (!isArabicUiEnabled(window.location?.pathname) && normalized === 'ar') {
      normalized = 'en';
    }
    try {
      await i18n.changeLanguage(normalized);
      setCurrentLanguage(normalized);
      
      const newRTLMode = isRTL(normalized);
      setIsRTLMode(newRTLMode);
      saveLanguagePreference(normalized, window.location?.pathname);
      
      if (typeof document !== 'undefined') {
        document.documentElement.lang = normalized;
        document.documentElement.dir = getTextDirection(normalized);
        
        cleanupRTLStyling();
        
        if (newRTLMode) {
          document.body.classList.add('rtl-layout');
          forceRTLScrollbar();
        } else {
          document.body.classList.add('ltr-layout');
        }
        
        debugRTLState();
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [i18n]);

  // Apply / revoke Arabic when route or login session context changes.
  useEffect(() => {
    const allowed = isArabicUiEnabled(location.pathname);
    if (!allowed) {
      if (normalizeLanguageCode(i18n?.language) !== 'en') {
        void changeLanguage('en');
      } else {
        saveLanguagePreference('en', location.pathname);
        if (typeof document !== 'undefined') {
          document.documentElement.lang = 'en';
          document.documentElement.dir = 'ltr';
          cleanupRTLStyling();
          document.body.classList.add('ltr-layout');
        }
      }
      return;
    }

    const savedLang = normalizeLanguageCode(getLanguagePreference(location.pathname));
    if (savedLang && savedLang !== normalizeLanguageCode(i18n?.resolvedLanguage || i18n?.language)) {
      void changeLanguage(savedLang);
    }
  }, [location.pathname, changeLanguage, i18n]);

  useEffect(() => {
    const onLanguageChanged = (lng) => {
      const normalized = normalizeLanguageCode(lng);
      if (!isArabicUiEnabled(window.location?.pathname) && normalized === 'ar') {
        void changeLanguage('en');
        return;
      }
      setCurrentLanguage(normalized);
      setIsRTLMode(isRTL(normalized));
    };
    if (i18n?.on) i18n.on('languageChanged', onLanguageChanged);
    return () => {
      if (i18n?.off) i18n.off('languageChanged', onLanguageChanged);
    };
  }, [i18n, changeLanguage]);

  // Re-evaluate after login/logout writes rbac_current_user.
  useEffect(() => {
    const onStorage = (event) => {
      if (event.key && event.key !== 'rbac_current_user' && event.key !== 'preferred-language') {
        return;
      }
      const allowed = isArabicUiEnabled(window.location?.pathname);
      if (!allowed && normalizeLanguageCode(i18n?.language) === 'ar') {
        void changeLanguage('en');
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [changeLanguage, i18n]);

  const toggleLanguage = () => {
    if (!isArabicUiEnabled(window.location?.pathname)) return;
    const current = normalizeLanguageCode(currentLanguage);
    const newLanguage = current === 'ar' ? 'en' : 'ar';
    void changeLanguage(newLanguage);
  };

  const value = {
    currentLanguage,
    isRTLMode,
    changeLanguage,
    toggleLanguage,
    textDirection: getTextDirection(currentLanguage),
    arabicEnabled,
    featureArabicEnabled: ARABIC_LANGUAGE_ENABLED,
    supportedLanguages: getSupportedLanguages(location.pathname),
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
};

export const useLocalization = () => {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error('useLocalization must be used within a LocalizationProvider');
  }
  return context;
};
