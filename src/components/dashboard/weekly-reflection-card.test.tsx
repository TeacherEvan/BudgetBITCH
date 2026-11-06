// src/components/dashboard/weekly-reflection-card.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeeklyReflectionCard } from './weekly-reflection-card';

const mockSaveReflection = vi.fn();

vi.mock('@/hooks/use-psychology-storage', () => ({
  usePsychologyStorage: () => ({
    reflectionDue: true,
    saveReflection: mockSaveReflection,
  }),
}));

describe('WeeklyReflectionCard', () => {
  it('renders check-in options and submits reflection', () => {
    render(<WeeklyReflectionCard />);

    expect(screen.getByText(/Weekly Mindful Check-In/)).toBeInTheDocument();
    expect(screen.getByText(/Peaceful & In Control/)).toBeInTheDocument();

    const saveBtn = screen.getByText('Save Reflection');
    fireEvent.click(saveBtn);

    expect(mockSaveReflection).toHaveBeenCalled();
    expect(screen.getByText(/Thank you for checking in with yourself/)).toBeInTheDocument();
  });
});
