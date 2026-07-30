import React, { useState } from 'react';
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

  if (!isOpen || questions.length === 0) return null;

  const currentQ = questions[currentIndex];

  const handleSubmit = (val: string) => {
    onAnswer({ [currentQ.field]: val });
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setInputValue('');
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-zinc-900 p-6 text-white shadow-2xl transition-transform"
      role="dialog"
      aria-modal="true"
    >
      <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-zinc-700" />
      <h2 className="mb-2 text-lg font-bold">{currentQ.prompt}</h2>

      {currentQ.kind === 'confirm' && (
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="flex-1 min-h-[48px] rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
            onClick={() => handleSubmit(currentQ.value)}
          >
            Confirm
          </button>
          <button
            type="button"
            className="min-h-[48px] rounded-xl bg-zinc-800 px-4 text-zinc-400 hover:bg-zinc-700"
            onClick={onClose}
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
            className="w-full min-h-[48px] rounded-xl bg-zinc-800 px-4 text-white border border-zinc-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Type value..."
            autoFocus
          />
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 min-h-[48px] rounded-xl bg-emerald-600 font-semibold text-white hover:bg-emerald-500"
            >
              Submit
            </button>
            <button
              type="button"
              className="min-h-[48px] rounded-xl bg-zinc-800 px-4 text-zinc-400 hover:bg-zinc-700"
              onClick={onClose}
            >
              Skip
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
