// components/pwa/install-prompt.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { PWAInstallPrompt } from './install-prompt';

describe('PWAInstallPrompt', () => {
  const mockOnDismiss = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnDismiss.mockClear();
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render immediately (waits for beforeinstallprompt)', () => {
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="en" />);
    
    expect(screen.queryByText('Install BudgetBITCH')).not.toBeInTheDocument();
  });

  it('shows prompt after beforeinstallprompt event fires', async () => {
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="en" />);
    
    // Fire beforeinstallprompt event
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });
    
    await act(async () => {
      window.dispatchEvent(event);
      await new Promise(r => setTimeout(r, 2100)); // Wait for 2s delay
    });
    
    await waitFor(() => {
      expect(screen.getByText('Install BudgetBITCH')).toBeInTheDocument();
    });
  });

  it('renders Thai labels when locale is th', async () => {
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="th" />);
    
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });
    
    await act(async () => {
      window.dispatchEvent(event);
      await new Promise(r => setTimeout(r, 2100));
    });
    
    await waitFor(() => {
      expect(screen.getByText('ติดตั้ง BudgetBITCH')).toBeInTheDocument();
      expect(screen.getByText('เพิ่มลงหน้าจอหลักเพื่อเข้าถึงง่ายขึ้น ทำงานออฟไลน์ได้')).toBeInTheDocument();
      expect(screen.getByText('ติดตั้ง')).toBeInTheDocument();
      expect(screen.getByText('ภายหลัง')).toBeInTheDocument();
    });
  });

  it('renders English labels when locale is en', async () => {
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="en" />);
    
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });
    
    await act(async () => {
      window.dispatchEvent(event);
      await new Promise(r => setTimeout(r, 2100));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Install BudgetBITCH')).toBeInTheDocument();
      expect(screen.getByText('Add to home screen for quick access. Works offline.')).toBeInTheDocument();
      expect(screen.getByText('Install')).toBeInTheDocument();
      expect(screen.getByText('Later')).toBeInTheDocument();
    });
  });

  it('calls onDismiss when dismiss button clicked', async () => {
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="en" />);
    
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });
    
    await act(async () => {
      window.dispatchEvent(event);
      await new Promise(r => setTimeout(r, 2100));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Install BudgetBITCH')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /later/i }));
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when X button clicked', async () => {
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="en" />);
    
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });
    
    await act(async () => {
      window.dispatchEvent(event);
      await new Promise(r => setTimeout(r, 2100));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Install BudgetBITCH')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByLabelText('Dismiss'));
    
    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });

  it('calls prompt and onDismiss when Install clicked and accepted', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'accepted' as const, platform: 'web' });
    
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="en" />);
    
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });
    
    await act(async () => {
      window.dispatchEvent(event);
      await new Promise(r => setTimeout(r, 2100));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Install BudgetBITCH')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /install/i }));
    
    await waitFor(() => {
      expect(mockPrompt).toHaveBeenCalledTimes(1);
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call onDismiss if install dismissed', async () => {
    const mockPrompt = vi.fn().mockResolvedValue(undefined);
    const mockUserChoice = Promise.resolve({ outcome: 'dismissed' as const, platform: 'web' });
    
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="en" />);
    
    const event = new Event('beforeinstallprompt');
    Object.defineProperty(event, 'prompt', { value: mockPrompt });
    Object.defineProperty(event, 'userChoice', { value: mockUserChoice });
    
    await act(async () => {
      window.dispatchEvent(event);
      await new Promise(r => setTimeout(r, 2100));
    });
    
    await waitFor(() => {
      expect(screen.getByText('Install BudgetBITCH')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByRole('button', { name: /install/i }));
    
    await waitFor(() => {
      expect(mockPrompt).toHaveBeenCalledTimes(1);
      expect(mockOnDismiss).not.toHaveBeenCalled();
    });
  });

  it('does not show if already in standalone mode', () => {
    // Mock standalone mode
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(display-mode: standalone)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="en" />);
    
    expect(screen.queryByText('Install BudgetBITCH')).not.toBeInTheDocument();
  });

  it('shows universal fallback prompt if no beforeinstallprompt event fires after timeout', async () => {
    vi.useFakeTimers();
    
    render(<PWAInstallPrompt onDismiss={mockOnDismiss} locale="en" />);
    
    // Fast-forward past the 3s delay
    await act(async () => {
      vi.advanceTimersByTime(4000);
    });
    
    expect(screen.queryByText('Install BudgetBITCH')).toBeInTheDocument();
    
    vi.useRealTimers();
  });
});