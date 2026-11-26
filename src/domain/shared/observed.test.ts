import { describe, expect, it } from "vitest"

import { fromNullable, known, mapObserved, toNullable, unknown } from "./observed"

describe("Observed", () => {
  it("treats null and undefined as unknown", () => {
    expect(fromNullable(null)).toEqual({ known: false, reason: "missing_from_source" })
    expect(fromNullable(undefined, "not_collected")).toEqual({
      known: false,
      reason: "not_collected",
    })
  })

  it("keeps falsy-but-real values as known (0 is not unknown, unknown is not 0)", () => {
    expect(fromNullable(0)).toEqual({ known: true, value: 0 })
    expect(fromNullable(false)).toEqual({ known: true, value: false })
    expect(fromNullable("")).toEqual({ known: true, value: "" })
  })

  it("maps only known values", () => {
    expect(mapObserved(known(2), (n) => n * 10)).toEqual(known(20))
    expect(mapObserved(unknown<number>("invalid_value"), (n) => n * 10)).toEqual(
      unknown("invalid_value"),
    )
  })

  it("converts unknown to null, never to a default", () => {
    expect(toNullable(unknown<number>("missing_from_source"))).toBeNull()
    expect(toNullable(known(0))).toBe(0)
  })
})
