import { catalogTranslations } from './catalogTranslations';
import { homeTranslations } from './homeTranslations';
import { plannerTranslations } from './plannerTranslations';
import { plansTranslations } from './plansTranslations';
import { accountTranslations } from './accountTranslations';
import { commonTranslations } from './commonTranslations';

export const supportedLanguages = ['ru', 'en'] as const;
export type Language = typeof supportedLanguages[number];

const coreRu = {
  'language.name': 'Русский',
  'language.switcherLabel': 'Язык сайта',
  'header.home': 'Главная',
  'header.planner': 'AI Planner',
  'header.blog': 'Блог',
  'header.profile': 'Профиль',
  'header.myPlans': 'Мои планы',
  'header.login': 'Войти',
  'header.signup': 'Регистрация',
  'header.startPlanning': 'Начать планировать',
  'header.mainNavigation': 'Основная навигация',
  'header.authLoading': 'Проверяем авторизацию',
  'header.brandHome': 'Roamly — на главную',
  'planner.eyebrow': 'Roamly · AI Planner',
  'planner.title': 'Расскажите о поездке.',
  'planner.titleAccent': 'Мы соберём остальное.',
  'planner.intro': 'Пишите свободно, как близкому человеку. AI превратит ваши идеи в реалистичный маршрут и уточнит только действительно важное.',
  'planner.sessionLoading': 'Проверяем сессию…',
} as const;

const ru = {
  ...coreRu,
  ...homeTranslations.ru,
  ...catalogTranslations.ru,
  ...plannerTranslations.ru,
  ...plansTranslations.ru,
  ...accountTranslations.ru,
  ...commonTranslations.ru,
} as const;

export type TranslationKey = keyof typeof ru;

const coreEn = {
  'language.name': 'English',
  'language.switcherLabel': 'Site language',
  'header.home': 'Home',
  'header.planner': 'AI Planner',
  'header.blog': 'Journal',
  'header.profile': 'Profile',
  'header.myPlans': 'My trips',
  'header.login': 'Sign in',
  'header.signup': 'Create account',
  'header.startPlanning': 'Start planning',
  'header.mainNavigation': 'Main navigation',
  'header.authLoading': 'Checking authentication',
  'header.brandHome': 'Roamly — home',
  'planner.eyebrow': 'Roamly · AI Planner',
  'planner.title': 'Tell us about your trip.',
  'planner.titleAccent': 'We’ll take care of the rest.',
  'planner.intro': 'Write naturally, as if you were talking to someone who knows you well. AI will turn your ideas into a realistic itinerary and ask only what truly matters.',
  'planner.sessionLoading': 'Checking your session…',
} satisfies Record<keyof typeof coreRu, string>;

const en: Record<TranslationKey, string> = {
  ...coreEn,
  ...homeTranslations.en,
  ...catalogTranslations.en,
  ...plannerTranslations.en,
  ...plansTranslations.en,
  ...accountTranslations.en,
  ...commonTranslations.en,
};

export const translations: Record<Language, Record<TranslationKey, string>> = { ru, en };

export const languageOptions: Array<{ value: Language; shortLabel: string; label: string }> = [
  { value: 'ru', shortLabel: 'RU', label: ru['language.name'] },
  { value: 'en', shortLabel: 'EN', label: en['language.name'] },
];
