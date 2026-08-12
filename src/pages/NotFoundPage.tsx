import { Link } from 'wouter';

export function NotFoundPage() {
  return (
    <main className="placeholder-page">
      <section className="placeholder-card">
        <span>404</span>
        <h1>Такой страницы пока нет</h1>
        <p>
          <Link href="/">Вернуться на главную</Link>
        </p>
      </section>
    </main>
  );
}
