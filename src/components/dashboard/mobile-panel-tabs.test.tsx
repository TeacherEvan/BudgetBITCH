import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MobilePanelTabs } from './mobile-panel-tabs';

describe('MobilePanelTabs', () => {
  const onSelect = vi.fn();
  const onMore = vi.fn();

  it('renders 5 primary tabs with icon and label (en)', () => {
    render(<MobilePanelTabs activePanel="expenses" onSelect={onSelect} onMore={onMore} locale="en" />);

    expect(screen.getByTestId('mobile-tab-expenses')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tab-budget')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tab-goals')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tab-netWorth')).toBeInTheDocument();
    expect(screen.getByTestId('mobile-tab-budgetAlerts')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument();
  });

  it('marks the active tab with aria-current="page"', () => {
    render(<MobilePanelTabs activePanel="budget" onSelect={onSelect} onMore={onMore} locale="en" />);

    expect(screen.getByTestId('mobile-tab-budget')).toHaveAttribute('aria-current', 'page');
    expect(screen.getByTestId('mobile-tab-expenses')).not.toHaveAttribute('aria-current');
  });

  it('calls onSelect with the correct panel key when a tab is clicked', () => {
    render(<MobilePanelTabs activePanel="expenses" onSelect={onSelect} onMore={onMore} locale="en" />);

    fireEvent.click(screen.getByTestId('mobile-tab-goals'));
    expect(onSelect).toHaveBeenCalledWith('goals');
  });

  it('calls onMore when the More tab is clicked', () => {
    render(<MobilePanelTabs activePanel="expenses" onSelect={onSelect} onMore={onMore} locale="en" />);

    fireEvent.click(screen.getByRole('button', { name: /more/i }));
    expect(onMore).toHaveBeenCalledTimes(1);
  });
});
