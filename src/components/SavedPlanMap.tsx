import { useEffect, useMemo, useState } from 'react';
import type { TripPlan } from '../lib/aiPlanner';
import type { TripLocation } from '../lib/tripLocation';
import { getTripDayColor } from '../lib/tripMapColors';
import { loadTripMapData, type TripMapPoint } from '../lib/tripMapGeocoding';
import { loadTripRoutes, summarizeTripRoutes, type TripDayRoute } from '../lib/tripRouting';
import { TripRouteMap } from './TripRouteMap';
import { useI18n } from '../i18n/I18nProvider';
import { TravelDataWarnings } from './TravelDataWarnings';

const routingText = {
  ru: { distance: 'Пеший путь по дорогам', duration: 'Расчётное время в пути', hour: 'ч', minute: 'мин', progress: (done: number, total: number) => `Построено маршрутов: ${done} из ${total}` },
  en: { distance: 'Walking distance by road', duration: 'Estimated travel time', hour: 'h', minute: 'min', progress: (done: number, total: number) => `Routes built: ${done} of ${total}` },
  kk: { distance: 'Жол бойындағы жаяу қашықтық', duration: 'Болжалды жол уақыты', hour: 'сағ', minute: 'мин', progress: (done: number, total: number) => `Маршруттар құрылды: ${done}/${total}` },
};

function formatRouteDuration(seconds: number, hourLabel: string, minuteLabel: string) {
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.max(1, Math.round((seconds % 3_600) / 60));
  return [hours ? `${hours} ${hourLabel}` : '', `${minutes} ${minuteLabel}`].filter(Boolean).join(' ');
}

export function SavedPlanMap({ plan }: { plan: TripPlan }) {
  const { language, t } = useI18n();
  const routeText = routingText[language];
  const [center, setCenter] = useState<TripLocation | null>(null);
  const [points, setPoints] = useState<TripMapPoint[]>([]);
  const [routes, setRoutes] = useState<TripDayRoute[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [progress, setProgress] = useState({ completed: 0, total: 0, found: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [routingProgress, setRoutingProgress] = useState({ completed: 0, total: 0 });
  const totalActivities = useMemo(() => plan.days.reduce((total, day) => total + day.activities.length, 0), [plan.days]);
  const visibleCount = selectedDay === null ? points.length : points.filter((point) => point.day === selectedDay).length;
  const routeSummary = useMemo(() => summarizeTripRoutes(routes, selectedDay), [routes, selectedDay]);
  const routeDistance = `${(routeSummary.distanceMeters / 1_000).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
  const routeDuration = formatRouteDuration(routeSummary.durationSeconds, routeText.hour, routeText.minute);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setRoutes([]);
    setRoutingProgress({ completed: 0, total: 0 });
    void loadTripMapData(plan, controller.signal, (completed, total, resolvedPoints) => {
      setProgress({ completed, total, found: resolvedPoints.length });
      setPoints(resolvedPoints);
    }).then(async (result) => {
      setCenter(result.center);
      setPoints(result.points);
      const loadedRoutes = await loadTripRoutes(result.points, controller.signal, (completed, total) => {
        setRoutingProgress({ completed, total });
      });
      setRoutes(loadedRoutes);
    })
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
      <TravelDataWarnings warnings={plan.travelDataWarnings?.filter((warning) => warning.section === 'itinerary')} />
      <aside className="saved-map-section__notice" role="note">
        <span aria-hidden="true">i</span>
        <div>
          <strong>{t('route.noticeTitle')}</strong>
          <p>{t('route.noticeText')}</p>
        </div>
      </aside>
      <nav className="saved-map-days" aria-label={t('route.filterAria')}>
        <button type="button" className={selectedDay === null ? 'is-active' : ''} aria-pressed={selectedDay === null} onClick={() => setSelectedDay(null)}><span>{t('route.all')}</span><strong>{t('route.entireTrip')}</strong></button>
        {plan.days.map((day) => <button type="button" key={day.day} className={selectedDay === day.day ? 'is-active' : ''} aria-pressed={selectedDay === day.day} onClick={() => setSelectedDay(day.day)}><span style={{ background: getTripDayColor(day.day) }} /><strong>{t('route.day', { day: day.day })}</strong><small>{day.title}</small></button>)}
      </nav>
      <div className="saved-map-section__stage">
        <TripRouteMap center={center} points={points} routes={routes} selectedDay={selectedDay} />
        {isLoading && <div className="saved-map-section__loading" role="status"><span /><strong>{t('route.mapping')}</strong><small>{routingProgress.total ? routeText.progress(routingProgress.completed, routingProgress.total) : progress.total ? t('route.progress', progress) : t('route.checking')}</small></div>}
      </div>
      {routeSummary.distanceMeters > 0 && <div className="saved-map-section__metrics"><span><small>{routeText.distance}</small><strong>{routeDistance}</strong></span><span><small>{routeText.duration}</small><strong>{routeDuration}</strong></span></div>}
      <div className="saved-map-section__note">
        <span>{visibleCount || '—'}</span>
        <p>{visibleCount ? selectedDay === null ? t('route.visibleAll') : t('route.visibleDay', { day: selectedDay }) : isLoading ? t('route.loadingNote') : t('route.none')}</p>
      </div>
      {!isLoading && points.length < totalActivities && <p className="saved-map-section__omitted">{t('route.omitted', { count: totalActivities - points.length })}</p>}
      <small className="saved-map-section__source">{t('route.sourceStart')} <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap</a> · <a href="https://project-osrm.org/" target="_blank" rel="noreferrer">OSRM</a>. {t('route.sourceEnd')}</small>
    </div>
  );
}
