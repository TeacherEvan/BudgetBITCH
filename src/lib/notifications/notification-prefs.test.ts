// src/lib/notifications/notification-prefs.test.ts
import { expect, test, beforeEach, vi } from 'vitest';
import {
  getNotificationPrefs,
  saveNotificationPrefs,
  shouldSendEmailNotification,
  shouldSendPushNotification,
  type NotificationPrefs,
} from './notification-prefs';

beforeEach(() => {
  // Clear localStorage mock
  if (typeof localStorage !== 'undefined') {
    localStorage.clear();
  }
});

test('getNotificationPrefs returns default preferences when none saved', () => {
  const prefs = getNotificationPrefs();
  expect(prefs).toEqual({
    emailEnabled: true,
    pushEnabled: true,
    emailAddress: undefined,
    dailyReminder: true,
    thresholdAlerts: true,
    weeklyReport: false,
  });
});

test('saveNotificationPrefs persists updated preferences', () => {
  const updated: NotificationPrefs = {
    emailEnabled: true,
    pushEnabled: false,
    emailAddress: 'user@example.com',
    dailyReminder: false,
    thresholdAlerts: true,
    weeklyReport: true,
  };

  saveNotificationPrefs(updated);
  const loaded = getNotificationPrefs();
  expect(loaded).toEqual(updated);
});

test('shouldSendEmailNotification respects emailEnabled and emailAddress requirements', () => {
  const prefsNoEmail: NotificationPrefs = {
    emailEnabled: true,
    pushEnabled: true,
    emailAddress: undefined,
    dailyReminder: true,
    thresholdAlerts: true,
    weeklyReport: false,
  };
  expect(shouldSendEmailNotification(prefsNoEmail, 'thresholdAlert')).toBe(false);

  const prefsWithEmail: NotificationPrefs = {
    emailEnabled: true,
    pushEnabled: true,
    emailAddress: 'user@example.com',
    dailyReminder: true,
    thresholdAlerts: true,
    weeklyReport: false,
  };
  expect(shouldSendEmailNotification(prefsWithEmail, 'thresholdAlert')).toBe(true);

  const prefsDisabled: NotificationPrefs = {
    emailEnabled: false,
    pushEnabled: true,
    emailAddress: 'user@example.com',
    dailyReminder: true,
    thresholdAlerts: true,
    weeklyReport: false,
  };
  expect(shouldSendEmailNotification(prefsDisabled, 'thresholdAlert')).toBe(false);
});

test('shouldSendPushNotification respects pushEnabled and event toggles', () => {
  const prefsPushActive: NotificationPrefs = {
    emailEnabled: false,
    pushEnabled: true,
    emailAddress: undefined,
    dailyReminder: true,
    thresholdAlerts: true,
    weeklyReport: false,
  };
  expect(shouldSendPushNotification(prefsPushActive, 'dailyReminder')).toBe(true);

  const prefsPushDisabled: NotificationPrefs = {
    emailEnabled: false,
    pushEnabled: false,
    emailAddress: undefined,
    dailyReminder: true,
    thresholdAlerts: true,
    weeklyReport: false,
  };
  expect(shouldSendPushNotification(prefsPushDisabled, 'dailyReminder')).toBe(false);
});
