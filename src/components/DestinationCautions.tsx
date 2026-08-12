import type { DestinationGuide } from '../lib/destinationGuides';

export function DestinationCautions({ guide }: { guide: DestinationGuide }) {
  return (
    <section className="caution-section" id="cautions">
      <div className="caution-section__intro">
        <p className="article-kicker">Знать заранее</p>
        <h2>Путешествовать спокойно</h2>
        <p>Не повод тревожиться — просто несколько деталей, которые помогут избежать неприятных сюрпризов.</p>
      </div>
      <div className="caution-list">
        {guide.cautions.map((item, index) => (
          <article key={item.title}><span>0{index + 1}</span><div><h3>{item.title}</h3><p>{item.text}</p></div></article>
        ))}
      </div>
      <aside className="culture-note">
        <p className="article-kicker">Культурный код</p><h3>К чему быть готовым</h3>
        {guide.culture.map((text) => <p key={text}>{text}</p>)}
      </aside>
    </section>
  );
}
