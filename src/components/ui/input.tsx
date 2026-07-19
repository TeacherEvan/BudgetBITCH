// components/ui/input.tsx
'use client';

import { InputHTMLAttributes, forwardRef } from 'react';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className={`space-y-1.5 ${className}`}>
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-white">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-xl border bg-black/30 px-4 py-3 text-white outline-none transition
            placeholder:text-white/40
            ${error ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20' : 'border-white/10 focus:border-emerald-400 focus:ring-emerald-400/20'}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="text-sm text-white/50">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';