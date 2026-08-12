import { Link } from 'wouter';
import { destinations } from '../lib/destinations';

export function DestinationGrid() {
  return (
    <div className="destinations">
      {destinations.slice(1, 5).map((destination) => (
        <Link className="destination" href={`/destinations/${destination.slug}`} key={destination.city} style={{ '--photo': `url(${destination.image})` } as React.CSSProperties}>
          <span className="destination__badge">{destination.badge}</span>
          <div className="destination__body">
            <div className="destination__meta">{destination.country} · {destination.duration}</div>
            <div className="destination__row"><h3>{destination.city}</h3><div className="destination__price"><span>Вся поездка</span><strong>{destination.price}</strong></div></div>
            <span className="destination__arrow">↗</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
