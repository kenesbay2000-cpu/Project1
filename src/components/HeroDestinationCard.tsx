import type { Destination } from '../lib/destinations';
import './HeroDestinationCard.css';

type HeroDestinationCardProps = {
  destination: Destination;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
};

const slideNumber = (value: number) => String(value).padStart(2, '0');

export function HeroDestinationCard({
  destination,
  index,
  total,
  onPrevious,
  onNext,
}: HeroDestinationCardProps) {
  return (
    <aside className="ai-destination-card" aria-live="polite">
      <div className="ai-destination-card__top">
        <span>{destination.badge}</span>
        <span>{slideNumber(index + 1)}/{slideNumber(total)}</span>
      </div>

      <div className="ai-destination-card__trip">
        <small>{destination.duration}</small>
        <strong>{destination.price}</strong>
      </div>

      <div className="ai-destination-card__footer">
        <span className="ai-destination-card__rating">
          <b>★ {destination.rating}</b>
          <small>{destination.reviews}</small>
        </span>
        <div className="ai-destination-card__arrows">
          <button type="button" onClick={onPrevious} aria-label="Предыдущее направление">←</button>
          <button type="button" onClick={onNext} aria-label="Следующее направление">→</button>
        </div>
      </div>
    </aside>
  );
}
