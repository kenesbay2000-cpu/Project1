import { useEffect, useRef } from 'react';
import { Link } from 'wouter';
import './AIPlannerFeatures.css';
import { useI18n } from '../i18n/I18nProvider';

export function AIPlannerFeatures() {
  const { t } = useI18n();
  const planParts = [t('features.route'), t('features.transport'), t('features.stay'), t('features.food'), t('features.activities'), t('features.budget')];
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const elements = sectionRef.current?.querySelectorAll<HTMLElement>('[data-reveal]');
    if (!elements?.length) return;
    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) => element.classList.add('is-visible'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16 });
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <section className="ai-features" ref={sectionRef} data-header-theme="light" aria-labelledby="ai-features-title">
      <div className="ai-features__inner">
        <header className="ai-features__heading" data-reveal>
          <p><span /> {t('features.eyebrow')}</p>
          <h2 id="ai-features-title">{t('features.title')}<br /><em>{t('features.titleAccent')}</em></h2>
          <div>{t('features.intro')}</div>
        </header>

        <div className="ai-features__grid">
          <article className="ai-feature ai-feature--dialog" data-reveal>
            <FeatureTitle number="01" title={t('features.f1Title')} text={t('features.f1Text')} />
            <div className="feature-chat">
              <p>{t('features.chat1')}</p>
              <span><b>AI</b> {t('features.chat2')}</span>
              <p>{t('features.chat3')}</p>
            </div>
          </article>

          <article className="ai-feature ai-feature--understand" data-reveal>
            <FeatureTitle number="02" title={t('features.f2Title')} text={t('features.f2Text')} />
            <div className="feature-prompt"><span>{t('features.prompt')}</span><i /></div>
            <div className="feature-tags"><span>{t('features.japan')}</span><span>{t('features.tenDays')}</span><span>{t('features.family')}</span><span>{t('features.calm')}</span><span>≤ 2 млн ₸</span></div>
          </article>

          <article className="ai-feature ai-feature--complete" data-reveal>
            <FeatureTitle number="03" title={t('features.f3Title')} text={t('features.f3Text')} />
            <div className="feature-plan-parts">
              {planParts.map((label, index) => <span key={label}><small>{String(index + 1).padStart(2, '0')}</small><strong>{label}</strong><i>↗</i></span>)}
            </div>
          </article>

          <article className="ai-feature ai-feature--realism" data-reveal>
            <FeatureTitle number="04" title={t('features.f4Title')} text={t('features.f4Text')} />
            <div className="feature-day"><span>09:30</span><i /><p><b>{t('features.museum')}</b><small>{t('features.duration')}</small></p></div>
            <div className="feature-transfer"><span>{t('features.walk')}</span><i>✓</i></div>
            <div className="feature-day"><span>13:00</span><i /><p><b>{t('features.lunch')}</b><small>{t('features.nearby')}</small></p></div>
          </article>

          <article className="ai-feature ai-feature--refine" data-reveal>
            <FeatureTitle number="05" title={t('features.f5Title')} text={t('features.f5Text')} />
            <div className="feature-commands"><span>{t('features.cheaper')} <i>→</i></span><span>{t('features.addDestination')} <i>→</i></span><span>{t('features.moreFreeTime')} <i>→</i></span></div>
          </article>

          <article className="ai-feature ai-feature--saved" data-reveal>
            <FeatureTitle number="06" title={t('features.f6Title')} text={t('features.f6Text')} />
            <div className="feature-saved-card"><span>{t('features.dates')}</span><h3>{t('features.savedTitle')}</h3><p>{t('features.savedMeta')}</p><b>{t('features.saved')} <i>✓</i></b></div>
          </article>
        </div>

        <div className="ai-features__cta" data-reveal>
          <p>{t('features.ctaText')}</p>
          <Link href="/planner">{t('features.openPlanner')} <span>→</span></Link>
        </div>
      </div>
      <div className="ai-features__transition"><span>{t('features.inspiration')}</span><i>↓</i></div>
    </section>
  );
}

function FeatureTitle({ number, title, text }: { number: string; title: string; text: string }) {
  return <header className="ai-feature__title"><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></header>;
}
