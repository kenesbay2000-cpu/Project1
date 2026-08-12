import type { Destination } from '../lib/destinations';
import type { DestinationGuide } from '../lib/destinationGuides';

type Props = { destination: Destination; guide: DestinationGuide };

export function DestinationEssentials({ destination, guide }: Props) {
  return (
    <section className="article-section practical-section" id="practical">
      <div className="article-section__heading">
        <p className="article-kicker">Перед поездкой</p>
        <h2>Практическая сторона</h2>
      </div>
      <div className="season-grid">
        <article><span>01</span><h3>Когда ехать</h3><p>{guide.bestTime}</p></article>
        <article><span>02</span><h3>Климат и сезонность</h3><p>{guide.climate}</p></article>
      </div>
      <div className="entry-card">
        <div><span className="entry-card__icon">◎</span><p className="article-kicker">Виза и въезд · паспорт Казахстана</p></div>
        <h3>{destination.visa}</h3>
        <p>{guide.entry}</p>
        <a href={guide.entrySource.url} target="_blank" rel="noreferrer">{guide.entrySource.label} ↗</a>
      </div>
      <div className="budget-block">
        <div className="budget-block__intro">
          <p className="article-kicker">Ориентир</p><h3>Сколько заложить</h3>
          <p>Средний комфортный бюджет без перелёта. Цены меняются по сезону и курсу валют.</p>
        </div>
        <div className="budget-list">
          {guide.budget.map((item) => (
            <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong><small>{item.note}</small></div>
          ))}
        </div>
      </div>
    </section>
  );
}
