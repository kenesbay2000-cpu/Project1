import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TripLocation } from '../lib/tripLocation';
import { logTripMapRender } from '../lib/tripMapDiagnostics';
import { getTripDayColor } from '../lib/tripMapColors';
import type { TripMapPoint } from '../lib/tripMapGeocoding';

type Props = {
  center: TripLocation | null;
  points: TripMapPoint[];
  selectedDay: number | null;
};

function popupContent(point: TripMapPoint) {
  const popup = document.createElement('div');
  popup.className = 'saved-map-popup';
  const meta = document.createElement('span');
  meta.textContent = `День ${point.day} · ${point.time}`;
  const title = document.createElement('strong');
  title.textContent = point.title;
  const place = document.createElement('small');
  place.textContent = point.accuracy === 'area' ? `≈ ${point.place} · положение по району` : `⌖ ${point.place}`;
  const description = document.createElement('p');
  description.textContent = point.description;
  popup.append(meta, title, place, description);
  return popup;
}

function groupByDay(points: TripMapPoint[]) {
  const groups = new Map<number, TripMapPoint[]>();
  points.forEach((point) => groups.set(point.day, [...(groups.get(point.day) ?? []), point]));
  groups.forEach((items) => items.sort((a, b) => a.order - b.order));
  return groups;
}

function markerOffset(point: TripMapPoint, points: TripMapPoint[]) {
  const colocated = points.filter((item) => item.latitude === point.latitude && item.longitude === point.longitude);
  if (colocated.length < 2) return { x: 0, y: 0 };
  const angle = (Math.PI * 2 * colocated.findIndex((item) => item.id === point.id)) / colocated.length;
  return { x: Math.cos(angle) * 15, y: Math.sin(angle) * 15 };
}

function createPointIcon(point: TripMapPoint, isFocusedDay: boolean, visiblePoints: TripMapPoint[]) {
  const marker = document.createElement('span');
  marker.className = `saved-route-marker${isFocusedDay ? ' is-focused' : ''}${point.accuracy === 'area' ? ' is-approximate' : ''}`;
  marker.style.setProperty('--marker-color', getTripDayColor(point.day));
  const number = document.createElement('b');
  number.textContent = String(point.order + 1);
  marker.append(number);
  const size = isFocusedDay ? 40 : 34;
  const offset = markerOffset(point, visiblePoints);
  return L.divIcon({
    className: 'saved-route-marker-shell',
    html: marker,
    iconSize: [size, size],
    iconAnchor: [size / 2 - offset.x, size / 2 - offset.y],
    popupAnchor: [0, -(size / 2 + 5)],
  });
}

export function TripRouteMap({ center, points, selectedDay }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!container.current || map.current) return;
    const instance = L.map(container.current, { zoomControl: false, minZoom: 2, maxZoom: 18 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(instance);
    L.control.zoom({ position: 'bottomright' }).addTo(instance);
    layer.current = L.layerGroup().addTo(instance);
    instance.setView([20, 0], 2);
    map.current = instance;
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(container.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; layer.current = null; };
  }, []);

  useEffect(() => {
    if (!map.current || !layer.current) return;
    logTripMapRender(points, selectedDay);
    layer.current.clearLayers();
    const groups = groupByDay(points);
    groups.forEach((dayPoints, day) => {
      const coordinates = dayPoints.map((point) => [point.latitude, point.longitude] as L.LatLngTuple);
      if (coordinates.length > 1) {
        L.polyline(coordinates, {
          color: getTripDayColor(day),
          weight: selectedDay === day ? 6 : selectedDay === null ? 4 : 2,
          opacity: selectedDay === day ? .95 : selectedDay === null ? .72 : .16,
        }).addTo(layer.current as L.LayerGroup);
      }
    });

    const visiblePoints = selectedDay === null ? points : points.filter((point) => point.day === selectedDay);
    visiblePoints.forEach((point) => {
      L.marker([point.latitude, point.longitude], {
        icon: createPointIcon(point, selectedDay === point.day, visiblePoints),
        riseOnHover: true,
        zIndexOffset: 1_000 + point.order,
        title: `${point.time} — ${point.title}`,
        alt: `${point.title}, день ${point.day}`,
      }).bindPopup(popupContent(point), { maxWidth: 290, minWidth: 210, closeButton: true })
        .addTo(layer.current as L.LayerGroup);
    });

    const fitPoints = selectedDay === null ? points : visiblePoints;
    const coordinates = fitPoints.map((point) => [point.latitude, point.longitude] as L.LatLngTuple);
    map.current.stop();
    map.current.invalidateSize({ pan: false });
    if (coordinates.length > 1) map.current.fitBounds(L.latLngBounds(coordinates), { padding: [68, 68], maxZoom: 14, animate: true, duration: .45 });
    else if (coordinates.length === 1) map.current.setView(coordinates[0], 15, { animate: true });
    else if (center) map.current.setView([center.latitude, center.longitude], 11);
  }, [center, points, selectedDay]);

  return <div ref={container} className="saved-route-map" aria-label="Интерактивная карта точек маршрута" tabIndex={0} />;
}
