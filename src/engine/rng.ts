// Deterministic helpers: every random decision is derived from (seed, salt) so runs replay exactly.

export function hashString(s: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class Rng {
  private next: () => number;
  constructor(seed: number) { this.next = mulberry32(seed); }
  static from(seed: number, salt: string) { return new Rng(hashString(`${seed}:${salt}`)); }
  float() { return this.next(); }
  int(maxExclusive: number) { return Math.floor(this.next() * maxExclusive); }
  pick<T>(arr: readonly T[]): T {
    if (!arr.length) throw new Error('pick from empty array');
    return arr[this.int(arr.length)];
  }
  weighted<T>(arr: readonly T[], w: (x: T) => number): T {
    const total = arr.reduce((s, x) => s + Math.max(0, w(x)), 0);
    if (total <= 0) return this.pick(arr);
    let r = this.next() * total;
    for (const x of arr) { r -= Math.max(0, w(x)); if (r <= 0) return x; }
    return arr[arr.length - 1];
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = this.int(i + 1); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  }
  chance(p: number) { return this.next() < p; }
}

export function newSeed(): number {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    return crypto.getRandomValues(new Uint32Array(1))[0];
  }
  return Math.floor(Math.random() * 2 ** 32);
}
