import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { Destination } from '../lib/destinations';
import { useI18n } from '../i18n/I18nProvider';
import { TripPlanner } from './TripPlanner';
import { ThemedDestinationSlide } from './ThemedDestinationSlide';
import './HeroShowcase.css';

type Props = { destinations: Destination[]; showPlanner?: boolean };

function wrapIndex(index: number, length: number) {
  return (index % length + length) % length;
}

export function HeroShowcase({ destinations, showPlanner = false }: Props) {
  const { t } = useI18n();
  const count = destinations.length;
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef(0);
  const [trackIndex, setTrackIndex] = useState(count);
  const [offset, setOffset] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isJumping, setIsJumping] = useState(true);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const repeated = [...destinations, ...destinations, ...destinations];
  const activeIndex = wrapIndex(trackIndex, count);

  const measure = () => {
    const viewport = viewportRef.current;
    const card = trackRef.current?.children.item(trackIndex) as HTMLElement | null;
    if (viewport && card) setOffset(viewport.clientWidth / 2 - card.offsetLeft - card.offsetWidth / 2);
  };

  useLayoutEffect(measure, [trackIndex, destinations]);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsJumping(false));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return undefined;
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [trackIndex]);
  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion || isHovered || hasFocus || isDragging) return undefined;
    const timer = window.setInterval(() => setTrackIndex((current) => current + 1), 6_500);
    return () => window.clearInterval(timer);
  }, [hasFocus, isDragging, isHovered]);

  const move = (step: number) => {
    setIsJumping(false);
    setTrackIndex((current) => current + step);
  };
  const finishMove = () => {
    let normalized = trackIndex;
    if (trackIndex < count) normalized += count;
    if (trackIndex >= count * 2) normalized -= count;
    if (normalized === trackIndex) return;
    setIsJumping(true);
    setTrackIndex(normalized);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setIsJumping(false)));
  };
  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
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
      <div className="themed-slider__viewport" ref={viewportRef} onPointerDown={startDrag} onPointerMove={drag} onPointerUp={endDrag} onPointerCancel={endDrag} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)} onFocus={() => setHasFocus(true)} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHasFocus(false); }}>
        <div className={`themed-slider__track${isDragging || isJumping ? ' is-direct' : ''}`} ref={trackRef} style={{ transform: `translate3d(${offset + dragOffset}px, 0, 0)` }} onTransitionEnd={(event) => { if (event.target === event.currentTarget) finishMove(); }}>
          {repeated.map((destination, index) => <ThemedDestinationSlide destination={destination} isActive={index === trackIndex} position={activeIndex + 1} total={count} onMove={move} key={`${Math.floor(index / count)}-${destination.slug}`} />)}
        </div>
      </div>
      {showPlanner && <div className="themed-slider__planner"><TripPlanner /></div>}
      <p className="themed-slider__note">{t('showcase.note')}</p>
    </div>
  );
}
