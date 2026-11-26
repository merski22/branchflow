import { describe, expect, it } from "vitest"

import { DEFAULT_FRESHNESS_THRESHOLDS, classifyFreshness, formatAge } from "./freshness"

const now = new Date("2026-11-26T15:00:00Z")
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000)

describe("classifyFreshness (FRESH-001)", () => {
  it("is unknown — never fresh — when there is no timestamp", () => {
    expect(classifyFreshness(null, now)).toEqual({
      status: "unknown",
      ageMinutes: null,
      reason: "no_timestamp",
    })
    expect(classifyFreshness(undefined, now).status).toBe("unknown")
  })

  it("is unknown when the timestamp is invalid", () => {
    expect(classifyFreshness(new Date("garbage"), now)).toMatchObject({
      status: "unknown",
      reason: "invalid_timestamp",
    })
  })

  it("classifies by age with the default thresholds", () => {
    expect(classifyFreshness(minutesAgo(0), now).status).toBe("fresh")
    expect(classifyFreshness(minutesAgo(239), now).status).toBe("fresh")
    expect(classifyFreshness(minutesAgo(600), now).status).toBe("aging")
    expect(classifyFreshness(minutesAgo(3000), now).status).toBe("stale")
  })

  it("puts an age exactly on a threshold into the older category", () => {
    expect(classifyFreshness(minutesAgo(240), now).status).toBe("aging")
    expect(classifyFreshness(minutesAgo(1440), now).status).toBe("stale")
  })

  it("tolerates small clock skew but flags timestamps from the future", () => {
    expect(classifyFreshness(minutesAgo(-4), now)).toEqual({ status: "fresh", ageMinutes: 0 })
    expect(classifyFreshness(minutesAgo(-30), now)).toEqual({
      status: "invalid_future",
      ageMinutes: -30,
    })
  })

  it("honours configured thresholds", () => {
    const t = { agingAfterMinutes: 10, staleAfterMinutes: 20, allowedClockSkewMinutes: 0 }
    expect(classifyFreshness(minutesAgo(15), now, t).status).toBe("aging")
    expect(classifyFreshness(minutesAgo(-1), now, t).status).toBe("invalid_future")
  })

  it("rejects incoherent thresholds", () => {
    const bad = { ...DEFAULT_FRESHNESS_THRESHOLDS, agingAfterMinutes: 2000 }
    expect(() => classifyFreshness(now, now, bad)).toThrow(RangeError)
    expect(() =>
      classifyFreshness(now, now, { ...DEFAULT_FRESHNESS_THRESHOLDS, staleAfterMinutes: -1 }),
    ).toThrow(RangeError)
  })

  it("rejects an invalid `now`", () => {
    expect(() => classifyFreshness(now, new Date("x"))).toThrow(RangeError)
  })
})

describe("formatAge", () => {
  it.each([
    [0, "0 min"],
    [59.9, "59 min"],
    [60, "1 h"],
    [125, "2 h 5 min"],
    [1440, "1 d"],
    [1500, "1 d 1 h"],
  ])("%d minutes → %s", (minutes, text) => {
    expect(formatAge(minutes)).toBe(text)
  })
})
