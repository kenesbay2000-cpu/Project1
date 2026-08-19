import { useCallback, useMemo, useState } from 'react';
import { DestinationsMap } from '../components/DestinationsMap';
import { MapDestinationPreview } from '../components/MapDestinationPreview';
import type { Destination } from '../lib/destinations';
import { getDestinations } from '../lib/content';
import './MapPage.css';
import { useI18n } from '../i18n/I18nProvider';

export function MapPage() {
  const { t, language } = useI18n();
  const destinations = useMemo(() => getDestinations(language), [language]);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const selected = destinations.find((item) => item.slug === selectedSlug) ?? null;
  const selectDestination = useCallback((destination: Destination) => setSelectedSlug(destination.slug), []);

  return (
    <main className="map-page">
      <header className="map-page__intro">
        <div><p className="section-label">{t('map.eyebrow')}</p><h1>{t('map.title')}<br /><em>{t('map.titleAccent')}</em></h1></div>
        <div className="map-page__aside"><strong>{destinations.length}</strong><p>{t('map.countText')}</p></div>
      </header>
      <section className="map-stage">
        <div className="map-stage__label"><span /> {t('map.hint')}</div>
        <DestinationsMap destinations={destinations} selectedSlug={selectedSlug} onSelect={selectDestination} />
        {selected && <MapDestinationPreview destination={selected} onClose={() => setSelectedSlug(null)} />}
      </section>
    </main>
  );
}
