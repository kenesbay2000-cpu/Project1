import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { TripLocation } from '../lib/tripLocation';
import type { TripMapPoint } from '../lib/tripMapGeocoding';

type Props = { center: TripLocation | null; points: TripMapPoint[] };

export function TripRouteMap({ center, points }: Props) {
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
    layer.current.clearLayers();
    const coordinates = points.map((point) => [point.latitude, point.longitude] as L.LatLngTuple);
    points.forEach((point, index) => {
      const marker = L.circleMarker([point.latitude, point.longitude], {
        radius: 10, color: '#fff', weight: 3, fillColor: '#c75f3d', fillOpacity: 1,
      }).addTo(layer.current as L.LayerGroup);
      const tooltip = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = `${index + 1}. ${point.label}`;
      const context = document.createElement('span');
      context.textContent = point.context;
      tooltip.append(title, context);
      marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -8] });
    });
    if (coordinates.length > 1) L.polyline(coordinates, { color: '#b85337', weight: 3, opacity: .65, dashArray: '7 8' }).addTo(layer.current);
    if (coordinates.length) map.current.fitBounds(L.latLngBounds(coordinates), { padding: [44, 44], maxZoom: 14 });
    else if (center) map.current.setView([center.latitude, center.longitude], 11);
  }, [center, points]);

  return <div ref={container} className="saved-route-map" aria-label="Интерактивная карта точек маршрута" tabIndex={0} />;
}
