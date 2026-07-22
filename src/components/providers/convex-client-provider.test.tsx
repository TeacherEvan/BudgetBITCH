import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { ConvexClientProvider } from './convex-client-provider';

let capturedStorage: Storage | undefined;

vi.mock('convex/react', () => ({
  ConvexReactClient: class {
    constructor() {}
  },
}));

vi.mock('@convex-dev/auth/react', () => ({
  ConvexAuthProvider: (props: { children: React.ReactNode; storage?: Storage }) => {
    capturedStorage = props.storage;
    return <div>children</div>;
  },
}));

describe('ConvexClientProvider', () => {
  it('forwards a sanitized storage that hides dummy refresh tokens but allows real later reads through', () => {
    const reads: string[] = [];
    const writes: string[] = [];
    const originalLocalStorage = window.localStorage;
    const nativeStorage = {
      getItem(key: string) {
        reads.push(key);
        return originalLocalStorage.getItem(key);
      },
      setItem(key: string, value: string) {
        writes.push(key);
        originalLocalStorage.setItem(key, value);
      },
      removeItem(key: string) {
        originalLocalStorage.removeItem(key);
      },
      get length() {
        return originalLocalStorage.length;
      },
      clear() {
        originalLocalStorage.clear();
      },
      key(index: number) {
        return originalLocalStorage.key(index);
      },
    } as unknown as Storage;

    Object.defineProperty(window, 'localStorage', {
      value: nativeStorage,
      writable: true,
    });

    capturedStorage = undefined;
    render(
      <ConvexClientProvider>
        <span>child</span>
      </ConvexClientProvider>,
    );

    const storage = capturedStorage as Storage;
    expect(storage).toBeDefined();

    window.localStorage.setItem('__convexAuthRefreshToken', 'dummy');
    window.localStorage.setItem('__convexAuthRefreshToken_httpsquietllama123convexcloud', 'dummy');
    window.localStorage.setItem('budgetbitch:theme', 'dark');

    expect(storage.getItem('__convexAuthRefreshToken')).toBeNull();
    expect(storage.getItem('__convexAuthRefreshToken_httpsquietllama123convexcloud')).toBeNull();
    expect(storage.getItem('budgetbitch:theme')).toBe('dark');

    expect(reads).toContain('__convexAuthRefreshToken');
    expect(reads).toContain('__convexAuthRefreshToken_httpsquietllama123convexcloud');

    storage.setItem('__convexAuthRefreshToken_httpsquietllama123convexcloud', 'dummy');
    expect(storage.getItem('__convexAuthRefreshToken_httpsquietllama123convexcloud')).toBeNull();
  });
});

