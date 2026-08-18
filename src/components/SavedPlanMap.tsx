import { useEffect, useState } from 'react';
import type { TripPlan } from '../lib/aiPlanner';
import type { TripLocation } from '../lib/tripLocation';
import { loadTripMapData, type TripMapPoint } from '../lib/tripMapGeocoding';
import { TripRouteMap } from './TripRouteMap';

export function SavedPlanMap({ plan }: { plan: TripPlan }) {
  const [center, setCenter] = useState<TripLocation | null>(null);
  const [points, setPoints] = useState<TripMapPoint[]>([]);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    void loadTripMapData(plan, controller.signal, (completed, total) => setProgress({ completed, total }))
      .then((result) => { setCenter(result.center); setPoints(result.points); })
      .catch((error: unknown) => { if (!(error instanceof DOMException && error.name === 'AbortError')) setPoints([]); })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [plan]);

  return (
    <div className="saved-map-section">
      <div className="saved-map-section__stage">
        <TripRouteMap center={center} points={points} />
        {isLoading && <div className="saved-map-section__loading" role="status"><span /><strong>Наносим маршрут на карту</strong><small>{progress.total ? `${progress.completed} из ${progress.total} точек` : 'Ищем места поездки…'}</small></div>}
      </div>
      <div className="saved-map-section__note">
        <span>{points.length || '—'}</span>
        <p>{points.length ? 'точек маршрута удалось сопоставить с картой. Пунктир показывает порядок посещения, а не точный путь по дорогам.' : isLoading ? 'Карта заполняется найденными точками.' : 'Точные координаты мест не найдены — карта центрирована на направлении поездки.'}</p>
      </div>
      <small className="saved-map-section__source">Карта и поиск мест: <a href="https://www.openstreetmap.org/" target="_blank" rel="noreferrer">OpenStreetMap</a>. Для скорости сохраняем найденные координаты в этом браузере.</small>
    </div>
  );
}
