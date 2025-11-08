import React from 'react';
import { Header } from './Header';
import { ConfirmDialog } from './ConfirmDialog';
import { ConfettiBurst } from './ConfettiBurst';
import type { Group } from '../types';
import { getNotesAPI } from '../storage/notes.storage';

const USE_LONG_PRESS = true;
const HOLD_MS = 1200;

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

  // hold-to-reveal
  const [holdProgress, setHoldProgress] = React.useState(0);
  const rafRef = React.useRef<number | null>(null);

  // notes storage
  const [notesApi, setNotesApi] = React.useState<Awaited<
    ReturnType<typeof getNotesAPI>
  > | null>(null);
  const [myNote, setMyNote] = React.useState<string>('');
  const [targetNote, setTargetNote] = React.useState<string>('');

  // confetti
  const confettiRef = React.useRef<ConfettiApi | null>(null);
  const holdBtnRef = React.useRef<HTMLButtonElement | null>(null);

  // group token is our "group_id"
  const gToken = React.useMemo(
    () => new URLSearchParams(location.search).get('g') ?? '',
    []
  );
  const deviceClaimKey = React.useMemo(
    () => `ss:deviceClaim:${gToken}`,
    [gToken]
  );
  const revealKey = React.useCallback(
    (name: string) => `ss:revealed:${gToken}:${name}`,
    [gToken]
  );

  // hydrate storage API
  React.useEffect(() => {
    getNotesAPI().then(setNotesApi);
  }, []);

  // load device claim
  React.useEffect(() => {
    try {
      const saved = localStorage.getItem(deviceClaimKey);
      if (saved) setClaimedName(saved);
    } catch {
      /* ignore */
    }
  }, [deviceClaimKey]);

  // sync revealed state & lock
  React.useEffect(() => {
    setConfirmOpen(false);
    setHoldProgress(0);

    if (claimedName && whoAmI !== claimedName) {
      setWhoAmI(claimedName);
      return;
    }

    const name = claimedName ?? whoAmI;
    if (name && localStorage.getItem(revealKey(name)) === '1')
      setRevealed(true);
    else setRevealed(false);
  }, [whoAmI, claimedName, revealKey, setWhoAmI]);

  const currentName = claimedName ?? whoAmI;
  const isLockedToName = Boolean(claimedName);

  const myTargetName = currentName ? group.assignments[currentName] : '';

  // Load my own note when I change selection (or when storage ready)
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!notesApi || !currentName) {
        setMyNote('');
        return;
      }
      const note = await notesApi.getNote(gToken, currentName);
      if (!cancelled) setMyNote(note || '');
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [notesApi, currentName, gToken]);

  // Debounced autosave for myNote
  React.useEffect(() => {
    if (!notesApi || !currentName) return;
    const h = setTimeout(() => {
      notesApi.upsertNote(gToken, currentName, myNote.trim());
    }, 400);
    return () => clearTimeout(h);
  }, [notesApi, gToken, currentName, myNote]);

  // Fetch target's note when revealed (or when target changes)
  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!notesApi || !revealed || !myTargetName) {
        setTargetNote('');
        return;
      }
      const note = await notesApi.getNote(gToken, myTargetName);
      if (!cancelled) setTargetNote(note || '');
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [notesApi, gToken, revealed, myTargetName]);

  function burstFromHoldButton() {
    const rect = holdBtnRef.current?.getBoundingClientRect();
    const cx = rect ? rect.left + rect.width / 2 : window.innerWidth / 2;
    const cy = rect
      ? rect.top + rect.height / 2
      : Math.max(120, window.innerHeight * 0.5);
    confettiRef.current?.burstAt(cx, cy, {
      spreadDeg: 32,
      power: 5.6,
      count: 160,
    });
  }

  function finalizeReveal(name: string, origin: 'hold' | 'modal' = 'hold') {
    setRevealed(true);
    try {
      localStorage.setItem(revealKey(name), '1');
      localStorage.setItem(deviceClaimKey, name);
      setClaimedName(name);
    } catch {
      /* ignore */
    }
    if (origin === 'hold') burstFromHoldButton();
    else confettiRef.current?.burst();
  }

  // click + modal (if you ever switch off long-press)
  function startReveal() {
    const name = currentName;
    if (!name) return;
    if (claimedName && name !== claimedName) return;
    if (localStorage.getItem(revealKey(name)) === '1') {
      setRevealed(true);
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

  // long-press
  const onHoldDown = () => {
    const name = currentName;
    if (!name) return;
    if (claimedName && name !== claimedName) return;

    if (localStorage.getItem(revealKey(name)) === '1') {
      setRevealed(true);
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
    setHoldProgress(0);
  };
  React.useEffect(
    () => () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    },
    []
  );

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

      {/* --- NEW: self profile editor (per person, per group) --- */}
      {currentName && (
        <div className="row">
          <label className="label">Write a note to your Secret Santa</label>
          <textarea
            className="input"
            rows={4}
            placeholder="e.g., dark chocolate, cozy socks, board games, A4 sketchbook…"
            value={myNote}
            onChange={(e) => setMyNote(e.target.value)}
          />
          <p className="muted">
            Saved{' '}
            {import.meta.env.VITE_SUPABASE_URL
              ? 'securely for this group'
              : 'on this device'}{' '}
            as you type.
          </p>
        </div>
      )}

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
            <div className="big">{myTargetName}</div>

            {/* Recipient's note (if they filled it) */}
            {targetNote && (
              <div className="wishBlock">
                <div className="wishTitle">Note from {myTargetName}:</div>
                <div className="wishText">{targetNote}</div>
              </div>
            )}
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

      <ConfettiBurst ref={confettiRef} />
    </>
  );
}
