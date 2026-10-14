import { describe, it, expect } from 'vitest';
import { POST } from './route';
import type { NextRequest } from 'next/server';

function makeReq(body: unknown): NextRequest {
  return new Request('http://localhost/api/telemetry', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

describe('/api/telemetry', () => {
  it('accepts a valid structured batch and returns 204', async () => {
    const res = await POST(
      makeReq({
        logs: [
          { ts: '2026-08-02T00:00:00Z', level: 'info', event: 'sync_daily_pushed', service: 'budget-boss-web', sessionId: 's1', foo: 'bar' },
        ],
        metrics: [
          { ts: '2026-08-02T00:00:00Z', service: 'budget-boss-web', sessionId: 's1', metric: 'sync_flush_items', value: 3, unit: 'count', tags: { result: 'flushed' } },
        ],
      }),
    );
    expect(res.status).toBe(204);
  });

  it('rejects malformed JSON with 400', async () => {
    const req = new Request('http://localhost/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    }) as unknown as NextRequest;
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects an out-of-enum level with 400', async () => {
    const res = await POST(
      makeReq({
        logs: [{ ts: 'x', level: 'fatal', event: 'e', service: 's', sessionId: 's1' }],
      }),
    );
    expect(res.status).toBe(400);
  });

  it('accepts an empty batch (no logs/metrics) and returns 204', async () => {
    const res = await POST(makeReq({}));
    expect(res.status).toBe(204);
  });
});
