import { describe, expect, it } from "vitest"

import { addMoney, formatMoney, money, parseMoney } from "./money"

describe("parseMoney", () => {
  it.each([
    ["0", 0],
    ["12", 1200],
    ["12.3", 1230],
    ["12.34", 1234],
    ["-12.34", -1234],
    [" 0.07 ", 7],
    ["-0", 0],
  ])("parses %j exactly", (input, minor) => {
    expect(parseMoney(input, "CAD")).toEqual({ amountMinor: minor, currency: "CAD" })
  })

  it("does not suffer floating-point error", () => {
    // 0.1 + 0.2 !== 0.3 in floating point; minor units are exact.
    expect(addMoney(parseMoney("0.10", "CAD"), parseMoney("0.20", "CAD")).amountMinor).toBe(30)
  })

  it.each(["", "abc", "12.345", "1,234.56", "$12", "1e3", "12.", ".5", "--1", "NaN"])(
    "rejects %j rather than guessing",
    (input) => {
      expect(() => parseMoney(input, "CAD")).toThrow(RangeError)
    },
  )

  it("rejects amounts beyond the safe integer range", () => {
    expect(() => parseMoney("99999999999999999999", "CAD")).toThrow(RangeError)
  })
})

describe("money", () => {
  it("requires integer minor units", () => {
    expect(() => money(12.5, "CAD")).toThrow(RangeError)
    expect(() => money(Number.NaN, "CAD")).toThrow(RangeError)
  })

  it("refuses to add different currencies", () => {
    expect(() => addMoney(money(100, "CAD"), money(100, "USD"))).toThrow(RangeError)
  })

  it("formats for Canadian English", () => {
    expect(formatMoney(money(123456, "CAD"))).toBe("$1,234.56")
    expect(formatMoney(money(-500, "CAD"))).toBe("-$5.00")
  })
})
