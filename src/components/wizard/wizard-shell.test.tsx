// components/wizard/wizard-shell.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardShell } from './wizard-shell';
import { saveWizardProfile } from '@/lib/db/local-db';
import { NextIntlClientProvider } from 'next-intl';
import { getLocaleMessages } from '@/i18n/messages';

vi.mock('@/lib/db/local-db', () => ({
  saveWizardProfile: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('convex/react', () => ({
  useAction: () => vi.fn().mockResolvedValue({
    amount: 250,
    merchant: 'Woolworths',
    category: 'groceries',
    date: '2026-07-25',
  }),
}));

describe('WizardShell (3-Step Onboarding)', () => {
  const mockOnComplete = vi.fn();

  const renderWizard = (locale: string = 'en-ZA', onComplete = mockOnComplete) => {
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

  it('renders Step 1 (Income) on mount', () => {
    renderWizard();

    expect(screen.getByText('Step 1 / 3')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Monthly Income/i })).toBeInTheDocument();
  });

  it('navigates to Step 2 (Location Consent) after filling income', async () => {
    renderWizard();

    const incomeInput = screen.getByRole('spinbutton');
    fireEvent.change(incomeInput, { target: { value: '35000' } });

    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);

    await waitFor(() => {
      expect(screen.getByText('Step 2 / 3')).toBeInTheDocument();
    });
  });

  it('navigates to Step 3 (Receipt Scan) after location consent', async () => {
    renderWizard();

    // Step 1
    const incomeInput = screen.getByRole('spinbutton');
    fireEvent.change(incomeInput, { target: { value: '35000' } });
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 2
    await waitFor(() => {
      expect(screen.getByText('Step 2 / 3')).toBeInTheDocument();
    });

    const skipLocationBtn = screen.getByRole('button', { name: /Skip for now/i });
    fireEvent.click(skipLocationBtn);

    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 3
    await waitFor(() => {
      expect(screen.getByText('Step 3 / 3')).toBeInTheDocument();
      expect(screen.getByText(/Scan Your First Receipt/i)).toBeInTheDocument();
    });
  });

  it('saves WizardProfile and calls onComplete when completing all 3 steps', async () => {
    renderWizard();

    // Step 1: Income
    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '45000' } });
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 2: Location
    await waitFor(() => expect(screen.getByText('Step 2 / 3')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: /Skip for now/i }));
    fireEvent.click(screen.getByRole('button', { name: /Next/i }));

    // Step 3: Receipt Scan & Finish
    await waitFor(() => expect(screen.getByText('Step 3 / 3')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('skip-receipt-btn'));

    fireEvent.click(screen.getByRole('button', { name: /Finish/i }));

    await waitFor(() => {
      expect(saveWizardProfile).toHaveBeenCalledTimes(1);
      expect(saveWizardProfile).toHaveBeenCalledWith(
        expect.objectContaining({
          completed: true,
          version: 1,
          locale: 'en-ZA',
          answers: expect.objectContaining({
            income: 45000,
          }),
        })
      );
      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });
  });
});
