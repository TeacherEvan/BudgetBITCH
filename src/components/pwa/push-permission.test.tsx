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

describe('PushPermission', () => {
  beforeEach(() => mockPushManager());
  afterEach(() => {
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
});
