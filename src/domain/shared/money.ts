/**
 * Money as integer minor units plus an ISO 4217 currency (NFR-005). Never floating point.
 */

export const CURRENCIES = ["CAD", "USD"] as const
export type Currency = (typeof CURRENCIES)[number]

export interface Money {
  /** Integer number of cents. May be negative (e.g. a credit). */
  readonly amountMinor: number
  readonly currency: Currency
}

const DECIMAL_RE = /^(-)?(\d+)(?:\.(\d{1,2}))?$/

export function money(amountMinor: number, currency: Currency): Money {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new RangeError(
      `Money amount must be a safe integer number of minor units: ${amountMinor}`,
    )
  }
  if (!(CURRENCIES as readonly string[]).includes(currency)) {
    throw new RangeError(`Unsupported currency: ${currency}`)
  }
  return { amountMinor: amountMinor === 0 ? 0 : amountMinor, currency }
}

/**
 * Parse a plain decimal string such as "1234.5" or "-12.34" exactly.
 * Rejects (does not round) more than two decimal places, thousands separators, currency
 * symbols, exponents and empty input — ambiguous values must be handled by the importer.
 */
export function parseMoney(input: string, currency: Currency): Money {
  const match = DECIMAL_RE.exec(input.trim())
  if (!match) throw new RangeError(`Not a valid money amount: "${input}"`)
  const [, sign, whole, fraction = ""] = match
  const minor = BigInt(whole!) * 100n + BigInt(fraction.padEnd(2, "0"))
  const signed = sign ? -minor : minor
  if (signed > BigInt(Number.MAX_SAFE_INTEGER) || signed < BigInt(Number.MIN_SAFE_INTEGER)) {
    throw new RangeError(`Money amount out of range: "${input}"`)
  }
  return money(Number(signed), currency)
}

export function addMoney(a: Money, b: Money): Money {
  if (a.currency !== b.currency) {
    throw new RangeError(`Cannot add ${a.currency} and ${b.currency}`)
  }
  return money(a.amountMinor + b.amountMinor, a.currency)
}

export function formatMoney(value: Money, locale = "en-CA"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: value.currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value.amountMinor / 100)
}
