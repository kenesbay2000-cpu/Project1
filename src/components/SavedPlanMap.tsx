import { useEffect, useMemo, useState } from 'react';
import type { TripPlan } from '../lib/aiPlanner';
import type { TripLocation } from '../lib/tripLocation';
import { getTripDayColor } from '../lib/tripMapColors';
import { loadTripMapData, type TripMapPoint } from '../lib/tripMapGeocoding';
import { TripRouteMap } from './TripRouteMap';

export function SavedPlanMap({ plan }: { plan: TripPlan }) {
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
      <nav className="saved-map-days" aria-label="Фильтр маршрута по дням">
        <button type="button" className={selectedDay === null ? 'is-active' : ''} aria-pressed={selectedDay === null} onClick={() => setSelectedDay(null)}><span>Все</span><strong>Вся поездка</strong></button>
        {plan.days.map((day) => <button type="button" key={day.day} className={selectedDay === day.day ? 'is-active' : ''} aria-pressed={selectedDay === day.day} onClick={() => setSelectedDay(day.day)}><span style={{ background: getTripDayColor(day.day) }} /><strong>День {day.day}</strong><small>{day.title}</small></button>)}
      </nav>
      <div className="saved-map-section__stage">
        <TripRouteMap center={center} points={points} selectedDay={selectedDay} />
        {isLoading && <div className="saved-map-section__loading" role="status"><span /><strong>Наносим маршрут на карту</strong><small>{progress.total ? `${progress.completed} из ${progress.total} мест проверено · найдено ${progress.found}` : 'Проверяем координаты…'}</small></div>}
      </div>
      <div className="saved-map-section__note">
        <span>{visibleCount || '—'}</span>
        <p>{visibleCount ? `${selectedDay === null ? 'Точек всей поездки' : `Точек дня ${selectedDay}`} показано на карте. Линии соединяют активности в порядке сохранённого расписания.` : isLoading ? 'Карта заполняется только подтверждёнными точками.' : 'Для выбранного дня точные координаты не найдены — сомнительные маркеры не показываются.'}</p>
      </div>
      {!isLoading && points.length < totalActivities && <p className="saved-map-section__omitted">Не отмечено точек: {totalActivities - points.length}. Для них не удалось уверенно определить координаты.</p>}
      <small className="saved-map-section__source">Карта и поиск мест: <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap</a>. Для скорости сохраняем найденные координаты в этом браузере.</small>
    </div>
  );
}
