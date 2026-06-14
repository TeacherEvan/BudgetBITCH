'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils/cn';

interface BudgetRingProps {
  progress: number; // 0-1
  size?: number;
  strokeWidth?: number;
  className?: string;
  label?: string;
}

export function BudgetRing({ 
  progress, 
  size = 120, 
  strokeWidth = 8, 
  className,
  label 
}: BudgetRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const offset = circumference * (1 - clampedProgress);

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-white/10"
          />
          <motion.circle
            data-testid="progress-ring"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="url(#budget-gradient)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${circumference} ${circumference}`}
            initial={prefersReducedMotion ? false : { strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ filter: 'drop-shadow(0 4px 12px rgba(157, 202, 183, 0.4))' }}
          />
          <defs>
            <linearGradient id="budget-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent)" />
              <stop offset="100%" stopColor="var(--accent-strong)" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="bb-metric-value" style={{ fontSize: size * 0.18 }}>
            {Math.round(clampedProgress * 100)}%
          </span>
        </div>
      </div>
      {label && <p className="bb-copy text-center">{label}</p>}
    </div>
  );
}