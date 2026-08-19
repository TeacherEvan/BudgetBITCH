// components/wizard/wizard-shell.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardShell } from './wizard-shell';
import { saveWizardProfile } from '@/lib/db/local-db';
import { NextIntlClientProvider } from 'next-intl';
import { getLocaleMessages, type AppLocale } from '@/i18n/messages';

vi.mock('@/lib/db/local-db', () => ({
  saveWizardProfile: vi.fn().mockResolvedValue(undefined),
  getLocationCache: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('convex/react', () => ({
  useAction: () => vi.fn().mockResolvedValue({
    amount: 250,
    merchant: 'Store',
    category: 'groceries',
    date: '2026-07-25',
  }),
}));

describe('WizardShell (10-Step BudgetWizard Onboarding)', () => {
  const mockOnComplete = vi.fn();

  const renderWizard = (locale: AppLocale = 'en', onComplete = mockOnComplete) => {
    const messages = getLocaleMessages('en');
    return render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <WizardShell locale={locale} onComplete={onComplete} />
      </NextIntlClientProvider>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders Step 1 / 10 (Income) on mount', () => {
    renderWizard();

    expect(screen.getByText('Step 1 / 10')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Monthly Income/i })).toBeInTheDocument();
  });

  it('navigates through all 10 steps and calls saveWizardProfile + onComplete', async () => {
    renderWizard();

    // Step 1: Income
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '50000' } });
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 2: Rent / Housing
    await waitFor(() => expect(screen.getByText('Step 2 / 10')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 3: Phone & Internet
    await waitFor(() => expect(screen.getByText('Step 3 / 10')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 4: Healthcare
    await waitFor(() => expect(screen.getByText('Step 4 / 10')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 5: Transport
    await waitFor(() => expect(screen.getByText('Step 5 / 10')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 6: Entertainment
    await waitFor(() => expect(screen.getByText('Step 6 / 10')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 7: Subscriptions
    await waitFor(() => expect(screen.getByText('Step 7 / 10')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 8: Savings Rate
    await waitFor(() => expect(screen.getByText('Step 8 / 10')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 9: Risk Tolerance
    await waitFor(() => expect(screen.getByText('Step 9 / 10')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 10: Location Consent
    await waitFor(() => expect(screen.getByText('Step 10 / 10')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Finish/i }));

    await waitFor(() => {
      expect(saveWizardProfile).toHaveBeenCalledTimes(1);
      expect(saveWizardProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: true,
          answers: expect.objectContaining({
            income: 50000,
          }),
        })
      );
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });
});
