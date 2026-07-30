// components/pwa/install-prompt.test.tsx
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PWAInstallPrompt } from './install-prompt';

describe('PWAInstallPrompt', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders nothing by default if not standalone and no install prompt event', () => {
    const { container } = render(<PWAInstallPrompt />);
    expect(container.firstChild).toBeNull();
  });

  it('renders install prompt when beforeinstallprompt event is fired', () => {
    render(<PWAInstallPrompt locale="en" />);

    const event = new Event('beforeinstallprompt');
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });

    act(() => {
      fireEvent(window, event);
    });

    expect(screen.getByTestId('pwa-install-prompt')).toBeInTheDocument();
    expect(screen.getByText('Install BudgetBITCH')).toBeInTheDocument();
  });

  it('renders Thai copy when locale=th', () => {
    render(<PWAInstallPrompt locale="th" />);

    const event = new Event('beforeinstallprompt');
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });

    act(() => {
      fireEvent(window, event);
    });

    expect(screen.getByText('ติดตั้ง BudgetBITCH')).toBeInTheDocument();
  });

  it('dismisses prompt when close button is clicked and remembers choice', () => {
    render(<PWAInstallPrompt locale="en" />);

    const event = new Event('beforeinstallprompt');
    Object.assign(event, {
      prompt: vi.fn().mockResolvedValue(undefined),
      userChoice: Promise.resolve({ outcome: 'accepted' }),
    });

    act(() => {
      fireEvent(window, event);
    });

    const dismissBtn = screen.getByRole('button', { name: 'Not Now' });
    act(() => {
      fireEvent.click(dismissBtn);
    });

    expect(screen.queryByTestId('pwa-install-prompt')).not.toBeInTheDocument();
    expect(localStorage.getItem('budgetbitch:installPromptDismissed')).toBe('1');
  });
});