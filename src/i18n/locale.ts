import type { Language } from './translations';

const locales: Record<Language, string> = {
  ru: 'ru-RU',
  en: 'en-US',
  kk: 'kk-KZ',
};

export function languageLocale(language: Language) {
  return locales[language];
}
