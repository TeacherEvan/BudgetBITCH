// components/ui/toggle.tsx
'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';

export interface ToggleProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Toggle = forwardRef<HTMLButtonElement, ToggleProps>(
  ({ checked = false, onCheckedChange, label, description, size = 'md', className = '', disabled, ...props }, ref) => {
    const handleClick = () => {
      if (!disabled) {
        onCheckedChange?.(!checked);
      }
    };

    const sizeStyles = {
      sm: 'w-8 h-5',
      md: 'w-11 h-6',
      lg: 'w-14 h-7',
    };

    const thumbSize = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };

    const thumbTranslate = {
      sm: checked ? 'translate-x-4' : 'translate-x-0',
      md: checked ? 'translate-x-5' : 'translate-x-0',
      lg: checked ? 'translate-x-7' : 'translate-x-0',
    };

    return (
      <div className="flex items-center gap-3">
        <button
          ref={ref}
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={handleClick}
          disabled={disabled}
          className={`
            relative inline-flex shrink-0 cursor-pointer rounded-full border-2 transition-all duration-200
            ${checked ? 'bg-amber-400 border-amber-400' : 'bg-white/10 border-white/20'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-amber-400/50 hover:border-amber-400/50'}
            ${sizeStyles[size]} ${className}
          `}
          {...props}
        >
          <span
            className={`
              absolute top-1/2 left-1/2 transform -translate-y-1/2 transition-transform duration-200
              bg-white rounded-full shadow ${thumbSize[size]} ${thumbTranslate[size]}
            `}
            aria-hidden="true"
          />
        </button>
        {(label || description) && (
          <div className="flex flex-col">
            {label && <span className="text-sm font-medium text-white">{label}</span>}
            {description && <span className="text-xs text-white/60">{description}</span>}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = 'Toggle';