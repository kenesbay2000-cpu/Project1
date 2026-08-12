import { ReactNode, useLayoutEffect, useRef } from 'react';
import { useLocation } from 'wouter';

type PageTransitionProps = {
  children: ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const [location] = useLocation();
  const pageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    pageRef.current?.focus({ preventScroll: true });
  }, [location]);

  return (
    <div className="page-transition" key={location} ref={pageRef} tabIndex={-1}>
      {children}
    </div>
  );
}
