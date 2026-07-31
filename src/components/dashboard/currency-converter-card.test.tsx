// components/dashboard/currency-converter-card.test.tsx
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';

const FRANKFURTER_URL = 'https://api.frankfurter.dev/v1/latest';
const FRANKFURTER_PAYLOAD = { amount: 1, base: 'EUR', rates: { USD: 1.08, GBP: 0.85 } };

function okResponse(payload: unknown) {
  return { ok: true, json: async () => payload } as unknown as Response;
}

// The component holds a module-level rates cache with a 1 hour TTL. Reset the
// module registry before each test and re-import, so no test ever reads rates
// another test fetched.
async function loadCard() {
  const cardModule = await import('./currency-converter-card');
  return cardModule.CurrencyConverterCard;
}

describe('CurrencyConverterCard', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('converts 100 EUR to USD from the live rate feed', async () => {
    fetchMock.mockResolvedValue(okResponse(FRANKFURTER_PAYLOAD));
    const CurrencyConverterCard = await loadCard();

    const { container } = render(<CurrencyConverterCard baseCurrency="EUR" />);

    await waitFor(() => expect(screen.getByText('$108.00')).toBeInTheDocument());

    expect(fetchMock).toHaveBeenCalledWith(FRANKFURTER_URL);
    expect(container.textContent).toContain('1 EUR = 1.0800 USD');
    expect(container.textContent).toContain('Live rates · updated');
    expect(container.textContent).not.toContain('Last known rate (offline)');
  });

  it('short-circuits without a network call when both currencies match', async () => {
    fetchMock.mockResolvedValue(okResponse(FRANKFURTER_PAYLOAD));
    const CurrencyConverterCard = await loadCard();

    const { container } = render(<CurrencyConverterCard baseCurrency="EUR" amount={250} />);

    // Mount converts EUR -> USD; clear that call so the next assertion is clean.
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fetchMock.mockClear();

    fireEvent.change(screen.getByLabelText('To currency'), { target: { value: 'EUR' } });

    await waitFor(() => expect(screen.getByText('€250.00')).toBeInTheDocument());

    expect(fetchMock).not.toHaveBeenCalled();
    // An identity conversion is rate 1, so the "1 X = n Y" line stays hidden.
    expect(container.textContent).not.toMatch(/1 EUR = /);
  });

  it('falls back to the static snapshot rate when the live fetch rejects', async () => {
    fetchMock.mockRejectedValue(new Error('network unreachable'));
    const CurrencyConverterCard = await loadCard();
    const { FALLBACK_RATES } = await import('./currency-options');
    const usdPerEur = FALLBACK_RATES.USD as number;

    const { container } = render(<CurrencyConverterCard baseCurrency="EUR" />);

    await waitFor(() => expect(container.textContent).toContain('Last known rate (offline)'));

    // EUR pivot: EUR is 1, so 100 EUR -> 100 * usdPerEur.
    expect(screen.getByText(`$${(100 * usdPerEur).toFixed(2)}`)).toBeInTheDocument();
    expect(container.textContent).toContain(`1 EUR = ${usdPerEur.toFixed(4)} USD`);
    expect(container.textContent).not.toContain('Live rates · updated');
    expect(screen.queryByText('No rate available for this currency pair.')).toBeNull();
  });

  it('falls back to the static snapshot rate on a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, json: async () => ({}) } as unknown as Response);
    const CurrencyConverterCard = await loadCard();
    const { FALLBACK_RATES } = await import('./currency-options');
    const usdPerEur = FALLBACK_RATES.USD as number;

    const { container } = render(<CurrencyConverterCard baseCurrency="EUR" />);

    await waitFor(() => expect(container.textContent).toContain('Last known rate (offline)'));

    expect(screen.getByText(`$${(100 * usdPerEur).toFixed(2)}`)).toBeInTheDocument();
    expect(screen.queryByText('—')).toBeNull();
  });
});
