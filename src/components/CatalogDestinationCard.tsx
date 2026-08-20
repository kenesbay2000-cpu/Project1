import { Link } from 'wouter';
import type { Destination } from '../lib/destinations';
import { destinationPreviewSrcSet, optimizedDestinationImage } from '../lib/destinationImages';

export function CatalogDestinationCard({ destination }: { destination: Destination }) {
  return (
    <Link className="catalog-card" href={`/destinations/${destination.slug}`}>
      <div className="catalog-card__photo">
        <img src={optimizedDestinationImage(destination.image, 960)} srcSet={destinationPreviewSrcSet(destination.image)} sizes="(max-width: 800px) calc(100vw - 44px), 46vw" alt={`${destination.city}, ${destination.country}`} loading="lazy" decoding="async" />
        <span className="catalog-card__visa">{destination.visa}</span>
        <span className="catalog-card__arrow">↗</span>
      </div>
      <div className="catalog-card__body">
        <div className="catalog-card__meta"><span>{destination.region}</span><span>★ {destination.rating}</span></div>
        <h2>{destination.city}</h2>
        <p>{destination.description}</p>
        <div className="catalog-card__tags">{destination.tags.slice(0, 3).map((tag) => <span key={tag}>{tag}</span>)}</div>
        <div className="catalog-card__footer"><span>{destination.duration}</span><strong>{destination.price}</strong></div>
      </div>
    </Link>
  );
}
