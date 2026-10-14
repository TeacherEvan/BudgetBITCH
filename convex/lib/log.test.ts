import { describe, it, expect, vi } from 'vitest';
import { clog, clogError, clogMetric, genTraceId } from './log';

describe('convex/lib/log', () => {
  it('emits a structured JSON line on the matching console level', () => {
    const calls: { level: string; line: string }[] = [];
    vi.stubGlobal('console', {
      log: (s: string) => calls.push({ level: 'log', line: s }),
      error: (s: string) => calls.push({ level: 'error', line: s }),
      warn: (s: string) => calls.push({ level: 'warn', line: s }),
      debug: (s: string) => calls.push({ level: 'debug', line: s }),
      info: (s: string) => calls.push({ level: 'log', line: s }),
    });

    clog('info', 'snapshot_upserted', { userId: 'u1', date: '2026-08-02' });
    clogError('line_receipt_parse_failed', new Error('boom'), { traceId: 't1' });
    clogMetric('line_receipt_parse_ms', 123, 'ms', { source: 'line' });

    vi.unstubAllGlobals();

    const logCalls = calls.filter((c) => c.level === 'log');
    const errCalls = calls.filter((c) => c.level === 'error');
    expect(logCalls.length).toBe(2);
    expect(errCalls.length).toBe(1);

    const infoLine = JSON.parse(logCalls[0].line);
    expect(infoLine.event).toBe('snapshot_upserted');
    expect(infoLine.service).toBe('budget-boss-convex');
    expect(infoLine.userId).toBe('u1');

    const errLine = JSON.parse(errCalls[0].line);
    expect(errLine.event).toBe('line_receipt_parse_failed');
    expect(errLine.errorName).toBe('Error');
    expect(errLine.errorMessage).toBe('boom');
    expect(errLine.traceId).toBe('t1');

    const metricLine = JSON.parse(logCalls[1].line);
    expect(metricLine.kind).toBe('metric');
    expect(metricLine.metric).toBe('line_receipt_parse_ms');
    expect(metricLine.value).toBe(123);
    expect(metricLine.unit).toBe('ms');
  });

  it('genTraceId returns a non-empty string', () => {
    const id = genTraceId();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });
});
