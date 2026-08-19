import type { Destination } from '../lib/destinations';
import './HeroDestinationCard.css';
import { useI18n } from '../i18n/I18nProvider';

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
  const { t } = useI18n();
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
          <button type="button" onClick={onPrevious} aria-label={t('showcase.previous')}>←</button>
          <button type="button" onClick={onNext} aria-label={t('showcase.next')}>→</button>
        </div>
      </div>
    </aside>
  );
}
