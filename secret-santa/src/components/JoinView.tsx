import React from 'react';
import { Header } from './Header';
import { ConfirmDialog } from './ConfirmDialog';
import type { Group } from '../types';

// Choose your UX:
const USE_LONG_PRESS = true; // true = press & hold reveal, false = click + modal
const HOLD_MS = 1200; // hold duration in ms for long-press

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
      // Handle error
    }
  }, [deviceClaimKey]);

  // Enforce device claim; auto-reveal if already revealed on this device
  React.useEffect(() => {
    setConfirmOpen(false);
    setRevealed(false);
    setHoldProgress(0);

    if (claimedName && whoAmI !== claimedName) {
      setWhoAmI(claimedName);
      return;
    }

    const name = claimedName ?? whoAmI;
    if (name && localStorage.getItem(revealKey(name)) === '1') {
      setRevealed(true);
    }
  }, [whoAmI, claimedName, revealKey, setWhoAmI]);

  const currentName = claimedName ?? whoAmI;
  const isLockedToName = Boolean(claimedName);
  const myTarget = currentName ? group.assignments[currentName] : '';

  // ---------- Click + modal path (only when USE_LONG_PRESS === false)
  function startReveal() {
    const name = currentName;
    if (!name) return;
    if (claimedName && name !== claimedName) return;

    if (localStorage.getItem(revealKey(name)) === '1') {
      setRevealed(true);
      return;
    }
    setConfirmOpen(true);
  }

  function confirmReveal() {
    const name = currentName;
    if (!name) return;
    setConfirmOpen(false);
    setRevealed(true);
    try {
      localStorage.setItem(revealKey(name), '1');
      localStorage.setItem(deviceClaimKey, name);
      setClaimedName(name);
    } catch {
      // Handle error
    }
  }

  // ---------- Long-press path (NO modal when USE_LONG_PRESS === true)
  const onHoldDown = () => {
    const name = currentName;
    if (!name) return;
    if (claimedName && name !== claimedName) return;

    if (localStorage.getItem(revealKey(name)) === '1') {
      setRevealed(true);
      return;
    }

    setHoldProgress(0);
    const start = performance.now();

    const tick = () => {
      const now = performance.now();
      const p = Math.min(1, (now - start) / HOLD_MS);
      setHoldProgress(p);
      if (p >= 1) {
        // reveal + lock
        setRevealed(true);
        try {
          localStorage.setItem(revealKey(name), '1');
          localStorage.setItem(deviceClaimKey, name);
          setClaimedName(name);
        } catch {
          // Handle error
        }
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
          <option value="">— select your name —</option>
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
                  style={{ width: `${(holdProgress * 100).toFixed(1)}%` }}
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
    </>
  );
}
