// src/hooks/use-inbox-permission.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

const PERMISSION_KEY = 'bb-inbox-permission';

export type InboxPermissionStatus = 'granted' | 'denied' | 'prompt';

export interface InboxPermissionState {
  status: InboxPermissionStatus;
  remembered: boolean;
}

export function useInboxPermission() {
  const [permissionState, setPermissionState] = useState<InboxPermissionState>(() => {
    if (typeof window === 'undefined') {
      return { status: 'prompt', remembered: false };
    }
    try {
      const stored = localStorage.getItem(PERMISSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.status === 'string') {
          return {
            status: parsed.status as InboxPermissionStatus,
            remembered: Boolean(parsed.remembered),
          };
        }
      }
    } catch {
      // Fallback on error
    }
    return { status: 'prompt', remembered: false };
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(PERMISSION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && typeof parsed.status === 'string') {
          setPermissionState({
            status: parsed.status as InboxPermissionStatus,
            remembered: Boolean(parsed.remembered),
          });
        }
      }
    } catch {
      // Keep initial state
    }
  }, []);

  const grantPermission = useCallback((remember: boolean) => {
    const newState: InboxPermissionState = { status: 'granted', remembered: remember };
    setPermissionState(newState);
    if (remember && typeof window !== 'undefined') {
      try {
        localStorage.setItem(PERMISSION_KEY, JSON.stringify(newState));
      } catch {
        // Storage full or restricted
      }
    }
  }, []);

  const denyPermission = useCallback((remember: boolean) => {
    const newState: InboxPermissionState = { status: 'denied', remembered: remember };
    setPermissionState(newState);
    if (remember && typeof window !== 'undefined') {
      try {
        localStorage.setItem(PERMISSION_KEY, JSON.stringify(newState));
      } catch {
        // Storage full or restricted
      }
    }
  }, []);

  const resetPermission = useCallback(() => {
    const newState: InboxPermissionState = { status: 'prompt', remembered: false };
    setPermissionState(newState);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(PERMISSION_KEY);
      } catch {
        // Ignore errors
      }
    }
  }, []);

  return {
    status: permissionState.status,
    remembered: permissionState.remembered,
    grantPermission,
    denyPermission,
    resetPermission,
  };
}
