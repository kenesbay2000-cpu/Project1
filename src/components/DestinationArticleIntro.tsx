import type { DestinationGuide } from '../lib/destinationGuides';

export function DestinationArticleIntro({ guide }: { guide: DestinationGuide }) {
  return (
    <section className="article-intro" id="guide">
      <aside className="article-toc">
        <p>В этом гиде</p>
        <a href="#see">Что посмотреть</a><a href="#practical">Сезон и бюджет</a><a href="#cautions">Важно знать</a>
      </aside>
      <div className="article-copy">
        <p className="article-kicker">Почему стоит ехать</p>
        <h2>{guide.intro[0]}</h2>
        {guide.intro.slice(1).map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </div>
      <aside className="quick-facts">
        {guide.essentials.map((item) => <div key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}
      </aside>
    </section>
  );
}
