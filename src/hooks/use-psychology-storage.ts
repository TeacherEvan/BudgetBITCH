// src/hooks/use-psychology-storage.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getDB } from '@/lib/db/local-db';
import {
  recordHabitActivity,
  isWeeklyReflectionDue,
  type StreakState,
  type WeeklyReflectionEntry,
} from '@/modules/psychology/habit-tracker';
import {
  type LessonProgress,
  toggleLessonCompletion,
} from '@/modules/psychology/behavioral-curriculum';

const HABIT_KEY = 'bb:habit-streak';
const LESSONS_KEY = 'bb:learning-progress';
const REFLECTIONS_KEY = 'bb:weekly-reflections';

const DEFAULT_STREAK: StreakState = {
  currentStreak: 0,
  bestStreak: 0,
  shieldsRemaining: 2,
  lastActiveDayString: null,
  shieldUsedToday: false,
};

const DEFAULT_LESSONS: LessonProgress = {
  completedLessonIds: [],
  lastCompletedAt: null,
};

export function usePsychologyStorage() {
  const [streak, setStreak] = useState<StreakState>(DEFAULT_STREAK);
  const [lessons, setLessons] = useState<LessonProgress>(DEFAULT_LESSONS);
  const [reflections, setReflections] = useState<WeeklyReflectionEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Hydrate from bbMeta in IndexedDB
  useEffect(() => {
    let mounted = true;

    async function hydrate() {
      try {
        const db = await getDB();
        const [rawStreak, rawLessons, rawReflections] = await Promise.all([
          db.get('bbMeta', HABIT_KEY),
          db.get('bbMeta', LESSONS_KEY),
          db.get('bbMeta', REFLECTIONS_KEY),
        ]);

        if (!mounted) return;

        let parsedStreak: StreakState = DEFAULT_STREAK;
        if (typeof rawStreak === 'string') {
          try { parsedStreak = JSON.parse(rawStreak); } catch {}
        }
        // Record visit today automatically
        const updatedStreak = recordHabitActivity(parsedStreak);
        setStreak(updatedStreak);
        await db.put('bbMeta', JSON.stringify(updatedStreak), HABIT_KEY);

        if (typeof rawLessons === 'string') {
          try { setLessons(JSON.parse(rawLessons)); } catch {}
        }

        if (typeof rawReflections === 'string') {
          try { setReflections(JSON.parse(rawReflections)); } catch {}
        }
      } catch (err) {
        console.warn('[PsychologyStorage] Hydration fallback:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    hydrate();

    return () => {
      mounted = false;
    };
  }, []);

  const toggleLesson = useCallback(async (lessonId: string) => {
    setLessons((prev) => {
      const next = toggleLessonCompletion(prev, lessonId);
      getDB().then((db) => {
        db.put('bbMeta', JSON.stringify(next), LESSONS_KEY).catch(console.error);
      });
      return next;
    });
  }, []);

  const saveReflection = useCallback(async (entry: Omit<WeeklyReflectionEntry, 'id' | 'timestamp'>) => {
    const newEntry: WeeklyReflectionEntry = {
      ...entry,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setReflections((prev) => {
      const next = [newEntry, ...prev];
      getDB().then((db) => {
        db.put('bbMeta', JSON.stringify(next), REFLECTIONS_KEY).catch(console.error);
      });
      return next;
    });
  }, []);

  const lastReflectionTimestamp = reflections[0]?.timestamp ?? null;
  const reflectionDue = isWeeklyReflectionDue(lastReflectionTimestamp);

  return {
    streak,
    lessons,
    reflections,
    loading,
    reflectionDue,
    toggleLesson,
    saveReflection,
  };
}
