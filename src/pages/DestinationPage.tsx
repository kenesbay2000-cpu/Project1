import { Link, useRoute } from 'wouter';
import { destinations } from '../lib/destinations';

export function DestinationPage() {
  const [, params] = useRoute('/destinations/:slug');
  const destination = destinations.find((item) => item.slug === params?.slug);

  if (!destination) {
    return (
      <main className="placeholder-page">
        <section className="placeholder-card">
          <span>404</span><h1>Направление не найдено</h1>
          <Link href="/destinations">← К каталогу</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="destination-page">
      <section className="destination-hero" style={{ '--detail-photo': `url(${destination.image})` } as React.CSSProperties}>
        <div>
          <span>{destination.country} · {destination.badge}</span>
          <h1>{destination.city}</h1>
          <p>{destination.description}</p>
          <div className="destination-hero__actions">
            <Link className="destination-hero__primary" href="/planner">Начать планирование →</Link>
            <Link className="destination-hero__secondary" href="/">← Назад</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
