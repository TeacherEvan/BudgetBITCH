// components/ui/accordion.tsx
'use client';

import { useState, ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface AccordionItemProps {
  title: string;
  content: ReactNode;
  defaultOpen?: boolean;
  disabled?: boolean;
  icon?: ReactNode;
}

interface AccordionProps {
  items: AccordionItemProps[];
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({ items, allowMultiple = false, className = '' }: AccordionProps) {
  const [openItems, setOpenItems] = useState<string[]>(
    items.filter(i => i.defaultOpen).map((_, i) => String(i))
  );

  const toggleItem = (index: number) => {
    const key = String(index);
    setOpenItems(prev => {
      if (allowMultiple) {
        return prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      }
      return prev.includes(key) ? [] : [key];
    });
  };

  return (
    <div className={`space-y-3 ${className}`} role="region" aria-label="Accordion">
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          index={index}
          isOpen={openItems.includes(String(index))}
          onToggle={() => toggleItem(index)}
          {...item}
        />
      ))}
    </div>
  );
}

interface AccordionItemComponentProps extends AccordionItemProps {
  index: number;
  isOpen: boolean;
  onToggle: () => void;
}

function AccordionItem({ 
  index, 
  title, 
  content, 
  isOpen, 
  onToggle, 
  disabled = false,
  icon,
}: AccordionItemComponentProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-4 p-4 text-left"
        aria-expanded={isOpen}
        aria-controls={`accordion-content-${index}`}
        id={`accordion-trigger-${index}`}
      >
        <div className="flex items-center gap-3 flex-1">
          {icon && <span className="text-white/50">{icon}</span>}
          <span className="font-medium text-white">{title}</span>
        </div>
        <div className="flex items-center gap-2 text-white/50">
          {isOpen ? (
            <ChevronUp className="h-5 w-5 transition-transform" />
          ) : (
            <ChevronDown className="h-5 w-5 transition-transform" />
          )}
        </div>
      </button>
      <div
        id={`accordion-content-${index}`}
        role="region"
        aria-labelledby={`accordion-trigger-${index}`}
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="px-4 pb-4 pt-0 border-t border-white/10">
          {content}
        </div>
      </div>
    </div>
  );
}