import type { GuideHighlight } from '../lib/destinationGuides';

export function DestinationHighlights({ items }: { items: GuideHighlight[] }) {
  return (
    <section className="article-section" id="see">
      <div className="article-section__heading">
        <p className="article-kicker">Главное</p>
        <h2>Что посмотреть</h2>
        <p>Не список для галочки, а места, через которые лучше всего чувствуется характер направления.</p>
      </div>
      <div className="highlight-grid">
        {items.map((item, index) => (
          <article className="highlight-card" key={item.title}>
            <div className="highlight-card__top">
              <span>0{index + 1}</span><small>{item.tag}</small>
            </div>
            <h3>{item.title}</h3>
            <p>{item.text}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
