// src/components/dashboard/feed-card.test.tsx
import { render, screen } from '@testing-library/react';
import { FeedCard } from '@/components/dashboard/feed-card';
import { describe, it, expect } from 'vitest';

describe('FeedCard', () => {
  const item = {
    title: 'Fuel prices drop tomorrow',
    link: 'https://example.com/fuel',
    pubDate: new Date().toISOString(),
    source: 'Bangkok Post',
    category: 'fuel' as const,
    locale: 'en' as const,
    actionable: 'Check fuel prices before filling up',
  };

  it('renders title', () => {
    render(<FeedCard item={item} locale="en" index={0} />);

    expect(screen.getByText('Fuel prices drop tomorrow')).toBeInTheDocument();
  });

  it('renders category badge in English', () => {
    render(<FeedCard item={item} locale="en" index={0} />);

    expect(screen.getByText('Fuel')).toBeInTheDocument();
  });

  it('renders source', () => {
    render(<FeedCard item={item} locale="en" index={0} />);

    expect(screen.getByText('Bangkok Post')).toBeInTheDocument();
  });

  it('renders actionable badge with pulse animation', () => {
    render(<FeedCard item={item} locale="en" index={0} />);

    const badge = screen.getByText('Check fuel prices before filling up');
    expect(badge).toBeInTheDocument();
    // Check for pulse animation on the parent p element
    expect(badge.closest('p')).toHaveClass('animate-pulse');
  });

  it('renders read more link with correct href', () => {
    render(<FeedCard item={item} locale="en" index={0} />);

    const link = screen.getByRole('link', { name: /read more/i });
    expect(link).toHaveAttribute('href', 'https://example.com/fuel');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});
