// components/ui/progress-ring.tsx
'use client';

interface ProgressRingProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: 'emerald' | 'amber' | 'rose' | 'blue';
  showValue?: boolean;
  className?: string;
}

const colors = {
  emerald: 'stroke-emerald-400',
  amber: 'stroke-amber-400',
  rose: 'stroke-rose-400',
  blue: 'stroke-blue-400',
};

const trackColors = {
  emerald: 'stroke-emerald-400/20',
  amber: 'stroke-amber-400/20',
  rose: 'stroke-rose-400/20',
  blue: 'stroke-blue-400/20',
};

export function ProgressRing({ 
  value, 
  size = 80, 
  strokeWidth = 6, 
  color = 'emerald',
  showValue = true,
  className = '',
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100);

  return (
    <div className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          className={trackColors[color]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
        />
        <circle
          className={`${colors[color]} transition-all duration-500 ease-out`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">
            {Math.round(value)}%
          </span>
        </div>
      )}
    </div>
  );
}