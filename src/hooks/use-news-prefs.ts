// hooks/use-news-prefs.ts
'use client';

import { useState, useEffect, useCallback } from 'react';

export type NewsGenre = 'finance' | 'economy' | 'local' | 'eco_tips' | 'fuel' | 'deals';
export const ALL_GENRES: readonly NewsGenre[] = ['finance', 'economy', 'local', 'eco_tips', 'fuel', 'deals'];

const NEWS_GENRES_KEY = 'bb:newsGenres';

function readGenres(): NewsGenre[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(NEWS_GENRES_KEY);
    if (!stored) return []; // empty = all shown
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((g): g is NewsGenre => (ALL_GENRES as readonly string[]).includes(g));
  } catch { return []; }
}

export function useNewsPrefs() {
  // disabledGenres: genres to hide. Empty array = show all.
  const [disabledGenres, setDisabledGenresState] = useState<NewsGenre[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisabledGenresState(readGenres());
  }, []);

  const setDisabledGenres = useCallback((genres: NewsGenre[]) => {
    setDisabledGenresState(genres);
    try { localStorage.setItem(NEWS_GENRES_KEY, JSON.stringify(genres)); } catch { /* ignore */ }
  }, []);

  const toggleGenre = useCallback((genre: NewsGenre) => {
    setDisabledGenresState(prev => {
      const next = prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre];
      try { localStorage.setItem(NEWS_GENRES_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
  }, []);

  const isGenreEnabled = useCallback((genre: NewsGenre) => !disabledGenres.includes(genre), [disabledGenres]);

  // Filter function: pass an item with a category, returns true if visible
  const filterByGenre = useCallback(
    (item: { category: string }) =>
      disabledGenres.length === 0 || !disabledGenres.includes(item.category as NewsGenre),
    [disabledGenres],
  );

  return { disabledGenres, setDisabledGenres, toggleGenre, isGenreEnabled, filterByGenre };
}
