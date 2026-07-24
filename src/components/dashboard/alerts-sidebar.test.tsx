// src/components/dashboard/alerts-sidebar.test.tsx
import { render, screen } from '@testing-library/react';
import { AlertsSidebar } from '@/components/dashboard/alerts-sidebar';
import { useVicinityFeeds } from '@/hooks/use-vicinity-feeds';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the hook
vi.mock('@/hooks/use-vicinity-feeds');
// Mock Lottie properly - default export is the Lottie component
vi.mock('lottie-react', () => ({
  __esModule: true,
  default: ({ animationData: _animationData, ...props }: { animationData: unknown; [key: string]: unknown }) => (
    <div data-testid="lottie-animation" {...props} />
  ),
  Lottie: ({ animationData: _animationData, ...props }: { animationData: unknown; [key: string]: unknown }) => (
    <div data-testid="lottie-animation" {...props} />
  ),
  LottiePlayer: () => null,
  useLottie: () => null,
  useLottieInteractivity: () => null,
}));

describe('AlertsSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders heading and feed items via AnimatedFeedList', async () => {
    (useVicinityFeeds as vi.Mock).mockReturnValue({
      items: [
        { title: 'Test News', link: 'https://a.com', pubDate: new Date().toISOString(), source: 'Test', category: 'finance', locale: 'th' },
      ],
      loading: false,
      error: null,
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<AlertsSidebar locale="th" />);

    // Should render heading
    expect(screen.getByText('ข่าวและข้อมูลล่าสุด')).toBeInTheDocument();
    
    // Should render feed card via AnimatedFeedList
    expect(screen.getByText('Test News')).toBeInTheDocument();
  });

  it('renders Thai heading when locale is th', () => {
    (useVicinityFeeds as vi.Mock).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<AlertsSidebar locale="th" />);
    expect(screen.getByText('ข่าวและข้อมูลล่าสุด')).toBeInTheDocument();
  });

  it('renders English heading when locale is en', () => {
    (useVicinityFeeds as vi.Mock).mockReturnValue({
      items: [],
      loading: false,
      error: null,
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<AlertsSidebar locale="en" />);
    expect(screen.getByText('Latest Updates')).toBeInTheDocument();
  });

  it('renders modal variant correctly', () => {
    (useVicinityFeeds as vi.Mock).mockReturnValue({
      items: [
        { title: 'Test News', link: 'https://a.com', pubDate: new Date().toISOString(), source: 'Test', category: 'finance', locale: 'th' },
      ],
      loading: false,
      error: null,
      lastUpdated: Date.now(),
      refresh: vi.fn(),
    });

    render(<AlertsSidebar locale="th" isModal={true} />);
    expect(screen.getByText('ข่าวและข้อมูลล่าสุด')).toBeInTheDocument();
    expect(screen.getByText('Test News')).toBeInTheDocument();
  });
});