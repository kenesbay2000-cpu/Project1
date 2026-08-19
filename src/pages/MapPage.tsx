import { useCallback, useState } from 'react';
import { DestinationsMap } from '../components/DestinationsMap';
import { MapDestinationPreview } from '../components/MapDestinationPreview';
import { destinations, type Destination } from '../lib/destinations';
import './MapPage.css';
import { useI18n } from '../i18n/I18nProvider';

export function MapPage() {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Destination | null>(null);
  const selectDestination = useCallback((destination: Destination) => setSelected(destination), []);

  return (
    <main className="map-page">
      <header className="map-page__intro">
        <div><p className="section-label">{t('map.eyebrow')}</p><h1>{t('map.title')}<br /><em>{t('map.titleAccent')}</em></h1></div>
        <div className="map-page__aside"><strong>{destinations.length}</strong><p>{t('map.countText')}</p></div>
      </header>
      <section className="map-stage">
        <div className="map-stage__label"><span /> {t('map.hint')}</div>
        <DestinationsMap destinations={destinations} selectedSlug={selected?.slug ?? null} onSelect={selectDestination} />
        {selected && <MapDestinationPreview destination={selected} onClose={() => setSelected(null)} />}
      </section>
    </main>
  );
}
