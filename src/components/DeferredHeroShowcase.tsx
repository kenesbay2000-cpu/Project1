import { useEffect, useRef, useState } from 'react';
import type { Destination } from '../lib/destinations';
import { HeroShowcase } from './HeroShowcase';

type Props = { destinations: Destination[]; showPlanner?: boolean };

export function DeferredHeroShowcase({ destinations, showPlanner = false }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || shouldRender) return undefined;
    if (!('IntersectionObserver' in window)) {
      setShouldRender(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setShouldRender(true);
      observer.disconnect();
    }, { rootMargin: '700px 0px' });
    observer.observe(host);
    return () => observer.disconnect();
  }, [shouldRender]);

  return (
    <div className={`deferred-showcase${showPlanner ? ' deferred-showcase--planner' : ''}`} ref={hostRef}>
      {shouldRender ? <HeroShowcase destinations={destinations} showPlanner={showPlanner} /> : <div className="deferred-showcase__placeholder" aria-hidden="true" />}
    </div>
  );
}
