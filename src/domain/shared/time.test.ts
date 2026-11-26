import { describe, expect, it } from "vitest"

import {
  businessDateOf,
  businessDayBounds,
  formatBranchDateTime,
  isValidTimeZone,
  isWithinBusinessDate,
  parseBusinessDate,
} from "./time"

const TORONTO = "America/Toronto"
const d = parseBusinessDate

describe("isValidTimeZone", () => {
  it("accepts IANA zones and UTC", () => {
    expect(isValidTimeZone(TORONTO)).toBe(true)
    expect(isValidTimeZone("America/Vancouver")).toBe(true)
    expect(isValidTimeZone("UTC")).toBe(true)
  })
  it("rejects empty, unknown and abbreviation-style zones", () => {
    expect(isValidTimeZone("")).toBe(false)
    expect(isValidTimeZone("Mars/Olympus")).toBe(false)
    expect(isValidTimeZone("EST")).toBe(false)
  })
})

describe("parseBusinessDate", () => {
  it("accepts real dates including leap days", () => {
    expect(d("2028-02-29")).toBe("2028-02-29")
  })
  it.each([
    "2026-02-30",
    "2027-02-29",
    "2026-13-01",
    "2026-1-5",
    "26-01-05",
    "",
    "2026-01-05T00:00",
  ])("rejects %j", (value) => {
    expect(() => parseBusinessDate(value)).toThrow(RangeError)
  })
})

describe("businessDateOf (TIME-001)", () => {
  it("uses the branch's local date, not the UTC date", () => {
    // 2026-11-27 03:30 UTC is still the evening of Nov 26 in Toronto (EST, UTC-5).
    expect(businessDateOf(new Date("2026-11-27T03:30:00Z"), TORONTO)).toBe("2026-11-26")
    expect(businessDateOf(new Date("2026-11-27T05:00:00Z"), TORONTO)).toBe("2026-11-27")
  })

  it("treats local midnight as the start of the new day", () => {
    expect(businessDateOf(new Date("2026-11-27T04:59:59.999Z"), TORONTO)).toBe("2026-11-26")
    expect(businessDateOf(new Date("2026-11-27T05:00:00.000Z"), TORONTO)).toBe("2026-11-27")
  })

  it("follows daylight saving time (EDT, UTC-4) in summer", () => {
    expect(businessDateOf(new Date("2026-07-01T03:59:00Z"), TORONTO)).toBe("2026-06-30")
    expect(businessDateOf(new Date("2026-07-01T04:00:00Z"), TORONTO)).toBe("2026-07-01")
  })

  it("gives different dates for the same instant in different branches", () => {
    const instant = new Date("2026-11-27T06:30:00Z")
    expect(businessDateOf(instant, TORONTO)).toBe("2026-11-27")
    expect(businessDateOf(instant, "America/Vancouver")).toBe("2026-11-26")
  })

  it("throws on invalid input instead of falling back", () => {
    expect(() => businessDateOf(new Date("not a date"), TORONTO)).toThrow(RangeError)
    expect(() => businessDateOf(new Date(), "Not/AZone")).toThrow(RangeError)
  })
})

describe("businessDayBounds (TIME-001)", () => {
  const hours = (b: { start: Date; end: Date }) => (b.end.getTime() - b.start.getTime()) / 3_600_000

  it("is a 24-hour half-open interval on an ordinary day", () => {
    const b = businessDayBounds(d("2026-11-26"), TORONTO)
    expect(b.start.toISOString()).toBe("2026-11-26T05:00:00.000Z")
    expect(b.end.toISOString()).toBe("2026-11-27T05:00:00.000Z")
    expect(hours(b)).toBe(24)
  })

  it("is 23 hours on the spring-forward day (2026-03-08)", () => {
    const b = businessDayBounds(d("2026-03-08"), TORONTO)
    expect(b.start.toISOString()).toBe("2026-03-08T05:00:00.000Z")
    expect(b.end.toISOString()).toBe("2026-03-09T04:00:00.000Z")
    expect(hours(b)).toBe(23)
  })

  it("is 25 hours on the fall-back day (2026-11-01)", () => {
    const b = businessDayBounds(d("2026-11-01"), TORONTO)
    expect(hours(b)).toBe(25)
  })

  it("crosses month and year boundaries", () => {
    const b = businessDayBounds(d("2026-12-31"), TORONTO)
    expect(b.end.toISOString()).toBe("2027-01-01T05:00:00.000Z")
  })

  it("agrees with businessDateOf at both edges", () => {
    const date = d("2026-03-08")
    const { start, end } = businessDayBounds(date, TORONTO)
    expect(isWithinBusinessDate(start, date, TORONTO)).toBe(true)
    expect(isWithinBusinessDate(new Date(end.getTime() - 1), date, TORONTO)).toBe(true)
    expect(isWithinBusinessDate(end, date, TORONTO)).toBe(false)
    expect(businessDateOf(new Date(end.getTime() - 1), TORONTO)).toBe(date)
  })
})

describe("formatBranchDateTime", () => {
  it("renders branch-local time with the zone abbreviation", () => {
    const text = formatBranchDateTime(new Date("2026-11-26T13:05:00Z"), TORONTO)
    expect(text).toContain("08:05")
    expect(text).toContain("EST")
  })
})
