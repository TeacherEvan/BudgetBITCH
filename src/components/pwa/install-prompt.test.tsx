// components/pwa/install-prompt.test.tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { PWAInstallPrompt } from './install-prompt';

describe('PWAInstallPrompt (Feature Removed)', () => {
  it('renders nothing (null)', () => {
    const { container } = render(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });
});