// src/components/dashboard/animated-feed-list.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { AnimatedFeedList } from '@/components/dashboard/animated-feed-list';
import { useVicinityFeeds } from '@/hooks/use-vicinity-feeds';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the hook
vi.mock('@/hooks/use-vicinity-feeds');
// Mock Lottie properly - default export is the Lottie component
vi.mock('lottie-react', () => ({
  __esModule: true,
  default: ({ animationData, ...props }: any) => (
    <div data-testid="lottie-animation" {...props} />
  ),
  Lottie: ({ animationData, ...props }: any) => (
    <div data-testid="lottie-animation" {...props} />
  ),
  LottiePlayer: () => null,
  useLottie: () => null,
  useLottieInteractivity: () => null,
}));

describe('AnimatedFeedList', () => {
  const mockItems = [
    { title: 'News 1', link: 'https://a.com', pubDate: new Date().toISOString(), source: 'Test', category: 'finance', locale: 'th', actionable: 'Tip 1' },
    { title: 'News 2', link: 'https://b.com', pubDate: new Date().toISOString(), source: 'Test', category: 'fuel', locale: 'th' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders feed cards with success state', async () => {
    (useVicinityFeeds as vi.Mock).mockReturnValue({
      items: mockItems,
      loading: false,
      error: null,
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<AnimatedFeedList locale="th" />);

    await waitFor(() => {
      expect(screen.getByText('News 1')).toBeInTheDocument();
      expect(screen.getByText('News 2')).toBeInTheDocument();
    });

    // Should have category badges (Thai labels)
    expect(screen.getByText('การเงิน')).toBeInTheDocument();
    expect(screen.getByText('น้ำมัน')).toBeInTheDocument();
  });

  it('shows empty state for no location', () => {
    (useVicinityFeeds as vi.Mock).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      lastUpdated: null,
      refresh: vi.fn(),
    });

    render(<AnimatedFeedList locale="en" />);

    expect(screen.getByText('Enable Location')).toBeInTheDocument();
  });

  it('shows empty state for no items after fetch', () => {
    (useVicinityFeeds as vi.Mock).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<AnimatedFeedList locale="en" />);

    expect(screen.getByText('No local updates yet')).toBeInTheDocument();
  });

  it('shows error state with retry button', () => {
    (useVicinityFeeds as vi.Mock).mockReturnValue({
      items: [],
      loading: false,
      error: 'Failed to load news',
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<AnimatedFeedList locale="th" />);

    expect(screen.getByText('Failed to load news')).toBeInTheDocument();
    expect(screen.getByText('ลองอีกครั้ง')).toBeInTheDocument();
  });

  it('shows loading state with skeletons', () => {
    (useVicinityFeeds as vi.Mock).mockReturnValue({
      items: [],
      loading: true,
      error: null,
      lastUpdated: null,
      refresh: vi.fn(),
    });

    render(<AnimatedFeedList locale="th" />);

    // Should show loading state (at least one status element)
    expect(screen.getAllByRole('status').length).toBeGreaterThan(0);
  });
});