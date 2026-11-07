// components/ui/button.tsx
'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    isLoading = false, 
    disabled, 
    children, 
    className = '', 
    ...props 
  }, ref) => {
    const baseStyles = `
      relative inline-flex items-center justify-center font-semibold select-none
      tabular-nums touch-manipulation cursor-pointer
      transition-[transform,background-color,border-color,color,box-shadow] duration-150 ease-out
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
      active:not(:disabled):translate-y-[1px] active:not(:disabled):scale-[0.985]
      bb-btn-edge
    `;

    const variantStyles = {
      primary: 'bg-[var(--accent)] text-[var(--accent-ink)] hover:brightness-110 active:brightness-95 focus-visible:ring-[var(--accent-strong)] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]',
      secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/20 active:bg-white/15 focus-visible:ring-white/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]',
      ghost: 'text-white/80 hover:bg-white/10 active:bg-white/15 focus-visible:ring-white/40',
      danger: 'bg-rose-500 text-white hover:bg-rose-400 active:bg-rose-600 focus-visible:ring-rose-500 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]',
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 min-h-[36px] sm:min-h-[32px] text-sm rounded-xl',
      md: 'px-5 py-2.5 min-h-[44px] text-sm rounded-xl',
      lg: 'px-6 py-3 min-h-[48px] text-base rounded-xl',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? 'true' : undefined}
        data-loading={isLoading ? 'true' : undefined}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </span>
        )}
        <span className={isLoading ? 'invisible' : 'inline-flex items-center gap-1.5'}>
          {children}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';