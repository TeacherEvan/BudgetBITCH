// components/ui/modal.tsx
'use client';

import { Fragment, ReactNode, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
}: ModalProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape' && closeOnEscape) {
      onClose();
    }
  }, [closeOnEscape, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const sizeStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    full: 'max-w-4xl',
  };

  const modalContent = (
    <Fragment>
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`w-full ${sizeStyles[size]} max-h-[85vh] sm:max-h-[90vh] bg-black/95 border border-white/10 rounded-2xl shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'modal-title' : undefined}
          aria-describedby={description ? 'modal-description' : undefined}
        >
          {(title || showCloseButton) && (
            <div className="flex items-start justify-between p-5 border-b border-white/10 flex-shrink-0">
              <div>
                {title && (
                  <h2 id="modal-title" className="text-xl font-semibold text-white">
                    {title}
                  </h2>
                )}
                {description && (
                  <p id="modal-description" className="mt-1 text-sm text-white/70">
                    {description}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-white/10"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </Button>
              )}
            </div>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain [-webkit-overflow-scrolling:touch] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
            {children}
          </div>
        </div>
      </div>
    </Fragment>
  );

  if (typeof window === 'undefined') return null;
  return createPortal(modalContent, document.body);
}