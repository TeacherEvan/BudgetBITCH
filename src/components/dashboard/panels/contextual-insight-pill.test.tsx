// src/components/dashboard/panels/contextual-insight-pill.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContextualInsightPill } from './contextual-insight-pill';

describe('ContextualInsightPill', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders principle, insight, and handles dismissal', () => {
    render(
      <ContextualInsightPill
        id="test-insight"
        principle="Loss Aversion"
        insight="Understanding cash flow buffers reduces cortisol."
        actionLabel="Take Action"
        onAction={vi.fn()}
      />
    );

    expect(screen.getByText(/Loss Aversion/)).toBeInTheDocument();
    expect(screen.getByText(/Understanding cash flow buffers/)).toBeInTheDocument();
    expect(screen.getByText(/Take Action/)).toBeInTheDocument();

    const dismissBtn = screen.getByLabelText('Dismiss insight');
    fireEvent.click(dismissBtn);

    expect(screen.queryByText(/Loss Aversion/)).not.toBeInTheDocument();
    expect(localStorage.getItem('bb:insight-dismissed:test-insight')).toBe('true');
  });
});
