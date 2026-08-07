import { describe, it, expect, vi, beforeEach } from 'vitest';

// Capacitor resolves the platform at module-load from `window.androidBridge`
// / `window.webkit.messageHandlers.bridge`. On the web neither exists, so the
// helpers must report 'web' and never throw.
describe('native detection helpers', () => {
  beforeEach(() => {
    // Reset any simulated native bridge between tests.
    vi.unstubAllGlobals();
    delete (window as unknown as Record<string, unknown>).androidBridge;
    delete (window as unknown as Record<string, unknown>).webkit;
  });

  it('reports web platform when not native', async () => {
    vi.resetModules();
    const { getPlatform, isNative, isAndroid, isIOS } = await import('./native');
    expect(isNative()).toBe(false);
    expect(getPlatform()).toBe('web');
    expect(isAndroid()).toBe(false);
    expect(isIOS()).toBe(false);
  });

  it('nativeFileUrl passes through on web', async () => {
    vi.resetModules();
    const { nativeFileUrl } = await import('./native');
    expect(nativeFileUrl('file:///tmp/photo.jpg')).toBe('file:///tmp/photo.jpg');
  });

  it('detects android when the android bridge is present', async () => {
    (window as unknown as { androidBridge: unknown }).androidBridge = true;
    vi.resetModules();
    const { getPlatform, isAndroid, isIOS } = await import('./native');
    expect(getPlatform()).toBe('android');
    expect(isAndroid()).toBe(true);
    expect(isIOS()).toBe(false);
  });
});
