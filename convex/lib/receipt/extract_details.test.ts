import { describe, expect, test } from 'vitest'
import { loadAllFixtures } from '../../../tests/fixtures/receipts'
import { detectCurrency, extractLineItems, extractTax } from './extract_details'
import { normalisePayload } from './normalise'

describe('Line items, tax, and currency extractors', () => {
  test('extracts tax from ZA receipt (VAT 15%)', async () => {
    const fixtures = await loadAllFixtures()
    const checkers = fixtures.find((f) => f.id === 'za-checkers-basic')!
    const norm = normalisePayload(checkers.payload)

    const tax = extractTax(norm)
    expect(tax).toBeDefined()
    expect(tax?.value).toBe(7.04)
  })

  test('detects currency from glyphs and currencyHint', async () => {
    const fixtures = await loadAllFixtures()
    const checkers = fixtures.find((f) => f.id === 'za-checkers-basic')!
    const normCheckers = normalisePayload(checkers.payload)
    expect(detectCurrency(normCheckers)?.value).toBe('ZAR')

    const seven = fixtures.find((f) => f.id === 'th-7eleven-basic')!
    const normSeven = normalisePayload(seven.payload)
    expect(detectCurrency(normSeven)?.value).toBe('THB')
  })

  test('extracts line items above subtotal/total line', async () => {
    const fixtures = await loadAllFixtures()
    const checkers = fixtures.find((f) => f.id === 'za-checkers-basic')!
    const norm = normalisePayload(checkers.payload)

    const items = extractLineItems(norm)
    expect(items.length).toBeGreaterThanOrEqual(2)
    expect(items[0].description).toContain('MILK')
    expect(items[0].amount).toBe(34.99)
  })

  test('extracts qty and unit_price when present', async () => {
    const fixtures = await loadAllFixtures()
    const checkers = fixtures.find((f) => f.id === 'za-checkers-basic')!
    const norm = normalisePayload(checkers.payload)

    const items = extractLineItems(norm)
    // If qty/unit_price patterns exist, they should be parsed
    for (const item of items) {
      expect(item).toHaveProperty('description')
      expect(item).toHaveProperty('amount')
      // qty and unit_price are optional
      if (item.qty !== undefined) expect(typeof item.qty).toBe('number')
      if (item.unit_price !== undefined) expect(typeof item.unit_price).toBe('number')
    }
  })

  // Guards regression: QTY_UNIT_PATTERN's price groups were `\d+(?:[.,]\d{2})?`,
  // which stopped at the `28,00` prefix of `28,000`. The `=` then failed to line
  // up and the whole qty/unit_price pair was dropped on every grouped-thousands
  // receipt. The groups now span the full grouped number and the values are
  // re-read through parseAmounts.
  test('reads qty x unit_price = total with grouped thousands', () => {
    const norm = normalisePayload({
      lines: [
        { text: 'WARUNG NUSANTARA', conf: 90, y: 0, words: [] },
        { text: 'NASI GORENG 2 x 28,000 = 56,000', conf: 90, y: 100, words: [] },
        { text: 'TOTAL 56,000', conf: 90, y: 200, words: [] },
      ],
      width: 1024,
      height: 400,
      lang: 'en',
      engine: 'gemini-vision@1',
      capturedAt: 1760000000000,
    })

    const item = extractLineItems(norm).find((i) => i.description.includes('NASI'))
    expect(item).toBeDefined()
    expect(item?.qty).toBe(2)
    expect(item?.unit_price).toBe(28000)
  })
})
