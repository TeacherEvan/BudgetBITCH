// components/pwa/push-permission.test.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PushPermission } from './push-permission';

function mockPushManager() {
  const sub = {
    endpoint: 'https://push.example.com/abc',
    toJSON: () => ({ endpoint: 'https://push.example.com/abc', keys: { p256dh: 'p', auth: 'a' } }),
  };
  (window as any).Notification = { permission: 'default', requestPermission: vi.fn().mockResolvedValue('granted') };
  (window as any).PushManager = class {
    static subscribe = vi.fn().mockResolvedValue(sub);
  };
  (navigator as any).serviceWorker = {
    ready: Promise.resolve({ pushManager: (window as any).PushManager }),
  };
}

const ORIGINAL_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

describe('PushPermission', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40yV4nwu1vH1J8mQ4N_zE1h8L5d9a';
    mockPushManager();
  });
  afterEach(() => {
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = ORIGINAL_VAPID_KEY;
    delete (window as any).Notification;
    delete (window as any).PushManager;
    delete (navigator as any).serviceWorker;
    vi.restoreAllMocks();
  });

  it('requests permission and subscribes when "Allow" is clicked', async () => {
    const onSubscribe = vi.fn().mockResolvedValue('id-1');
    const onClose = vi.fn();
    render(<PushPermission locale="en" onSubscribe={onSubscribe} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('push-allow-btn'));

    await waitFor(() => expect((window as any).Notification.requestPermission).toHaveBeenCalled());
    await waitFor(() => expect(onSubscribe).toHaveBeenCalledWith({
      endpoint: 'https://push.example.com/abc',
      keys: { p256dh: 'p', auth: 'a' },
    }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('does not subscribe when permission denied', async () => {
    (window as any).Notification.requestPermission = vi.fn().mockResolvedValue('denied');
    const onSubscribe = vi.fn();
    const onClose = vi.fn();
    render(<PushPermission locale="en" onSubscribe={onSubscribe} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('push-allow-btn'));
    await waitFor(() => expect((window as any).Notification.requestPermission).toHaveBeenCalled());
    await new Promise((r) => setTimeout(r, 20));
    expect(onSubscribe).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('renders "Later" to dismiss without subscribing', () => {
    const onSubscribe = vi.fn();
    const onClose = vi.fn();
    render(<PushPermission locale="en" onSubscribe={onSubscribe} onClose={onClose} />);
    fireEvent.click(screen.getByTestId('push-later-btn'));
    expect(onSubscribe).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('supports Thai locale labels', () => {
    render(<PushPermission locale="th" onSubscribe={() => {}} onClose={() => {}} />);
    expect(screen.getByTestId('push-allow-btn')).toHaveTextContent('อนุญาต');
  });

  it('displays error when VAPID key is not configured', async () => {
    delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const onSubscribe = vi.fn();
    const onClose = vi.fn();
    render(<PushPermission locale="en" onSubscribe={onSubscribe} onClose={onClose} />);

    fireEvent.click(screen.getByTestId('push-allow-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('push-error')).toHaveTextContent(
        'Push notifications key (VAPID) is not configured.'
      );
    });
    expect(onSubscribe).not.toHaveBeenCalled();
  });
});
