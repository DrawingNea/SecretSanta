// Simple xorshift32-based RNG seeded from crypto
export function makeRng(): () => number {
  let seed = (crypto.getRandomValues?.(new Uint32Array(1))[0] ?? Date.now()) >>> 0;
  return () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) % 1_000_000) / 1_000_000;
  };
}
