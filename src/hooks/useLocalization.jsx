import { useContext, createContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { isRTL, getTextDirection, forceRTLScrollbar, cleanupRTLStyling, debugRTLState } from '../utils/rtl';
import { saveLanguagePreference, getLanguagePreference, detectUserLanguage } from '../utils/languageUtils';

const LocalizationContext = createContext();
const normalizeLanguageCode = (lng) => String(lng || 'en').toLowerCase().split('-')[0];

export const LocalizationProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const initialLanguage = normalizeLanguageCode(
    i18n?.resolvedLanguage || i18n?.language || getLanguagePreference(),
  );

  const [currentLanguage, setCurrentLanguage] = useState(initialLanguage);
  const [isRTLMode, setIsRTLMode] = useState(isRTL(initialLanguage));

  useEffect(() => {
    const savedLang = normalizeLanguageCode(getLanguagePreference());
    if (savedLang && savedLang !== i18n?.resolvedLanguage) {
      void changeLanguage(savedLang);
    }
  }, []);

  useEffect(() => {
    const onLanguageChanged = (lng) => {
      const normalized = normalizeLanguageCode(lng);
      setCurrentLanguage(normalized);
      setIsRTLMode(isRTL(normalized));
    };
    if (i18n?.on) i18n.on('languageChanged', onLanguageChanged);
    return () => {
      if (i18n?.off) i18n.off('languageChanged', onLanguageChanged);
    };
  }, [i18n]);

  async function changeLanguage(languageCode) {
    const normalized = normalizeLanguageCode(languageCode);
    try {
      await i18n.changeLanguage(normalized);
      setCurrentLanguage(normalized);
      
      const newRTLMode = isRTL(normalized);
      setIsRTLMode(newRTLMode);
      saveLanguagePreference(normalized);
      
      console.log('Language changed to:', normalized, 'RTL mode:', newRTLMode);
      
      // Update document attributes safely
      if (typeof document !== 'undefined') {
        document.documentElement.lang = normalized;
        document.documentElement.dir = getTextDirection(normalized);
        
        // First, clean up any existing RTL/LTR classes to ensure clean state
        console.log('Cleaning up existing RTL/LTR classes...');
        cleanupRTLStyling();
        
        // Use specific class names to avoid conflicts
        if (newRTLMode) {
          document.body.classList.add('rtl-layout');
          // Only apply RTL scrollbar when needed
          forceRTLScrollbar();
          console.log('RTL layout and scrollbar applied');
        } else {
          document.body.classList.add('ltr-layout');
          console.log('LTR layout applied - all RTL styling cleaned up');
        }
        
        // Debug: Check final state
        console.log('Final RTL state after language change:');
        debugRTLState();
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }

  const toggleLanguage = () => {
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