import React from 'react';
import { Header } from './Header';
import { ConfirmDialog } from './ConfirmDialog';
import { ConfettiBurst } from './ConfettiBurst';
import type { Group } from '../types';

// Toggle your UX:
const USE_LONG_PRESS = true; // true = press & hold reveal, false = click + modal
const HOLD_MS = 1200; // hold duration in ms for long-press

// Minimal typing for the ConfettiBurst ref API
type ConfettiApi = {
  burst: () => void;
  burstAt: (
    x: number,
    y: number,
    opts?: {
      count?: number;
      duration?: number;
      spreadDeg?: number;
      power?: number;
      gravity?: number;
    }
  ) => void;
};

export function JoinView({
  group,
  whoAmI,
  setWhoAmI,
}: {
  group: Group;
  whoAmI: string;
  setWhoAmI: (s: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const [claimedName, setClaimedName] = React.useState<string | null>(null);

  // Long-press progress (0..1)
  const [holdProgress, setHoldProgress] = React.useState(0);
  const rafRef = React.useRef<number | null>(null);

  // Refs for confetti + button origin
  const confettiRef = React.useRef<ConfettiApi | null>(null);
  const holdBtnRef = React.useRef<HTMLButtonElement | null>(null);

  // Per-group keys
  const gToken = React.useMemo(
    () => new URLSearchParams(location.search).get('g') ?? '',
    []
  );
  const deviceClaimKey = React.useMemo(
    () => `ss:deviceClaim:${gToken}`, // device is bound to this name for the group
    [gToken]
  );

  // Helper to build per-name reveal key
  const revealKey = React.useCallback(
    (name: string) => `ss:revealed:${gToken}:${name}`,
    [gToken]
  );

  // Load device claim on mount
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(deviceClaimKey);
      if (saved) setClaimedName(saved);
    } catch {
      // ignore
    }
  }, [deviceClaimKey]);

  // Enforce device claim; auto-reveal if already revealed on this device
  React.useEffect(() => {
    setConfirmOpen(false);
    setHoldProgress(0);

    if (claimedName && whoAmI !== claimedName) {
      setWhoAmI(claimedName);
      return;
    }

    const name = claimedName ?? whoAmI;
    if (name && localStorage.getItem(revealKey(name)) === '1') {
      setRevealed(true);
    } else {
      setRevealed(false);
    }
  }, [whoAmI, claimedName, revealKey, setWhoAmI]);

  const currentName = claimedName ?? whoAmI;
  const isLockedToName = Boolean(claimedName);
  const myTarget = currentName ? group.assignments[currentName] : '';

  // ---------- Helpers ----------
  function burstFromHoldButton() {
    // Try to originate from the hold button center; fallback to screen center
    const rect = holdBtnRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect
      ? rect.top + rect.height / 2
      : Math.max(120, window.innerHeight * 0.5);

    confettiRef.current?.burstAt(cx, cy, {
      spreadDeg: 32, // upward cone width
      power: 5.6, // initial speed
      count: 160, // number of pieces
    });
  }

  function finalizeReveal(name: string, origin: 'hold' | 'modal' = 'hold') {
    setRevealed(true);
    try {
      localStorage.setItem(revealKey(name), '1');
      localStorage.setItem(deviceClaimKey, name);
      setClaimedName(name);
    } catch {
      // ignore
    }

    if (origin === 'hold') {
      burstFromHoldButton();
    } else {
      // Modal flow: just burst from screen center
      confettiRef.current?.burst();
    }
  }

  // ---------- Click + modal path (only when USE_LONG_PRESS === false) ----------
  function startReveal() {
    const name = currentName;
    if (!name) return;
    if (claimedName && name !== claimedName) return;

    if (localStorage.getItem(revealKey(name)) === '1') {
      setRevealed(true);
      // fire a small center burst for feedback even on re-open
      confettiRef.current?.burst();
      return;
    }
    setConfirmOpen(true);
  }

  function confirmReveal() {
    const name = currentName;
    if (!name) return;
    setConfirmOpen(false);
    finalizeReveal(name, 'modal');
  }

  // ---------- Long-press path (NO modal when USE_LONG_PRESS === true) ----------
  const onHoldDown = () => {
    const name = currentName;
    if (!name) return;
    if (claimedName && name !== claimedName) return;

    if (localStorage.getItem(revealKey(name)) === '1') {
      setRevealed(true);
      // feedback on re-open
      burstFromHoldButton();
      return;
    }

    setHoldProgress(0);
    const start = performance.now();

    const tick = () => {
      const now = performance.now();
      const p = Math.min(1, (now - start) / HOLD_MS);
      setHoldProgress(p);
      if (p >= 1) {
        finalizeReveal(name, 'hold');
        rafRef.current = null;
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const onHoldUp = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    setHoldProgress(0); // reset fill
  };

  React.useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <Header
        title={group.title || 'Secret Santa'}
        subtitle="Pick your name to reveal your match"
      />

      <div className="row">
        <label className="label">I am</label>
        <select
          className="input"
          value={currentName ?? ''}
          onChange={(e) => setWhoAmI(e.target.value)}
          disabled={isLockedToName}
          title={
            isLockedToName
              ? `This device is locked to ${claimedName}`
              : undefined
          }
        >
          <option value="">Select your name</option>
          {group.names.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        {isLockedToName && (
          <div className="muted" style={{ marginTop: 6 }}>
            This device is locked to <strong>{claimedName}</strong> for this
            group.
          </div>
        )}
      </div>

      {currentName && !revealed && (
        <>
          <div className="divider" />
          <div className="revealBox">
            <div className="hint">Ready?</div>
            {USE_LONG_PRESS ? (
              <button
                ref={holdBtnRef}
                className="btn primary holdBtn"
                onPointerDown={onHoldDown}
                onPointerUp={onHoldUp}
                onPointerLeave={onHoldUp}
                onPointerCancel={onHoldUp}
                aria-label="Press and hold to reveal"
              >
                <span className="holdLabel">Press &amp; hold to reveal</span>
                <span
                  className="holdProgress"
                  style={{
                    width: `calc(${(holdProgress * 100).toFixed(1)}% + 2px)`,
                  }}
                />
              </button>
            ) : (
              <button className="btn primary" onClick={startReveal}>
                Reveal my assignment
              </button>
            )}
            <p className="muted">
              This will show your match. Make sure no one else is looking.
            </p>
          </div>
        </>
      )}

      {currentName && revealed && (
        <>
          <div className="divider" />
          <div className="revealBox">
            <div className="hint">🎁 Your Secret Santa assignment:</div>
            <div className="big">{myTarget}</div>
          </div>
          <p className="muted">
            Shhh… Don’t share this screen. Everyone only sees their own match.
          </p>
        </>
      )}

      {!USE_LONG_PRESS && (
        <ConfirmDialog
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={confirmReveal}
        />
      )}

      {/* Full-viewport confetti layer (rendered to <body> inside the component) */}
      <ConfettiBurst ref={confettiRef} />
    </>
  );
}
