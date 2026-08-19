import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { Destination } from '../lib/destinations';
import { useI18n } from '../i18n/I18nProvider';

type Props = {
  destinations: Destination[];
  selectedSlug: string | null;
  onSelect: (destination: Destination) => void;
};

const worldBounds = L.latLngBounds([[-38, -18], [56, 154]]);

function createMarker(destination: Destination, isSelected: boolean) {
  return L.divIcon({
    className: 'roamly-marker-shell',
    html: `<span class="roamly-marker${isSelected ? ' is-selected' : ''}"><i></i><b>${destination.city}</b></span>`,
    iconSize: [112, 36], iconAnchor: [18, 18],
  });
}

export function DestinationsMap({ destinations, selectedSlug, onSelect }: Props) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, { zoomControl: false, minZoom: 2, maxZoom: 11, worldCopyJump: true, zoomSnap: .5 });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    map.fitBounds(worldBounds, { padding: [28, 28], animate: false });
    destinations.forEach((destination) => {
      const marker = L.marker(destination.coordinates, { icon: createMarker(destination, false), riseOnHover: true })
        .addTo(map).on('click', () => onSelect(destination));
      markersRef.current.set(destination.slug, marker);
    });
    mapRef.current = map;
    const resizeObserver = new ResizeObserver(() => map.invalidateSize());
    resizeObserver.observe(containerRef.current);
    return () => { resizeObserver.disconnect(); map.remove(); mapRef.current = null; markersRef.current.clear(); };
  }, [destinations, onSelect]);

  useEffect(() => {
    destinations.forEach((destination) => markersRef.current.get(destination.slug)?.setIcon(createMarker(destination, destination.slug === selectedSlug)));
    if (!selectedSlug) return;
    const selected = destinations.find((item) => item.slug === selectedSlug);
    if (selected) mapRef.current?.flyTo(selected.coordinates, Math.max(mapRef.current.getZoom(), 5), { duration: 1.1 });
  }, [destinations, selectedSlug]);

  return <div className="world-map" ref={containerRef} aria-label={t('map.aria')} />;
}
