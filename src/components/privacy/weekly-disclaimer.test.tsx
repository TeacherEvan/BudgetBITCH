// components/privacy/weekly-disclaimer.test.tsx
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WeeklyPrivacyDisclaimer } from './weekly-disclaimer';

const KEY = 'budgetbitch:privacyDisclaimerWeek';

function isoWeekNow(): string {
  // Mirror the component's ISO-week calc so the test asserts the same value.
  const d = new Date();
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  const week =
    1 +
    Math.round(
      ((date.getTime() - firstThursday.getTime()) / 86400000 -
        3 +
        ((firstThursday.getUTCDay() + 6) % 7)) /
        7,
    );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

describe('WeeklyPrivacyDisclaimer', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => localStorage.clear());

  it('shows the modal when no week has been acknowledged', () => {
    render(<WeeklyPrivacyDisclaimer locale="en" />);
    expect(screen.getByTestId('privacy-disclaimer')).toBeInTheDocument();
    expect(screen.getByText(/your privacy/i)).toBeInTheDocument();
  });

  it('does NOT show when the current week is already stored', () => {
    localStorage.setItem(KEY, isoWeekNow());
    render(<WeeklyPrivacyDisclaimer locale="en" />);
    expect(screen.queryByTestId('privacy-disclaimer')).toBeNull();
  });

  it('stores the current ISO week and closes on "Got it"', async () => {
    render(<WeeklyPrivacyDisclaimer locale="en" />);
    fireEvent.click(screen.getByTestId('privacy-gotit-btn'));

    await waitFor(() => {
      expect(localStorage.getItem(KEY)).toBe(isoWeekNow());
    });
    expect(screen.queryByTestId('privacy-disclaimer')).toBeNull();
  });

  it('"Learn more" links to /security', () => {
    render(<WeeklyPrivacyDisclaimer locale="en" />);
    const link = screen.getByTestId('privacy-learn-more') as HTMLAnchorElement;
    expect(link.getAttribute('href')).toBe('/security');
  });

  it('supports Thai locale', () => {
    render(<WeeklyPrivacyDisclaimer locale="th" />);
    expect(screen.getByTestId('privacy-disclaimer')).toBeInTheDocument();
    expect(screen.getByTestId('privacy-gotit-btn')).toHaveTextContent(/รับทราบ|ตกลง/);
  });
});
