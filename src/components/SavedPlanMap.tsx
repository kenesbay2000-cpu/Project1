import { useEffect, useMemo, useState } from 'react';
import type { TripPlan } from '../lib/aiPlanner';
import type { TripLocation } from '../lib/tripLocation';
import { getTripDayColor } from '../lib/tripMapColors';
import { loadTripMapData, type TripMapPoint } from '../lib/tripMapGeocoding';
import { TripRouteMap } from './TripRouteMap';
import { useI18n } from '../i18n/I18nProvider';

export function SavedPlanMap({ plan }: { plan: TripPlan }) {
  const { t } = useI18n();
  const [center, setCenter] = useState<TripLocation | null>(null);
  const [points, setPoints] = useState<TripMapPoint[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0, found: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const totalActivities = useMemo(() => plan.days.reduce((total, day) => total + day.activities.length, 0), [plan.days]);
  const visibleCount = selectedDay === null ? points.length : points.filter((point) => point.day === selectedDay).length;

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    void loadTripMapData(plan, controller.signal, (completed, total, resolvedPoints) => {
      setProgress({ completed, total, found: resolvedPoints.length });
      setPoints(resolvedPoints);
    }).then((result) => { setCenter(result.center); setPoints(result.points); })
      .catch((error: unknown) => {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          console.error('[TripMap] Не удалось завершить подготовку карты; уже найденные точки сохранены.', error);
        }
      })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [plan]);

  return (
    <div className="saved-map-section">
      <nav className="saved-map-days" aria-label={t('route.filterAria')}>
        <button type="button" className={selectedDay === null ? 'is-active' : ''} aria-pressed={selectedDay === null} onClick={() => setSelectedDay(null)}><span>{t('route.all')}</span><strong>{t('route.entireTrip')}</strong></button>
        {plan.days.map((day) => <button type="button" key={day.day} className={selectedDay === day.day ? 'is-active' : ''} aria-pressed={selectedDay === day.day} onClick={() => setSelectedDay(day.day)}><span style={{ background: getTripDayColor(day.day) }} /><strong>{t('route.day', { day: day.day })}</strong><small>{day.title}</small></button>)}
      </nav>
      <div className="saved-map-section__stage">
        <TripRouteMap center={center} points={points} selectedDay={selectedDay} />
        {isLoading && <div className="saved-map-section__loading" role="status"><span /><strong>{t('route.mapping')}</strong><small>{progress.total ? t('route.progress', progress) : t('route.checking')}</small></div>}
      </div>
      <div className="saved-map-section__note">
        <span>{visibleCount || '—'}</span>
        <p>{visibleCount ? selectedDay === null ? t('route.visibleAll') : t('route.visibleDay', { day: selectedDay }) : isLoading ? t('route.loadingNote') : t('route.none')}</p>
      </div>
      {!isLoading && points.length < totalActivities && <p className="saved-map-section__omitted">{t('route.omitted', { count: totalActivities - points.length })}</p>}
      <small className="saved-map-section__source">{t('route.sourceStart')} <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap</a>. {t('route.sourceEnd')}</small>
    </div>
  );
}
