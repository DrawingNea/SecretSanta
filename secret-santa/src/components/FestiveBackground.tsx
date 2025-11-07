import React from 'react';
import { createPortal } from 'react-dom';

export function FestiveBackground() {
  const [mounted, setMounted] = React.useState(false);

  // Robust viewport height variable (handles mobile browser chrome)
  React.useEffect(() => {
    setMounted(true);

    const setVh = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    setVh();
    window.addEventListener('resize', setVh);
    window.addEventListener('orientationchange', setVh);
    return () => {
      window.removeEventListener('resize', setVh);
      window.removeEventListener('orientationchange', setVh);
    };
  }, []);

  const flakes = Array.from({ length: 36 });

  const content = (
    <div className="fx-bg" aria-hidden>
      <div className="fx-noise" />
      <div className="fx-snow">
        {flakes.map((_, i) => (
          <span key={i} style={{ ['--i' as string]: i + 1 }} />
        ))}
      </div>
    </div>
  );

  return mounted ? createPortal(content, document.body) : null;
}
