import { Link } from 'wouter';

type PagePlaceholderProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PagePlaceholder({ eyebrow, title, description }: PagePlaceholderProps) {
  return (
    <main className="placeholder-page">
      <section className="placeholder-card">
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
        <Link href="/">← Вернуться на главную</Link>
      </section>
    </main>
  );
}
