// components/pwa/push-gate.tsx
'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { PushPermission } from './push-permission';

const ASKED_KEY = 'budgetbitch:pushAsked';

interface PushGateProps {
  locale: 'th' | 'en';
  isAuthenticated: boolean;
}

/**
 * One-time push permission prompt, gated behind authentication so we never
 * ask anonymous visitors. Once the user answers (allow or later), we set a
 * local flag and never prompt again this device.
 */
export function PushGate({ locale, isAuthenticated }: PushGateProps) {
  const [asked, setAsked] = useState(() => {
    if (typeof localStorage === 'undefined') return true;
    return localStorage.getItem(ASKED_KEY) === '1';
  });
  const subscribe = useMutation(api.push.subscribe);

  if (!isAuthenticated || asked) return null;

  const close = () => {
    try {
      localStorage.setItem(ASKED_KEY, '1');
    } catch {
      // ignore
    }
    setAsked(true);
  };

  return (
    <div className="fixed inset-x-4 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] z-[55] flex justify-center p-0 sm:bottom-6 sm:right-6 sm:left-auto sm:w-auto">
      <PushPermission
        locale={locale}
        onSubscribe={async (subscription) => {
          await subscribe({ subscription });
        }}
        onClose={close}
      />
    </div>
  );
}
