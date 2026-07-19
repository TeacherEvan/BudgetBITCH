// components/ui/select.tsx
'use client';

import { SelectHTMLAttributes, forwardRef } from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string | undefined;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className = '', id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className={`space-y-1.5 ${className}`}>
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-white">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full rounded-xl bg-black/30 px-4 py-3 text-white outline-none transition appearance-none
            ${error ? 'border-rose-500/50 focus:border-rose-500 focus:ring-rose-500/20' : 'border-white/10 focus:border-emerald-400 focus:ring-emerald-400/20'}
          `}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p id={`${selectId}-error`} className="text-sm text-rose-400" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={`${selectId}-helper`} className="text-sm text-white/50">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';