// components/ui/error-boundary.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ErrorBoundary } from './error-boundary';

function ProblemChild(): ReactElement {
  throw new Error('Test crash in component');
}

describe('ErrorBoundary', () => {
  it('renders children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Normal Component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText('Normal Component')).toBeInTheDocument();
  });

  it('catches render error and surfaces error fallback UI', () => {
    // Suppress console.error output during deliberate test crash
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
    expect(screen.getByText('Test crash in component')).toBeInTheDocument();
    expect(screen.getByTestId('report-bug-btn')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('triggers mailto window.open when Report Bug clicked', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(
      <ErrorBoundary>
        <ProblemChild />
      </ErrorBoundary>
    );

    fireEvent.click(screen.getByTestId('report-bug-btn'));

    expect(openSpy).toHaveBeenCalledTimes(1);
    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('mailto:admin@budgetbitch.app'),
      '_blank'
    );

    spy.mockRestore();
    openSpy.mockRestore();
  });
});
