import { useCallback, useState } from 'react';
import { DestinationsMap } from '../components/DestinationsMap';
import { MapDestinationPreview } from '../components/MapDestinationPreview';
import { destinations, type Destination } from '../lib/destinations';
import './MapPage.css';

export function MapPage() {
  const [selected, setSelected] = useState<Destination | null>(null);
  const selectDestination = useCallback((destination: Destination) => setSelected(destination), []);

  return (
    <main className="map-page">
      <header className="map-page__intro">
        <div><p className="section-label">Исследуйте мир</p><h1>Все направления.<br /><em>На одной карте.</em></h1></div>
        <div className="map-page__aside"><strong>{destinations.length}</strong><p>мест от Европы до Азии. Нажмите на метку, чтобы познакомиться ближе.</p></div>
      </header>
      <section className="map-stage">
        <div className="map-stage__label"><span /> Перемещайте карту и приближайте</div>
        <DestinationsMap destinations={destinations} selectedSlug={selected?.slug ?? null} onSelect={selectDestination} />
        {selected && <MapDestinationPreview destination={selected} onClose={() => setSelected(null)} />}
      </section>
    </main>
  );
}
