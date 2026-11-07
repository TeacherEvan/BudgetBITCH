import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScenarioSandboxModal } from './scenario-sandbox-modal';
import type { WizardProfile } from '@/lib/types/budget';

const mockProfile: WizardProfile = {
  completed: true,
  completedAt: '2026-07-20T00:00:00.000Z',
  version: 1,
  locale: 'en',
  answers: {
    income: 5000,
    rent: 1500,
    transport: 300,
    phoneInternet: 100,
    subscriptions: 50,
    entertainment: 200,
    healthcare: 100,
    savingsRatePct: 20,
    riskTolerance: 'medium',
    locationConsent: false,
    currency: 'USD',
  },
};

describe('ScenarioSandboxModal', () => {
  it('renders with profile baseline values and dynamic slider bounds for USD currency', () => {
    render(
      <ScenarioSandboxModal
        isOpen={true}
        onClose={() => {}}
        profile={mockProfile}
        currency="USD"
        locale="en"
      />
    );

    // Baseline income is 5,000, so min bound should be 1,000 (0.2 * 5,000), not hardcoded 10,000
    const sliders = screen.getAllByRole('slider');
    expect(sliders.length).toBe(3);
    const incomeSlider = sliders[0];
    expect(incomeSlider.getAttribute('min')).toBe('1000');
    expect(incomeSlider.getAttribute('max')).toBe('15000');
  });

  it('updates sliders when a preset is chosen', () => {
    render(
      <ScenarioSandboxModal
        isOpen={true}
        onClose={() => {}}
        profile={mockProfile}
        currency="USD"
        locale="en"
      />
    );

    const defensivePreset = screen.getByText('Shield & Protect');
    fireEvent.click(defensivePreset);

    // Income -10% of 5000 = 4500
    const sliders = screen.getAllByRole('slider');
    expect(sliders[0].getAttribute('value')).toBe('4500');
  });
});
