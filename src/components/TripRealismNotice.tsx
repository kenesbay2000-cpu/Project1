import type { TripPlan } from '../lib/aiPlanner';
import './TripRealismNotice.css';

type TripRealismNoticeProps = {
  assessment?: TripPlan['realism'];
};

export function TripRealismNotice({ assessment }: TripRealismNoticeProps) {
  if (!assessment) return null;
  if (assessment.status === 'realistic') {
    return <div className="trip-realism trip-realism--ok" role="status"><span>✓</span><p><strong>Маршрут проверен на реалистичность</strong>Даты, нагрузка и время на переезды согласованы.</p></div>;
  }
  return (
    <aside className="trip-realism trip-realism--adjusted" role="status">
      <span>!</span>
      <div>
        <p>Маршрут скорректирован</p>
        <h2>Так поездка останется выполнимой</h2>
        <div>{assessment.warning}</div>
        <ul>{assessment.adjustments.map((item) => <li key={item}>{item}</li>)}</ul>
      </div>
    </aside>
  );
}
