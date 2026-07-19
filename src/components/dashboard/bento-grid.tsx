'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

export interface PanelConfig {
  id: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}

interface BentoGridProps {
  panels: PanelConfig[];
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  }),
};

export function BentoGrid({ panels, className }: BentoGridProps) {
  // Hydration-safe reduced-motion: default to false on the server/first
  // render, then read the media query after mount. Reading during render
  // caused a React #418 mismatch (server=false, client=true).
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    // Intentional post-mount read of a media query (cannot be known during SSR).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPrefersReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <motion.div
      id="bento-grid"
      data-testid="bento-grid"
      className={cn(
        'grid gap-4',
        'grid-cols-1',
        'sm:grid-cols-2',
        'lg:grid-cols-2',
        'xl:grid-cols-2',
        '2xl:grid-cols-3',
        className
      )}
      initial={prefersReducedMotion ? false : 'hidden'}
      animate={prefersReducedMotion ? false : 'visible'}
      variants={containerVariants}
    >
      {panels.map((panel, index) => (
        <motion.article
          key={panel.id}
          data-testid="panel-card"
          custom={index}
          variants={itemVariants}
          className={cn(
            'bb-panel relative overflow-hidden min-h-[200px] @container',
            panel.className
          )}
          style={{ '--delay': `${index * 100}ms` } as React.CSSProperties}
        >
          <header className="p-4 border-b border-white/5">
            <h3 className="font-medium text-white bb-kicker">{panel.title}</h3>
          </header>
          <div className="p-4">{panel.children}</div>
        </motion.article>
      ))}
    </motion.div>
  );
}