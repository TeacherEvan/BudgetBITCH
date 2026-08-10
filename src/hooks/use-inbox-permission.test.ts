// src/hooks/use-inbox-permission.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useInboxPermission } from './use-inbox-permission';

describe('useInboxPermission hook', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('defaults to prompt status and not remembered', () => {
    const { result } = renderHook(() => useInboxPermission());
    expect(result.current.status).toBe('prompt');
    expect(result.current.remembered).toBe(false);
  });

  it('grants permission without remembering', () => {
    const { result } = renderHook(() => useInboxPermission());
    act(() => {
      result.current.grantPermission(false);
    });
    expect(result.current.status).toBe('granted');
    expect(result.current.remembered).toBe(false);
    expect(localStorage.getItem('bb-inbox-permission')).toBeNull();
  });

  it('grants permission and remembers choice in localStorage', () => {
    const { result } = renderHook(() => useInboxPermission());
    act(() => {
      result.current.grantPermission(true);
    });
    expect(result.current.status).toBe('granted');
    expect(result.current.remembered).toBe(true);
    expect(localStorage.getItem('bb-inbox-permission')).toContain('"status":"granted"');
    expect(localStorage.getItem('bb-inbox-permission')).toContain('"remembered":true');
  });

  it('denies permission and remembers choice in localStorage', () => {
    const { result } = renderHook(() => useInboxPermission());
    act(() => {
      result.current.denyPermission(true);
    });
    expect(result.current.status).toBe('denied');
    expect(result.current.remembered).toBe(true);
    expect(localStorage.getItem('bb-inbox-permission')).toContain('"status":"denied"');
  });

  it('resets permission state', () => {
    const { result } = renderHook(() => useInboxPermission());
    act(() => {
      result.current.grantPermission(true);
    });
    expect(result.current.status).toBe('granted');

    act(() => {
      result.current.resetPermission();
    });
    expect(result.current.status).toBe('prompt');
    expect(result.current.remembered).toBe(false);
    expect(localStorage.getItem('bb-inbox-permission')).toBeNull();
  });
});
