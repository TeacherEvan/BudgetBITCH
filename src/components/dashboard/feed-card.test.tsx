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
    locale: 'th' as const,
    actionable: 'เช็คราคาน้ำมันก่อนเติม',
  };

  it('renders title', () => {
    render(<FeedCard item={item} locale="th" index={0} />);

    expect(screen.getByText('Fuel prices drop tomorrow')).toBeInTheDocument();
  });

  it('renders category badge in Thai', () => {
    render(<FeedCard item={item} locale="th" index={0} />);

    expect(screen.getByText('น้ำมัน')).toBeInTheDocument();
  });

  it('renders source', () => {
    render(<FeedCard item={item} locale="th" index={0} />);

    expect(screen.getByText('Bangkok Post')).toBeInTheDocument();
  });

  it('renders actionable badge with pulse animation', () => {
    render(<FeedCard item={item} locale="th" index={0} />);

    const badge = screen.getByText('เช็คราคาน้ำมันก่อนเติม');
    expect(badge).toBeInTheDocument();
    // Check for pulse animation on the parent p element
    expect(badge.closest('p')).toHaveClass('animate-pulse');
  });

  it('renders read more link with correct href', () => {
    render(<FeedCard item={item} locale="th" index={0} />);

    const link = screen.getByRole('link', { name: /อ่านต่อ/i });
    expect(link).toHaveAttribute('href', 'https://example.com/fuel');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders category badge in English when locale is en', () => {
    render(<FeedCard item={item} locale="en" index={0} />);

    expect(screen.getByText('Fuel')).toBeInTheDocument();
  });

  it('renders read more link in English when locale is en', () => {
    render(<FeedCard item={item} locale="en" index={0} />);

    const link = screen.getByRole('link', { name: /read more/i });
    expect(link).toBeInTheDocument();
  });
});