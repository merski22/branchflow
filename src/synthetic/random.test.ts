import { describe, expect, it } from "vitest"

import { createRandom } from "./random"

describe("createRandom", () => {
  it("produces the same sequence for the same seed", () => {
    const a = createRandom(42)
    const b = createRandom(42)
    const seqA = Array.from({ length: 50 }, () => a.next())
    const seqB = Array.from({ length: 50 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it("produces different sequences for different seeds", () => {
    expect(createRandom(1).next()).not.toBe(createRandom(2).next())
  })

  it("keeps values within range", () => {
    const r = createRandom(7)
    for (let i = 0; i < 2000; i++) {
      const f = r.next()
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(1)
      const n = r.int(-3, 3)
      expect(n).toBeGreaterThanOrEqual(-3)
      expect(n).toBeLessThanOrEqual(3)
    }
  })

  it("covers both ends of an integer range", () => {
    const r = createRandom(11)
    const seen = new Set(Array.from({ length: 500 }, () => r.int(1, 4)))
    expect([...seen].sort()).toEqual([1, 2, 3, 4])
  })

  it("generates well-formed, reproducible v4-layout UUIDs", () => {
    const id = createRandom(5).uuid()
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/)
    expect(createRandom(5).uuid()).toBe(id)
  })

  it("respects zero weights and shuffles without losing items", () => {
    const r = createRandom(3)
    for (let i = 0; i < 200; i++) {
      expect(
        r.weighted([
          ["never", 0],
          ["always", 1],
        ]),
      ).toBe("always")
    }
    const items = [1, 2, 3, 4, 5, 6]
    expect(r.shuffle(items).sort()).toEqual(items)
  })

  it("rejects invalid arguments", () => {
    const r = createRandom(1)
    expect(() => createRandom(1.5)).toThrow(RangeError)
    expect(() => r.int(5, 1)).toThrow(RangeError)
    expect(() => r.pick([])).toThrow(RangeError)
    expect(() => r.chance(2)).toThrow(RangeError)
    expect(() => r.weighted([["a", 0]])).toThrow(RangeError)
  })
})
