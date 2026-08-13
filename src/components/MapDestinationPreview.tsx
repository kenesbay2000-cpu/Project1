import { Link } from 'wouter';
import type { Destination } from '../lib/destinations';

type Props = { destination: Destination; onClose: () => void };

export function MapDestinationPreview({ destination, onClose }: Props) {
  return (
    <article className="map-preview">
      <div className="map-preview__photo">
        <img src={destination.image} alt={`${destination.city}, ${destination.country}`} />
        <button type="button" onClick={onClose} aria-label="Закрыть превью">×</button>
        <span>{destination.visa}</span>
      </div>
      <div className="map-preview__body">
        <p>{destination.country} · ★ {destination.rating}</p>
        <h2>{destination.city}</h2>
        <div><span>Ориентир на поездку</span><strong>{destination.price}</strong></div>
        <Link href={`/destinations/${destination.slug}`}>Открыть путеводитель <span>→</span></Link>
      </div>
    </article>
  );
}
