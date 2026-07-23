// components/pwa/push-gate.test.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PushGate } from './push-gate';

vi.mock('convex/react', () => ({
  useMutation: () => vi.fn().mockResolvedValue('sub-id'),
}));

function mockPush() {
  const sub = {
    endpoint: 'https://push.example.com/abc',
    toJSON: () => ({ endpoint: 'https://push.example.com/abc', keys: { p256dh: 'p', auth: 'a' } }),
  };
  (window as any).Notification = { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') };
  (window as any).PushManager = class { static subscribe = vi.fn().mockResolvedValue(sub); };
  (navigator as any).serviceWorker = { ready: Promise.resolve({ pushManager: (window as any).PushManager }) };
}

const ORIGINAL_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

describe('PushGate', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40yV4nwu1vH1J8mQ4N_zE1h8L5d9a';
    mockPush();
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = ORIGINAL_VAPID_KEY;
    delete (window as any).Notification;
    delete (window as any).PushManager;
    delete (navigator as any).serviceWorker;
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('does not prompt when authenticated=false', () => {
    render(<PushGate locale="en" isAuthenticated={false} />);
    expect(screen.queryByTestId('push-permission')).toBeNull();
  });

  it('prompts once when authenticated, then never again after allowing', async () => {
    render(<PushGate locale="en" isAuthenticated={true} />);
    await waitFor(() => expect(screen.getByTestId('push-permission')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('push-allow-btn'));
    await waitFor(() => expect(screen.queryByTestId('push-permission')).toBeNull());

    // Re-mount: should not prompt again (stored flag)
    render(<PushGate locale="en" isAuthenticated={true} />);
    expect(screen.queryByTestId('push-permission')).toBeNull();
  });

  it('does not prompt if user already subscribed (flag set)', () => {
    localStorage.setItem('budgetbitch:pushAsked', '1');
    render(<PushGate locale="en" isAuthenticated={true} />);
    expect(screen.queryByTestId('push-permission')).toBeNull();
  });
});
