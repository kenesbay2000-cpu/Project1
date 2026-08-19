import type { TripPlan } from '../lib/aiPlanner';
import './TripRealismNotice.css';
import { useI18n } from '../i18n/I18nProvider';

type TripRealismNoticeProps = {
  assessment?: TripPlan['realism'];
};

export function TripRealismNotice({ assessment }: TripRealismNoticeProps) {
  const { t } = useI18n();
  if (!assessment) return null;
  if (assessment.status === 'realistic') {
    return <div className="trip-realism trip-realism--ok" role="status"><span>✓</span><p><strong>{t('realism.okTitle')}</strong>{t('realism.okText')}</p></div>;
  }
  return (
    <aside className="trip-realism trip-realism--adjusted" role="status">
      <span>!</span>
      <div>
        <p>{t('realism.adjusted')}</p>
        <h2>{t('realism.adjustedTitle')}</h2>
        <div>{assessment.warning}</div>
        <ul>{assessment.adjustments.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </aside>
  );
}
