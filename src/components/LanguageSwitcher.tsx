import { useI18n } from '../i18n/I18nProvider';
import { languageOptions, type Language } from '../i18n/translations';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <label className="language-switcher">
      <span aria-hidden="true">◎</span>
      <span className="language-switcher__label">{t('language.switcherLabel')}</span>
      <select value={language} onChange={(event) => setLanguage(event.target.value as Language)} aria-label={t('language.switcherLabel')}>
        {languageOptions.map((option) => <option value={option.value} key={option.value}>{option.shortLabel} · {option.label}</option>)}
      </select>
    </label>
  );
}
