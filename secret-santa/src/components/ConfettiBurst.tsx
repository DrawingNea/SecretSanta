import React from 'react';
import { createPortal } from 'react-dom';

type API = {
  burst: () => void;
  burstAt: (x: number, y: number, opts?: Partial<BurstOptions>) => void;
};
type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  w: number;
  h: number;
  rot: number;
  vr: number;
  color: string;
  life: number;
};
type BurstOptions = {
  count: number;
  duration: number; // ms of life
  spreadDeg: number; // cone half-angle (degrees)
  power: number; // initial speed multiplier
  gravity: number; // downward acceleration per frame
};

const DEFAULTS: BurstOptions = {
  count: 140,
  duration: 1600,
  spreadDeg: 25, // narrower = tighter cone
  power: 5.2, // speed
  gravity: 0.12,
};

export const ConfettiBurst = React.forwardRef<API, object>(
  function ConfettiBurst(_, ref) {
    const [mounted, setMounted] = React.useState(false);
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
    const rafRef = React.useRef<number | null>(null);
    const particlesRef = React.useRef<Particle[]>([]);
    const runningRef = React.useRef(false);

    React.useImperativeHandle(ref, () => ({
      burst: () => {
        // center of screen, upward
        const cx = window.innerWidth / 2;
        const cy = Math.max(120, window.innerHeight * 0.5);
        burstAt(cx, cy, undefined);
      },
      burstAt: (x, y, opts) => burstAt(x, y, opts),
    }));

    React.useEffect(() => {
      setMounted(true);
      return () => {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
      };
    }, []);

    function resize() {
      const c = canvasRef.current!;
      const dpr = Math.max(1, window.devicePixelRatio || 1);
      c.width = Math.floor(window.innerWidth * dpr);
      c.height = Math.floor(window.innerHeight * dpr);
      c.style.width = '100vw';
      c.style.height = '100vh';
      const ctx = c.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function burstAt(x: number, y: number, opts?: Partial<BurstOptions>) {
      const c = canvasRef.current;
      if (!c) return;

      const cfg = { ...DEFAULTS, ...(opts || {}) };

      // (Re)size to viewport each burst
      resize();

      const colors = [
        '#FF5C7A',
        '#FFD166',
        '#06D6A0',
        '#4DA3FF',
        '#B794F4',
        '#F7A6FF',
      ];
      const spreadRad = (cfg.spreadDeg * Math.PI) / 180;
      const centerAngle = -Math.PI / 2; // straight up
      particlesRef.current = [];

      for (let i = 0; i < cfg.count; i++) {
        const angle = centerAngle + (Math.random() - 0.5) * 2 * spreadRad;
        const speed = cfg.power * (0.6 + Math.random() * 0.8);
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          w: 3 + Math.random() * 3.5,
          h: 6 + Math.random() * 7,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 0.35,
          color: colors[(Math.random() * colors.length) | 0],
          life: cfg.duration + Math.random() * 400,
        });
      }

      if (!runningRef.current) {
        runningRef.current = true;
        loop(cfg.gravity);
      }
    }

    function loop(gravity: number) {
      const c = canvasRef.current!;
      const ctx = c.getContext('2d')!;
      ctx.clearRect(0, 0, c.width, c.height);

      particlesRef.current.forEach((p) => {
        p.life -= 16;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += gravity; // gravity pulls down over time
        p.rot += p.vr;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      particlesRef.current = particlesRef.current.filter(
        (p) =>
          p.life > 0 &&
          p.y < window.innerHeight + 80 &&
          p.x > -80 &&
          p.x < window.innerWidth + 80
      );

      if (particlesRef.current.length > 0) {
        rafRef.current = requestAnimationFrame(() => loop(gravity));
      } else {
        runningRef.current = false;
      }
    }

    React.useEffect(() => {
      const onResize = () => runningRef.current && resize();
      window.addEventListener('resize', onResize);
      window.addEventListener('orientationchange', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        window.removeEventListener('orientationchange', onResize);
      };
    }, []);

    const node = (
      <div className="confetti-wrap" aria-hidden>
        <canvas ref={canvasRef} className="confetti-canvas" />
      </div>
    );
    return mounted ? createPortal(node, document.body) : null;
  }
);
