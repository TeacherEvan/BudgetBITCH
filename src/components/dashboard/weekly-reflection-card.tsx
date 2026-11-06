// src/components/dashboard/weekly-reflection-card.tsx
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Send, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePsychologyStorage } from '@/hooks/use-psychology-storage';

export function WeeklyReflectionCard() {
  const { reflectionDue, saveReflection } = usePsychologyStorage();
  const [dismissed, setDismissed] = useState(false);
  const [sentiment, setSentiment] = useState<'peaceful' | 'stretched' | 'overwhelmed'>('peaceful');
  const [celebration, setCelebration] = useState('');
  const [intention, setIntention] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!reflectionDue || dismissed) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveReflection({
      sentiment,
      celebrationNote: celebration || 'Mindful logging consistency',
      focalIntention: intention || 'Keep discretionary burn paced',
    });
    setSubmitted(true);
    setTimeout(() => {
      setDismissed(true);
    }, 2500);
  };

  return (
    <div
      data-testid="weekly-reflection-card"
      className="relative overflow-hidden rounded-2xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-neutral-900 to-amber-950/20 p-5 shadow-xl text-left mb-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-400/20 text-amber-400">
            <Heart className="h-4 w-4" />
          </span>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
            Weekly Mindful Check-In (Shame-Free)
          </span>
        </div>

        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-white/40 hover:text-white transition-colors"
          aria-label="Dismiss check-in"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <AnimatePresence mode="wait">
        {submitted ? (
          <motion.div
            key="submitted"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="py-4 flex items-center gap-3 text-emerald-400 text-sm font-semibold"
          >
            <CheckCircle2 className="h-5 w-5" />
            <span>Thank you for checking in with yourself. Intention set for the week!</span>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-xs text-white/80">
              How did your relationship with money feel over the past 7 days?
            </p>

            {/* Sentiment Choices */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'peaceful', label: '🟢 Peaceful & In Control' },
                { key: 'stretched', label: '🟡 A Bit Stretched' },
                { key: 'overwhelmed', label: '🔴 Anxious / Overwhelmed' },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setSentiment(opt.key as 'peaceful' | 'stretched' | 'overwhelmed')}
                  className={`rounded-xl p-2.5 text-xs font-semibold border transition-all text-center ${
                    sentiment === opt.key
                      ? 'border-amber-400 bg-amber-400/20 text-white'
                      : 'border-white/10 bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Intention Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                  One Win or Celebration:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cooked meals at home 4 nights"
                  value={celebration}
                  onChange={(e) => setCelebration(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-white/50 mb-1">
                  One Small Intention This Week:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pause 24h before any online purchase"
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  className="w-full rounded-xl bg-black/40 border border-white/10 px-3 py-2 text-xs text-white placeholder-white/30 focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button
                type="submit"
                size="sm"
                className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold flex items-center gap-1.5"
              >
                <Send className="h-3 w-3" />
                <span>Save Reflection</span>
              </Button>
            </div>
          </form>
        )}
      </AnimatePresence>
    </div>
  );
}
