// src/components/dashboard/bigger-picture-card.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BiggerPictureCard } from './bigger-picture-card';
import type { WizardProfile, Bill, SavingsGoal, Debt } from '@/lib/types/budget';

const mockProfile: WizardProfile = {
  version: 1,
  completed: true,
  completedAt: new Date().toISOString(),
  locale: 'en',
  answers: {
    income: 5000,
    currency: 'USD',
    locationConsent: false,
  },
};

const mockBills: Bill[] = [
  { id: '1', name: 'Rent', amount: 1200, dueDay: 1, isActive: true, category: 'housing', reminderDaysBefore: 3 },
  { id: '2', name: 'Internet', amount: 80, dueDay: 15, isActive: true, category: 'phone_internet', reminderDaysBefore: 3 },
];

const mockGoals: SavingsGoal[] = [
  { id: '1', name: 'Emergency', targetAmount: 10000, currentAmount: 3840, category: 'emergency', autoAllocate: 300 },
];

const mockDebts: Debt[] = [
  { id: '1', name: 'Credit Card', balance: 1500, apr: 18, minimumPayment: 100, type: 'credit_card' },
];

describe('BiggerPictureCard', () => {
  it('renders all core pillars: Runway, Velocity, and Debt', () => {
    render(
      <BiggerPictureCard
        profile={mockProfile}
        bills={mockBills}
        savingsGoals={mockGoals}
        debts={mockDebts}
        emergencyFundAmount={2000}
      />
    );

    expect(screen.getByText('The Bigger Picture')).toBeInTheDocument();
    expect(screen.getByText('Liquid Runway')).toBeInTheDocument();
    expect(screen.getByText('Wealth Velocity')).toBeInTheDocument();
    expect(screen.getByText('Debt Burden')).toBeInTheDocument();
    expect(screen.getByText('Interactive Horizon Simulator')).toBeInTheDocument();
  });

  it('updates horizon simulation projections on slider input', () => {
    render(
      <BiggerPictureCard
        profile={mockProfile}
        bills={mockBills}
        savingsGoals={mockGoals}
        debts={mockDebts}
        emergencyFundAmount={2000}
      />
    );

    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(2);

    fireEvent.change(sliders[0], { target: { value: '200' } });
    expect(screen.getByText(/Projected 12-Month Compound Impact/)).toBeInTheDocument();
  });
});
