// lib/utils/action-logger.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { logUserAction, getUserActionLogs, clearUserActionLogs } from './action-logger';

describe('action-logger utility', () => {
  beforeEach(() => {
    clearUserActionLogs();
  });

  it('logs user actions and retrieves them', () => {
    logUserAction('Opened Dashboard');
    logUserAction('Clicked Add Income');

    const logs = getUserActionLogs();
    expect(logs).toHaveLength(2);
    expect(logs[0]).toContain('Opened Dashboard');
    expect(logs[1]).toContain('Clicked Add Income');
  });

  it('maintains a maximum ring buffer of 20 action logs', () => {
    for (let i = 1; i <= 25; i++) {
      logUserAction(`Action ${i}`);
    }

    const logs = getUserActionLogs();
    expect(logs).toHaveLength(20);
    expect(logs[0]).toContain('Action 6');
    expect(logs[19]).toContain('Action 25');
  });
});
