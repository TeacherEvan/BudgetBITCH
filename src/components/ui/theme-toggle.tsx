'use client';

import { useTheme } from '@/components/providers/theme-provider';
import { cn } from '@/lib/utils/cn';

const themes: { id: 'amber' | 'dark' | 'gold'; label: string; icon: string }[] = [
  { id: 'amber', label: 'Amber', icon: '🟡' },
  { id: 'dark', label: 'Dark', icon: '⚫' },
  { id: 'gold', label: 'Gold', icon: '🟠' },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex items-center gap-1 p-1 bg-white/5 border border-white/10 rounded-xl">
      {themes.map(t => (
        <button
          key={t.id}
          role="radio"
          aria-checked={theme === t.id}
          onClick={() => setTheme(t.id)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150',
            theme === t.id
              ? 'bg-white/10 text-white'
              : 'text-white/60 hover:text-white hover:bg-white/5'
          )}
          data-active={theme === t.id ? 'true' : 'false'}
        >
          <span aria-hidden="true">{t.icon}</span>
          <span>{t.label}</span>
        </button>
      ))}
    </div>
  );
}