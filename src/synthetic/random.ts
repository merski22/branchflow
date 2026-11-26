/**
 * Deterministic pseudo-random generation for synthetic data (NFR-034).
 * The same seed always produces the same sequence. Not cryptographically secure — never use
 * for secrets or tokens.
 */

export interface Random {
  /** Uniform float in [0, 1). */
  next(): number
  /** Uniform integer in [min, max] (inclusive). */
  int(min: number, max: number): number
  /** True with the given probability. */
  chance(probability: number): boolean
  pick<T>(items: readonly T[]): T
  /** Pick using relative weights, e.g. [["a", 3], ["b", 1]]. */
  weighted<T>(entries: readonly (readonly [T, number])[]): T
  shuffle<T>(items: readonly T[]): T[]
  /** A UUID (version 4 layout) derived from the sequence, for reproducible ids. */
  uuid(): string
}

/** mulberry32 — small, fast, well-distributed 32-bit generator. */
export function createRandom(seed: number): Random {
  if (!Number.isInteger(seed)) throw new RangeError("Seed must be an integer.")
  let state = seed >>> 0

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  const int = (min: number, max: number): number => {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`Invalid integer range [${min}, ${max}]`)
    }
    return min + Math.floor(next() * (max - min + 1))
  }

  return {
    next,
    int,
    chance: (p) => {
      if (!(p >= 0 && p <= 1)) throw new RangeError("Probability must be within [0, 1].")
      return next() < p
    },
    pick: (items) => {
      if (items.length === 0) throw new RangeError("Cannot pick from an empty list.")
      return items[int(0, items.length - 1)]!
    },
    weighted: (entries) => {
      const total = entries.reduce((sum, [, w]) => sum + w, 0)
      if (entries.length === 0 || !(total > 0) || entries.some(([, w]) => !(w >= 0))) {
        throw new RangeError("Weights must be non-negative with a positive total.")
      }
      let roll = next() * total
      for (const [value, weight] of entries) {
        roll -= weight
        if (roll < 0) return value
      }
      return entries[entries.length - 1]![0]
    },
    shuffle: (items) => {
      const copy = [...items]
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i)
        ;[copy[i], copy[j]] = [copy[j]!, copy[i]!]
      }
      return copy
    },
    uuid: () => {
      const bytes = Array.from({ length: 16 }, () => int(0, 255))
      bytes[6] = (bytes[6]! & 0x0f) | 0x40
      bytes[8] = (bytes[8]! & 0x3f) | 0x80
      const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("")
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
    },
  }
}
