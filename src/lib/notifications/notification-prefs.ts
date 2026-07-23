// src/lib/notifications/notification-prefs.ts
export interface NotificationPrefs {
  emailEnabled: boolean;
  pushEnabled: boolean;
  emailAddress?: string;
  dailyReminder: boolean;
  thresholdAlerts: boolean;
  weeklyReport: boolean;
}

export type NotificationEventType = 'dailyReminder' | 'thresholdAlert' | 'weeklyReport';

const PREFS_KEY = 'bb:notificationPrefs';

const DEFAULT_PREFS: NotificationPrefs = {
  emailEnabled: true,
  pushEnabled: true,
  emailAddress: undefined,
  dailyReminder: true,
  thresholdAlerts: true,
  weeklyReport: false,
};

export function getNotificationPrefs(): NotificationPrefs {
  if (typeof localStorage === 'undefined') {
    return { ...DEFAULT_PREFS };
  }
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return { ...DEFAULT_PREFS };
    return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export function saveNotificationPrefs(prefs: NotificationPrefs): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage errors
  }
}

export function shouldSendEmailNotification(
  prefs: NotificationPrefs,
  eventType: NotificationEventType
): boolean {
  if (!prefs.emailEnabled) return false;
  if (!prefs.emailAddress || !prefs.emailAddress.trim()) return false;
  if (eventType === 'dailyReminder') return prefs.dailyReminder;
  if (eventType === 'thresholdAlert') return prefs.thresholdAlerts;
  if (eventType === 'weeklyReport') return prefs.weeklyReport;
  return false;
}

export function shouldSendPushNotification(
  prefs: NotificationPrefs,
  eventType: NotificationEventType
): boolean {
  if (!prefs.pushEnabled) return false;
  if (eventType === 'dailyReminder') return prefs.dailyReminder;
  if (eventType === 'thresholdAlert') return prefs.thresholdAlerts;
  if (eventType === 'weeklyReport') return prefs.weeklyReport;
  return false;
}
