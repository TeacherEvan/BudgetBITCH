'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useHaptic } from '@/hooks/use-haptic';
import type { Question } from '../../../convex/lib/receipt/types';

export type ReceiptVerifySheetProps = {
  isOpen: boolean;
  questions: Question[];
  onAnswer: (answers: Record<string, string>) => void;
  onClose: () => void;
};

export function ReceiptVerifySheet({
  isOpen,
  questions,
  onAnswer,
  onClose,
}: ReceiptVerifySheetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const haptic = useHaptic();

  const showSheet = isOpen && questions.length > 0;
  const currentQ = showSheet ? questions[currentIndex] : undefined;

  const handleSubmit = (val: string) => {
    if (!currentQ) return;
    haptic.trigger('selection');
    onAnswer({ [currentQ.field]: val });
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setInputValue('');
    } else {
      onClose();
    }
  };

  const handleCancelOrSkip = () => {
    haptic.trigger('light');
    onClose();
  };

  return (
    <AnimatePresence>
      {showSheet && currentQ && (
        <motion.div
          key="receipt-verify-sheet"
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{
            type: 'spring',
            stiffness: 380,
            damping: 30,
          }}
          className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-[var(--surface-layer-2)] border-t border-[var(--gold-border-soft)] p-6 text-[var(--text-1)] shadow-[var(--specular-top-elevated),var(--shadow-card)] backdrop-blur-md"
          role="dialog"
          aria-modal="true"
        >
          {/* Drag Handle */}
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />

          {/* Step Indicator Progression Dots */}
          {questions.length > 1 && (
            <div
              className="mb-4 flex items-center justify-center gap-1.5"
              aria-label={`Step ${currentIndex + 1} of ${questions.length}`}
            >
              {questions.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? 'w-6 bg-[var(--accent)] shadow-[0_0_8px_var(--accent)]'
                      : idx < currentIndex
                        ? 'w-2 bg-[var(--accent)]/50'
                        : 'w-2 bg-white/20'
                  }`}
                />
              ))}
            </div>
          )}

          <h2 className="mb-2 text-lg font-bold">{currentQ.prompt}</h2>

          {currentQ.kind === 'confirm' && (
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                className="flex-1 min-h-[48px] rounded-xl bg-[var(--accent)] font-semibold text-[var(--accent-ink)] hover:brightness-110 active:duration-[25ms] active:translate-y-[1px] active:scale-[0.985] cursor-pointer"
                onClick={() => handleSubmit(currentQ.value)}
              >
                Confirm
              </button>
              <button
                type="button"
                className="min-h-[48px] rounded-xl bg-[var(--surface-layer-3)] px-4 text-[var(--text-muted)] hover:text-white border border-[var(--border-neutral)] active:duration-[25ms] active:scale-[0.985] cursor-pointer"
                onClick={handleCancelOrSkip}
              >
                Cancel
              </button>
            </div>
          )}

          {currentQ.kind === 'entry' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSubmit(inputValue);
              }}
              className="mt-4 space-y-3"
            >
              <input
                type="text"
                inputMode={currentQ.inputType === 'amount' ? 'decimal' : 'text'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full min-h-[48px] rounded-xl bg-[var(--surface-layer-3)] px-4 text-[var(--text-1)] border border-[var(--border-neutral)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] font-mono tabular-nums shadow-[var(--specular-top-subtle)]"
                placeholder="Type value..."
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 min-h-[48px] rounded-xl bg-[var(--accent)] font-semibold text-[var(--accent-ink)] hover:brightness-110 active:duration-[25ms] active:translate-y-[1px] active:scale-[0.985] cursor-pointer"
                >
                  Submit
                </button>
                <button
                  type="button"
                  className="min-h-[48px] rounded-xl bg-[var(--surface-layer-3)] px-4 text-[var(--text-muted)] hover:text-white border border-[var(--border-neutral)] active:duration-[25ms] active:scale-[0.985] cursor-pointer"
                  onClick={handleCancelOrSkip}
                >
                  Skip
                </button>
              </div>
            </form>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
