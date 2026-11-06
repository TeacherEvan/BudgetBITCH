// src/components/learning/learning-hub-modal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningHubModal } from './learning-hub-modal';

const mockToggleLesson = vi.fn();

vi.mock('@/hooks/use-psychology-storage', () => ({
  usePsychologyStorage: () => ({
    lessons: {
      completedLessonIds: ['runway-over-salary'],
      lastCompletedAt: Date.now(),
    },
    toggleLesson: mockToggleLesson,
  }),
}));

describe('LearningHubModal', () => {
  it('renders learning hub lessons and triggers navigation', () => {
    const onNavigateTab = vi.fn();
    const onClose = vi.fn();

    render(
      <LearningHubModal
        isOpen={true}
        onClose={onClose}
        onNavigateTab={onNavigateTab}
      />
    );

    expect(screen.getByText('Financial Psychology & Masterclasses')).toBeInTheDocument();
    expect(screen.getAllByText(/Runway Over Salary/).length).toBeGreaterThan(0);
    expect(screen.getByText(/Taming Mental Accounting/)).toBeInTheDocument();

    // Action CTA click
    const actionBtn = screen.getByText(/Explore Your Runway Horizon/);
    fireEvent.click(actionBtn);

    expect(onNavigateTab).toHaveBeenCalledWith('perspective');
    expect(onClose).toHaveBeenCalled();
  });
});
