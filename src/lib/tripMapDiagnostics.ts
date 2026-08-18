import type { TripMapPoint } from './tripMapGeocoding';

export type TripMapDiagnosticItem = {
  query: string;
  stage: 'stored' | 'exact' | 'area';
  status: 'stored' | 'cached' | 'success' | 'empty' | 'error';
  coordinates?: { latitude: number; longitude: number };
  error?: string;
};

export type TripMapDiagnosticSummary = {
  activities: number;
  stored: number;
  cached: number;
  requested: number;
  successful: number;
  empty: number;
  errors: number;
  renderablePoints: number;
  approximatePoints: number;
};

export function isTripMapDebugEnabled() {
  try {
    return import.meta.env.DEV || window.localStorage.getItem('roamly.trip-map-debug') === '1'
      || new URLSearchParams(window.location.search).get('mapDebug') === '1';
  } catch {
    return import.meta.env.DEV;
  }
}

export function logTripMapCandidates(candidates: Array<{ day: number; time: string; place: string; query: string }>) {
  if (!isTripMapDebugEnabled()) return;
  console.groupCollapsed(`[TripMap] Исходные активности: ${candidates.length}`);
  console.table(candidates);
  console.groupEnd();
}

export function logTripMapItem(item: TripMapDiagnosticItem) {
  if (!isTripMapDebugEnabled()) return;
  const details = item.coordinates ? JSON.stringify(item.coordinates) : item.error ?? 'Координаты не найдены';
  console.info(`[TripMap] ${item.status}: ${item.query}`, details);
}

export function logTripMapSummary(summary: TripMapDiagnosticSummary, items: TripMapDiagnosticItem[]) {
  console.info('[TripMap] Итог геокодинга', JSON.stringify(summary));
  if (!isTripMapDebugEnabled()) return;
  console.table(items.map((item) => ({
    stage: item.stage, status: item.status, query: item.query,
    latitude: item.coordinates?.latitude ?? '', longitude: item.coordinates?.longitude ?? '',
    error: item.error ?? '',
  })));
}

export function logTripMapRender(points: TripMapPoint[], selectedDay: number | null) {
  if (!isTripMapDebugEnabled()) return;
  const visible = selectedDay === null ? points : points.filter((point) => point.day === selectedDay);
  console.info('[TripMap] Вход компонента маркеров', JSON.stringify({
    receivedPoints: points.length,
    selectedDay: selectedDay ?? 'all',
    visibleMarkers: visible.length,
    points: visible.map((point) => ({ id: point.id, day: point.day, accuracy: point.accuracy, latitude: point.latitude, longitude: point.longitude })),
  }));
}
