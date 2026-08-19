import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supportedLanguages, translations, type Language, type TranslationKey } from './translations';

const STORAGE_KEY = 'roamly.language';

type I18nContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey, values?: Record<string, string | number>) => string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

function isLanguage(value: string | null): value is Language {
  return supportedLanguages.some((language) => language === value);
}

function readSavedLanguage(): Language {
  if (typeof window === 'undefined') return 'ru';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(saved) ? saved : 'ru';
  } catch {
    return 'ru';
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(readSavedLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try { window.localStorage.setItem(STORAGE_KEY, language); } catch { /* Storage may be disabled. */ }
  }, [language]);

  const value = useMemo<I18nContextValue>(() => ({
    language,
    setLanguage,
    t: (key, values) => {
      const template = translations[language][key] ?? translations.ru[key];
      return values ? template.replace(/\{(\w+)\}/g, (match, name: string) => values[name] === undefined ? match : String(values[name])) : template;
    },
  }), [language]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside I18nProvider');
  return context;
}
