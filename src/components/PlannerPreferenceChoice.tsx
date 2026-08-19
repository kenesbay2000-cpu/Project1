type Props = {
  preferences: string[];
  usePreferences: boolean;
  onChange: (value: boolean) => void;
};

export function PlannerPreferenceChoice({ preferences, usePreferences, onChange }: Props) {
  const { t } = useI18n();
  return (
    <section className="planner-form__section planner-form__section--memory" aria-labelledby="planner-memory-title">
      <header><span aria-hidden="true">◇</span><div><small>{t('memory.eyebrow')}</small><h2 id="planner-memory-title">{t('memory.title')}</h2></div></header>
      <div className="planner-memory__preferences">
        {preferences.map((preference) => <span key={preference}>{preference}</span>)}
      </div>
      <div className="planner-memory__choice" role="radiogroup" aria-label={t('memory.aria')}>
        <button type="button" role="radio" aria-checked={usePreferences} className={usePreferences ? 'is-active' : ''} onClick={() => onChange(true)}><i aria-hidden="true">✓</i><span><strong>{t('memory.yes')}</strong><small>{t('memory.yesHint')}</small></span></button>
        <button type="button" role="radio" aria-checked={!usePreferences} className={!usePreferences ? 'is-active' : ''} onClick={() => onChange(false)}><i aria-hidden="true">○</i><span><strong>{t('memory.no')}</strong><small>{t('memory.noHint')}</small></span></button>
      </div>
      <p className="planner-memory__note">{t('memory.note')}</p>
    </section>
  );
}
import { useI18n } from '../i18n/I18nProvider';
