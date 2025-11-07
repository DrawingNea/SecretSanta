function sattoloShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * i); // [0, i-1]
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

export function createDerangement(names: string[], rng: () => number) {
  if (names.length < 3) throw new Error("Need at least 3 participants.");
  const receivers = sattoloShuffle(names, rng);
  const map: Record<string, string> = {};
  for (let i = 0; i < names.length; i++) map[names[i]] = receivers[i];
  for (const n of names) if (map[n] === n) throw new Error("Derangement failed. Try again.");
  return map;
}
