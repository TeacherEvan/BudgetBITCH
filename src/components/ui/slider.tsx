// components/ui/slider.tsx
'use client';

import { useState, useRef, useEffect, InputHTMLAttributes, forwardRef } from 'react';

export interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  onValueChange?: (value: number) => void;
  showValue?: boolean;
  valueFormatter?: (value: number) => string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ 
    label, 
    min = 0, 
    max = 100, 
    step = 1, 
    value, 
    onValueChange, 
    showValue = true, 
    valueFormatter = (v) => String(v),
    className = '',
    id,
    disabled,
    ...props 
  }, ref) => {
    const sliderId = id || `slider-${Math.random().toString(36).slice(2)}`;
    const [isDragging, setIsDragging] = useState(false);
    const [currentValue, setCurrentValue] = useState(value ?? min);
    const thumbRef = useRef<HTMLDivElement>(null);

    // Sync with controlled value
    useEffect(() => {
      if (!isDragging && value !== undefined) {
        setCurrentValue(value);
      }
    }, [value, isDragging]);

    const handleChange = (newValue: number) => {
      const clamped = Math.max(min, Math.min(max, newValue));
      const stepped = Math.round(clamped / step) * step;
      setCurrentValue(stepped);
      onValueChange?.(stepped);
    };

    const handleMouseDown = () => setIsDragging(true);
    const handleMouseUp = () => setIsDragging(false);

    const percentage = ((currentValue - min) / (max - min)) * 100;

    return (
      <div className={`space-y-2 ${className}`}>
        {label && (
          <div className="flex items-center justify-between">
            <label htmlFor={sliderId} className="text-sm font-medium text-white">
              {label}
            </label>
            {showValue && (
              <span className="text-sm font-mono text-amber-400">
                {valueFormatter(currentValue)}
              </span>
            )}
          </div>
        )}
        <div className="relative h-6" role="slider" aria-valuemin={min} aria-valuemax={max} aria-valuenow={currentValue} aria-disabled={disabled} tabIndex={disabled ? -1 : 0}>
          <div 
            className="absolute top-1/2 left-0 right-0 h-1 -translate-y-1/2 bg-white/10 rounded-full overflow-hidden"
          >
            <div 
              className="h-full bg-amber-400 rounded-full transition-all duration-100"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <input
            ref={ref}
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={(e) => handleChange(Number(e.target.value))}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchEnd={handleMouseUp}
            disabled={disabled}
            className="absolute inset-0 w-full h-6 appearance-none bg-transparent cursor-pointer"
            aria-label={label}
          />
          <div
            ref={thumbRef}
            className={`
              absolute top-1/2 transform -translate-x-1/2 -translate-y-1/2
              w-5 h-5 rounded-full bg-amber-400 border-2 border-white
              shadow-lg transition-transform duration-100
              ${isDragging ? 'scale-110' : ''}
              ${disabled ? 'opacity-50' : ''}
            `}
            style={{ left: `${percentage}%` }}
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }
);

Slider.displayName = 'Slider';