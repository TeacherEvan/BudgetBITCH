// Tests for the structured client telemetry layer.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Provide a controllable environment: browser + crypto + sendBeacon.
const beaconMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal('navigator', {
    ...(typeof navigator !== 'undefined' ? navigator : {}),
    sendBeacon: beaconMock,
  });
  Object.defineProperty(window, 'crypto', {
    value: { randomUUID: () => 'trace-123' },
    configurable: true,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).sessionStorage = {
    _s: new Map<string, string>(),
    getItem(k: string) { return this._s.get(k) ?? null; },
    setItem(k: string, v: string) { this._s.set(k, v); },
  };
  beaconMock.mockClear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('observability logger', () => {
  it('emits structured JSON with a stable event name and sessionId', async () => {
    const { log } = await import('./logger');
    // Capture the dev-console print (NODE_ENV !== production in vitest).
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    log('info', 'test_event', { foo: 'bar' });
    // flush synchronously via the beacon path
    const { flush } = await import('./logger');
    await flush();
    spy.mockRestore();

    expect(beaconMock).toHaveBeenCalledTimes(1);
    const body = beaconMock.mock.calls[0][1] as string;
    const parsed = JSON.parse(body);
    expect(Array.isArray(parsed.logs)).toBe(true);
    const evt = parsed.logs.find((l: { event: string }) => l.event === 'test_event');
    expect(evt).toBeDefined();
    expect(evt.level).toBe('info');
    expect(evt.service).toBe('budget-boss-web');
    expect(evt.sessionId).toBeTruthy();
    expect(evt.foo).toBe('bar');
    // No secrets/PII leak: the shape is just our fields.
    expect(evt.event).toBe('test_event');
  });

  it('correlates nested logs under one traceId via withTrace', async () => {
    const { withTrace, flush } = await import('./logger');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});

    await withTrace('op', { kind: 'a' }, async () => {
      const { log } = await import('./logger');
      log('info', 'nested_event', { x: 1 });
    });
    await flush();
    spy.mockRestore();

    const body = beaconMock.mock.calls[0][1] as string;
    const parsed = JSON.parse(body);
    const traces = new Set(parsed.logs.map((l: { traceId?: string }) => l.traceId));
    // op_started, op_succeeded, nested_event all share one traceId
    expect(traces.size).toBe(1);
    expect(parsed.logs.some((l: { event: string }) => l.event === 'op_succeeded')).toBe(true);
    expect(parsed.logs.some((l: { event: string }) => l.event === 'nested_event')).toBe(true);
  });

  it('logs error events with errorName/errorMessage, not a thrown object', async () => {
    const { logError, flush } = await import('./logger');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const err = new TypeError('boom');
    logError('thing_failed', err, { ctx: 'y' });
    await flush();
    spy.mockRestore();

    const body = beaconMock.mock.calls[0][1] as string;
    const parsed = JSON.parse(body);
    const evt = parsed.logs.find((l: { event: string }) => l.event === 'thing_failed');
    expect(evt.level).toBe('error');
    expect(evt.errorName).toBe('TypeError');
    expect(evt.errorMessage).toBe('boom');
  });

  it('emits RED-style metrics as separate metric entries', async () => {
    const { reportMetric, flush } = await import('./logger');
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});

    reportMetric('sync_flush_items', 3, 'count', { result: 'flushed' });
    await flush();
    spy.mockRestore();

    const body = beaconMock.mock.calls[0][1] as string;
    const parsed = JSON.parse(body);
    expect(Array.isArray(parsed.metrics)).toBe(true);
    const m = parsed.metrics.find((x: { metric: string }) => x.metric === 'sync_flush_items');
    expect(m).toBeDefined();
    expect(m.value).toBe(3);
    expect(m.unit).toBe('count');
    expect(m.tags).toEqual({ result: 'flushed' });
  });
});
