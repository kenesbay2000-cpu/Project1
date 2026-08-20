import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Destination } from '../lib/destinations';
import { useI18n } from '../i18n/I18nProvider';
import { TripPlanner } from './TripPlanner';
import { ThemedDestinationSlide } from './ThemedDestinationSlide';
import './HeroShowcase.css';

type Props = { destinations: Destination[]; showPlanner?: boolean };
const WINDOW_OFFSETS = [-2, -1, 0, 1, 2] as const;

function wrapIndex(index: number, length: number) {
  return (index % length + length) % length;
}

export function HeroShowcase({ destinations, showPlanner = false }: Props) {
  const { t } = useI18n();
  const count = destinations.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [movement, setMovement] = useState<-1 | 0 | 1>(0);
  const [baseOffset, setBaseOffset] = useState(0);
  const [slideStep, setSlideStep] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isJumping, setIsJumping] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isNearViewport, setIsNearViewport] = useState(false);
  const displayedIndex = wrapIndex(activeIndex + movement, count);

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const center = track?.children.item(2) as HTMLElement | null;
    const next = track?.children.item(3) as HTMLElement | null;
    if (!viewport || !center) return;
    setBaseOffset(viewport.clientWidth / 2 - center.offsetLeft - center.offsetWidth / 2);
    setSlideStep(next ? next.offsetLeft - center.offsetLeft : center.offsetWidth);
  }, []);

  useLayoutEffect(measure, [measure]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [measure]);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !('IntersectionObserver' in window)) {
      setIsNearViewport(true);
      return undefined;
    }
    const observer = new IntersectionObserver(([entry]) => setIsNearViewport(entry.isIntersecting), { rootMargin: '250px 0px' });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsJumping(false));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !isNearViewport || isPaused || movement) return undefined;
    const timer = window.setInterval(() => setMovement(1), 6_500);
    return () => window.clearInterval(timer);
  }, [isNearViewport, isPaused, movement]);

  const move = useCallback((step: number) => {
    if (movement || count < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setActiveIndex((current) => wrapIndex(current + (step < 0 ? -1 : 1), count));
      return;
    }
    setIsJumping(false);
    setMovement(step < 0 ? -1 : 1);
  }, [count, movement]);
  const finishMove = () => {
    if (!movement) return;
    setIsJumping(true);
    setActiveIndex((current) => wrapIndex(current + movement, count));
    setMovement(0);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setIsJumping(false)));
  };
  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if ((event.pointerType === 'mouse' && event.button !== 0) || movement) return;
    if ((event.target as HTMLElement).closest('a, button')) return;
    pointerStart.current = event.clientX;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const drag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) setDragOffset(event.clientX - pointerStart.current);
  };
  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const distance = event.clientX - pointerStart.current;
    setIsDragging(false);
    setDragOffset(0);
    if (Math.abs(distance) > 48) move(distance < 0 ? 1 : -1);
  };

  return (
    <div className="themed-slider">
      <div className="themed-slider__viewport" ref={viewportRef} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onMouseEnter={() => setIsPaused(true)} onMouseLeave={() => setIsPaused(false)} onFocus={() => setIsPaused(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setIsPaused(false); }}>
        <div className={`themed-slider__track${isDragging || isJumping ? ' is-direct' : ''}`} ref={trackRef} style={{ transform: `translate3d(${baseOffset + dragOffset - movement * slideStep}px, 0, 0)` }} onTransitionEnd={(event) => { if (event.target === event.currentTarget) finishMove(); }}>
          {WINDOW_OFFSETS.map((relativeOffset) => {
            const destination = destinations[wrapIndex(activeIndex + relativeOffset, count)];
            const isIncoming = movement === 1 ? relativeOffset === 2 : movement === -1 && relativeOffset === -2;
            return <ThemedDestinationSlide destination={destination} isActive={relativeOffset === movement} position={displayedIndex + 1} total={count} shouldLoadPhoto={Math.abs(relativeOffset) <= 1 || isIncoming} onMove={move} key={relativeOffset} />;
          })}
        </div>
      </div>
      {showPlanner && <div className="themed-slider__planner"><TripPlanner /></div>}
      <p className="themed-slider__note">{t('showcase.note')}</p>
    </div>
  );
}
