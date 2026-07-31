// components/dashboard/currency-converter-card.tsx
'use client';

import { useState, useCallback, useEffect } from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';
import type { CurrencyCode } from '@/lib/utils/currency';
import { CURRENCY_SELECT_OPTIONS } from './currency-options';

interface CurrencyConverterCardProps {
  baseCurrency: CurrencyCode;
  amount?: number;
}

interface Rates {
  // rates relative to EUR (frankfurter.app format)
  [code: string]: number;
}

// Canonical Frankfurter endpoint (api.frankfurter.app now 301-redirects here).
const FRANKFURTER = 'https://api.frankfurter.dev/v1/latest';

// In-memory cache so repeated refreshes don't hammer the API.
let ratesCache: { ts: number; rates: Rates } | null = null;
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export function CurrencyConverterCard({ baseCurrency, amount = 100 }: CurrencyConverterCardProps) {
  const [from, setFrom] = useState<CurrencyCode>(baseCurrency);
  const [to, setTo] = useState<CurrencyCode>(baseCurrency === 'EUR' ? 'USD' : 'EUR');
  const [value, setValue] = useState<string>(String(amount));
  const [result, setResult] = useState<number | null>(null);
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);

  const fetchRates = useCallback(async (): Promise<Rates> => {
    const now = Date.now();
    if (ratesCache && now - ratesCache.ts < CACHE_TTL) return ratesCache.rates;
    const res = await fetch(FRANKFURTER);
    if (!res.ok) throw new Error('rate fetch failed');
    const data = (await res.json()) as { rates: Rates };
    // frankfurter rates are relative to EUR; include EUR = 1.
    const rates: Rates = { EUR: 1, ...data.rates };
    ratesCache = { ts: now, rates };
    return rates;
  }, []);

  const convert = useCallback(async () => {
    if (from === to) {
      setResult(Number(value) || 0);
      setRate(1);
      setUpdatedAt(Date.now());
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const rates = await fetchRates();
      const f = rates[from];
      const t = rates[to];
      if (!f || !t) throw new Error('unsupported pair');
      // value in EUR, then to target
      const inEur = (Number(value) || 0) / f;
      const converted = inEur * t;
      setResult(converted);
      setRate(t / f);
      setUpdatedAt(Date.now());
    } catch {
      setError('Could not fetch live rates. Try again.');
      setResult(null);
      setRate(null);
    } finally {
      setLoading(false);
    }
  }, [from, to, value, fetchRates]);

  // Convert on mount and whenever the inputs change, so the card is never
  // stuck showing an em-dash until the user manually hits Update.
  useEffect(() => {
    void convert();
  }, [convert]);

  const fmt = (n: number, code: CurrencyCode) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: code, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="rounded-2xl border border-[var(--gold-border-soft)] bg-[var(--bg-surface-1)] p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">{'Currency Converter'}</h3>
        <button
          type="button"
          onClick={convert}
          disabled={loading}
          aria-label="Refresh conversion"
          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white/70 transition-colors hover:text-white disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          {'Update'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            min="0"
            onChange={(e) => setValue(e.target.value)}
            className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white focus:border-[var(--gold-bright)] focus:outline-none"
            aria-label="Amount"
          />
          <select
            value={from}
            onChange={(e) => setFrom(e.target.value as CurrencyCode)}
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white focus:border-[var(--gold-bright)] focus:outline-none"
            aria-label="From currency"
          >
            {CURRENCY_SELECT_OPTIONS.map((o) => (
              <option key={o.code} value={o.code} className="bg-[#0d0a02]">
                {o.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-center text-white/40">
          <ArrowRight className="h-4 w-4" />
        </div>

        <div className="flex items-center gap-2">
          <div className="w-24 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white/80">
            {result === null ? '—' : fmt(result, to)}
          </div>
          <select
            value={to}
            onChange={(e) => setTo(e.target.value as CurrencyCode)}
            className="flex-1 rounded-lg border border-white/10 bg-black/30 px-2 py-2 text-sm text-white focus:border-[var(--gold-bright)] focus:outline-none"
            aria-label="To currency"
          >
            {CURRENCY_SELECT_OPTIONS.map((o) => (
              <option key={o.code} value={o.code} className="bg-[#0d0a02]">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rate !== null && from !== to && (
        <p className="mt-3 text-xs text-white/50">
          {'1 '}
          {from}
          {' = '}
          {rate.toFixed(4)}
          {' '}
          {to}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      {updatedAt && !error && (
        <p className="mt-1 text-[10px] text-white/30">
          {'Live rates · updated '}
          {new Date(updatedAt).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}
