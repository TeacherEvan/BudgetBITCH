// src/components/pro-tips/pro-tips.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProTipsCard } from './pro-tips-card';

describe('ProTipsCard', () => {
  it('renders random pro tip badge and teaser', () => {
    render(<ProTipsCard locale="en" />);
    
    expect(screen.getByText('BOSS PRO-TIP')).toBeInTheDocument();
    // We don't verify exact title/teaser since it's randomized, but card layout is present
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('renders Thai label when locale is th', () => {
    render(<ProTipsCard locale="th" />);
    
    expect(screen.getByText('เคล็ดลับฉบับบอส')).toBeInTheDocument();
  });

  it('opens ProTipsModal details when card is clicked', () => {
    render(<ProTipsCard locale="en" />);
    
    const cardElement = screen.getByText('BOSS PRO-TIP').closest('div');
    expect(cardElement).toBeInTheDocument();
    
    if (cardElement) {
      fireEvent.click(cardElement);
    }
    
    // Modal is now in the document with the Action plan steps heading
    expect(screen.getByText('Action Plan Steps:')).toBeInTheDocument();
  });
});
