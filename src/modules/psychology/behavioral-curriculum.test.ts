// src/modules/psychology/behavioral-curriculum.test.ts
import { describe, it, expect } from 'vitest';
import {
  BEHAVIORAL_LESSONS,
  isLessonCompleted,
  toggleLessonCompletion,
  type LessonProgress,
} from './behavioral-curriculum';

describe('behavioral-curriculum', () => {
  it('defines 5 rich behavioral micro-courses', () => {
    expect(BEHAVIORAL_LESSONS.length).toBe(5);
    for (const lesson of BEHAVIORAL_LESSONS) {
      expect(lesson.id).toBeTruthy();
      expect(lesson.title).toBeTruthy();
      expect(lesson.psychologicalPrinciple).toBeTruthy();
      expect(lesson.conceptSummary.length).toBeGreaterThanOrEqual(3);
      expect(lesson.actionTrigger.label).toBeTruthy();
    }
  });

  it('correctly checks completion status', () => {
    const progress: LessonProgress = {
      completedLessonIds: ['runway-over-salary'],
      lastCompletedAt: Date.now(),
    };

    expect(isLessonCompleted(progress, 'runway-over-salary')).toBe(true);
    expect(isLessonCompleted(progress, 'phantom-recurring-drain')).toBe(false);
  });

  it('toggles completion status back and forth', () => {
    let progress: LessonProgress = {
      completedLessonIds: [],
      lastCompletedAt: null,
    };

    progress = toggleLessonCompletion(progress, 'runway-over-salary');
    expect(progress.completedLessonIds).toContain('runway-over-salary');

    progress = toggleLessonCompletion(progress, 'runway-over-salary');
    expect(progress.completedLessonIds).not.toContain('runway-over-salary');
  });
});
