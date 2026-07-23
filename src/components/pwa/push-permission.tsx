// components/pwa/push-permission.tsx
'use client';

import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';

const LABELS = {
  th: {
    title: 'เปิดการแจ้งเตือน?',
    body: 'รับการแจ้งเตือนงบประจำวันและการเตือน',
    allow: 'อนุญาต',
    later: 'ไว้ทีหลัง',
  },
  en: {
    title: 'Enable notifications?',
    body: 'Get budget alerts and daily reminders',
    allow: 'Allow',
    later: 'Later',
  },
} as const;

interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

interface PushPermissionProps {
  locale: 'th' | 'en';
  onSubscribe: (subscription: PushSubscriptionInput) => void | Promise<void>;
  onClose: () => void;
}

export function PushPermission({ locale, onSubscribe, onClose }: PushPermissionProps) {
  const l = LABELS[locale];
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length) as Uint8Array<ArrayBuffer>;
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

  const handleAllow = async () => {
    if (busy) return;
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator)) {
      setError('Notifications are not supported on this device.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const permission = await window.Notification.requestPermission();
      if (permission !== 'granted') {
        onClose();
        return;
      }

      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey || !vapidPublicKey.trim()) {
        setError('Push notifications key (VAPID) is not configured.');
        return;
      }

      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey.trim());
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey,
      });
      const raw = sub.toJSON() as PushSubscriptionInput;
      await onSubscribe({
        endpoint: raw.endpoint,
        keys: raw.keys,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="mx-auto w-full max-w-md rounded-2xl border border-[rgba(201,150,12,0.25)] bg-black/60 p-5 backdrop-blur-xl"
      data-testid="push-permission"
      role="dialog"
      aria-label={l.title}
    >
      <div className="mb-3 flex items-center gap-2">
        <Bell className="h-5 w-5 text-[#E8B020]" />
        <h2 className="text-sm font-bold uppercase tracking-widest text-[#C9960C]">{l.title}</h2>
      </div>
      <p className="mb-4 text-sm text-white/60">{l.body}</p>

      {error && (
        <p className="mb-3 text-xs text-rose-400" data-testid="push-error">{error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          data-testid="push-later-btn"
          onClick={onClose}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 py-2.5 text-xs font-bold text-white/70 transition-colors hover:bg-white/10"
        >
          <BellOff className="h-4 w-4" /> {l.later}
        </button>
        <button
          type="button"
          data-testid="push-allow-btn"
          disabled={busy}
          onClick={handleAllow}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#C9960C] py-2.5 text-xs font-bold text-[#080600] transition-colors hover:bg-[#F5D742] disabled:opacity-40"
        >
          <Bell className="h-4 w-4" /> {l.allow}
        </button>
      </div>
    </div>
  );
}
