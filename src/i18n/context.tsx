import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { SupportedLanguage, LanguageMeta, Translations } from './types';
import { en } from './locales/en';
import { fil } from './locales/fil';
import { id } from './locales/id';
import { ms } from './locales/ms';

export const AVAILABLE_LANGUAGES: LanguageMeta[] = [
  {
    code: 'en',
    name: 'English (US)',
    nativeName: 'English',
    flag: '🇺🇸',
    region: 'North America / Global',
    recommendedCurrency: 'USD',
    sampleGreeting: 'Welcome to Nexus MLBB Marketplace',
  },
  {
    code: 'fil',
    name: 'Filipino (Tagalog)',
    nativeName: 'Wikang Filipino',
    flag: '🇵🇭',
    region: 'Philippines (GCash & Maya)',
    recommendedCurrency: 'PHP',
    sampleGreeting: 'Maligayang pagdating sa Nexus Marketplace',
  },
  {
    code: 'id',
    name: 'Indonesian',
    nativeName: 'Bahasa Indonesia',
    flag: '🇮🇩',
    region: 'Indonesia (GoPay, OVO & DANA)',
    recommendedCurrency: 'IDR',
    sampleGreeting: 'Selamat datang di Nexus MLBB Marketplace',
  },
  {
    code: 'ms',
    name: 'Malay',
    nativeName: 'Bahasa Melayu',
    flag: '🇲🇾',
    region: 'Malaysia / Singapore (Touch n Go)',
    recommendedCurrency: 'MYR',
    sampleGreeting: 'Selamat datang ke Pasaran Nexus MLBB',
  },
];

const TRANSLATION_MAP: Record<SupportedLanguage, Translations> = {
  en,
  fil,
  id,
  ms,
};

interface I18nContextValue {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  translations: Translations;
  currentLanguageMeta: LanguageMeta;
  availableLanguages: LanguageMeta[];
}

const I18nContext = createContext<I18nContextValue | null>(null);

interface I18nProviderProps {
  children: React.ReactNode;
  initialLanguage?: SupportedLanguage;
  currentLanguage?: SupportedLanguage;
  onLanguageChange?: (lang: SupportedLanguage) => void;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({
  children,
  initialLanguage = 'en',
  currentLanguage,
  onLanguageChange,
}) => {
  const [internalLang, setInternalLang] = useState<SupportedLanguage>(() => {
    if (currentLanguage) return currentLanguage;
    try {
      const savedSettings = localStorage.getItem('nexus_app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.language && (parsed.language in TRANSLATION_MAP)) {
          return parsed.language;
        }
      }
      const savedLang = localStorage.getItem('nexus_language');
      if (savedLang && (savedLang in TRANSLATION_MAP)) {
        return savedLang as SupportedLanguage;
      }
    } catch {}
    return initialLanguage;
  });

  // Sync if externally controlled
  useEffect(() => {
    if (currentLanguage && currentLanguage !== internalLang) {
      setInternalLang(currentLanguage);
    }
  }, [currentLanguage]);

  const handleSetLanguage = useCallback((newLang: SupportedLanguage) => {
    setInternalLang(newLang);
    try {
      localStorage.setItem('nexus_language', newLang);
      // Also update nexus_app_settings in localStorage if present
      const savedSettings = localStorage.getItem('nexus_app_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        parsed.language = newLang;
        localStorage.setItem('nexus_app_settings', JSON.stringify(parsed));
      }
    } catch {}
    if (onLanguageChange) {
      onLanguageChange(newLang);
    }
  }, [onLanguageChange]);

  const activeLang = currentLanguage || internalLang;
  const translations = TRANSLATION_MAP[activeLang] || en;
  const currentLanguageMeta = AVAILABLE_LANGUAGES.find((l) => l.code === activeLang) || AVAILABLE_LANGUAGES[0];

  // Helper function to resolve dot-notation paths like 'settings.tabs.general'
  const t = useCallback((path: string, params?: Record<string, string | number>): string => {
    if (!path || typeof path !== 'string') {
      return typeof path === 'number' ? String(path) : '';
    }
    const keys = path.split('.');
    let current: any = translations;
    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        // Fallback to English dictionary
        let fallbackCurrent: any = en;
        for (const fbKey of keys) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbKey in fallbackCurrent) {
            fallbackCurrent = fallbackCurrent[fbKey];
          } else {
            return path; // Return raw key if not found
          }
        }
        current = fallbackCurrent;
        break;
      }
    }

    if (typeof current !== 'string') {
      return path;
    }

    let result = current;
    if (params && typeof params === 'object') {
      Object.entries(params).forEach(([k, v]) => {
        try {
          const safeKey = String(k).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          result = result.replace(new RegExp(`{{${safeKey}}}`, 'g'), String(v ?? ''));
        } catch {
          result = result.split(`{{${k}}}`).join(String(v ?? ''));
        }
      });
    }

    return result;
  }, [translations]);

  const value = useMemo<I18nContextValue>(() => ({
    language: activeLang,
    setLanguage: handleSetLanguage,
    t,
    translations,
    currentLanguageMeta,
    availableLanguages: AVAILABLE_LANGUAGES,
  }), [activeLang, handleSetLanguage, t, translations, currentLanguageMeta]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = (): I18nContextValue => {
  const context = useContext(I18nContext);
  if (!context) {
    // Provide a fallback dummy context so components still function if rendered outside provider
    return {
      language: 'en',
      setLanguage: () => {},
      t: (path: string) => path,
      translations: en,
      currentLanguageMeta: AVAILABLE_LANGUAGES[0],
      availableLanguages: AVAILABLE_LANGUAGES,
    };
  }
  return context;
};
