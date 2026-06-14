import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Confetti } from './confetti';
import { ThemeProvider } from '@/components/providers/theme-provider';

const renderWithProvider = (component: React.ReactNode) => render(<ThemeProvider>{component}</ThemeProvider>);

const mockMatchMedia = vi.fn().mockReturnValue({
  matches: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
});

const mockCtx = {
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillRect: vi.fn(),
  fillStyle: '',
};

beforeAll(() => {
  vi.stubGlobal('matchMedia', mockMatchMedia);
  // Mock canvas getContext
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx);
});

describe('Confetti', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockMatchMedia.mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    mockCtx.clearRect.mockClear();
    mockCtx.save.mockClear();
    mockCtx.restore.mockClear();
    mockCtx.translate.mockClear();
    mockCtx.rotate.mockClear();
    mockCtx.fillRect.mockClear();
  });

  it('renders canvas when active', () => {
    renderWithProvider(<Confetti isActive={true} duration={100} />);
    expect(screen.getByTestId('confetti-canvas')).toBeInTheDocument();
  });

  it('does not render when inactive', () => {
    renderWithProvider(<Confetti isActive={false} />);
    expect(screen.queryByTestId('confetti-canvas')).not.toBeInTheDocument();
  });

  it('calls onComplete callback after duration', async () => {
    const onComplete = vi.fn();
    renderWithProvider(<Confetti isActive={true} duration={50} onComplete={onComplete} />);
    await waitFor(() => expect(onComplete).toHaveBeenCalled(), { timeout: 200 });
  });
});