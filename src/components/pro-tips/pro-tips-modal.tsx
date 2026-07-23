// src/components/pro-tips/pro-tips-modal.tsx
'use client';

import React from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { ProTip } from '@/lib/data/pro-tips';
import { Shield, Camera, LayoutGrid, CheckCircle2, Info } from 'lucide-react';

interface ProTipsModalProps {
  tip: ProTip | null;
  isOpen: boolean;
  onClose: () => void;
  locale: 'th' | 'en';
}

export function ProTipsModal({ tip, isOpen, onClose, locale }: ProTipsModalProps) {
  if (!tip) return null;

  const renderIllustration = () => {
    switch (tip.illustrationType) {
      case 'chart':
        return (
          <div className="flex h-36 items-end justify-around rounded-xl bg-zinc-950 p-4 border border-amber-400/20">
            <div className="flex flex-col items-center gap-1.5 w-16">
              <span className="text-[10px] text-zinc-400">Needs</span>
              <div className="w-full bg-emerald-500/25 border border-emerald-500 h-16 rounded-t-lg flex items-center justify-center text-xs font-bold text-emerald-400">50%</div>
            </div>
            <div className="flex flex-col items-center gap-1.5 w-16">
              <span className="text-[10px] text-zinc-400">Wants</span>
              <div className="w-full bg-amber-500/25 border border-amber-500 h-10 rounded-t-lg flex items-center justify-center text-xs font-bold text-amber-400">30%</div>
            </div>
            <div className="flex flex-col items-center gap-1.5 w-16">
              <span className="text-[10px] text-zinc-400">Wealth</span>
              <div className="w-full bg-blue-500/25 border border-blue-500 h-8 rounded-t-lg flex items-center justify-center text-xs font-bold text-blue-400">20%</div>
            </div>
          </div>
        );
      case 'gauge':
        return (
          <div className="flex flex-col h-36 items-center justify-center rounded-xl bg-zinc-950 p-4 border border-amber-400/20 gap-2">
            <div className="text-3xl font-black text-amber-400">$42.50</div>
            <div className="text-[10px] uppercase tracking-wider text-zinc-400">Remaining Spending Limit Today</div>
            <div className="w-full max-w-xs bg-zinc-800 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-amber-500 to-yellow-300 h-full w-[65%]" />
            </div>
          </div>
        );
      case 'camera':
        return (
          <div className="flex h-36 items-center justify-center rounded-xl bg-zinc-950 p-4 border border-amber-400/20 gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-400/10 border border-amber-400/30">
              <Camera className="h-8 w-8 text-amber-400" />
            </div>
            <div className="text-left text-xs space-y-1">
              <div className="font-semibold text-white">Gemini 2.5 Flash Parser</div>
              <div className="text-zinc-400">✓ Merchant: Starbucks</div>
              <div className="text-zinc-400">✓ Amount: $12.50</div>
            </div>
          </div>
        );
      case 'shortcuts':
        return (
          <div className="flex h-36 items-center justify-center rounded-xl bg-zinc-950 p-4 border border-amber-400/20 gap-3">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-3 shadow-md flex items-center gap-2">
              <LayoutGrid className="h-6 w-6 text-amber-400" />
              <div className="text-left">
                <div className="text-[10px] font-bold text-white uppercase">App Shortcut</div>
                <div className="text-xs text-zinc-400">Quick Add Transaction</div>
              </div>
            </div>
          </div>
        );
      case 'shield':
      default:
        return (
          <div className="flex h-36 items-center justify-center rounded-xl bg-zinc-950 p-4 border border-amber-400/20 gap-3">
            <Shield className="h-10 w-10 text-amber-400 animate-pulse" />
            <div className="text-left">
              <div className="text-xs font-bold text-white">Lossless Local Cache</div>
              <div className="text-[10px] text-zinc-400">Auto-Encrypts local database snapshot</div>
            </div>
          </div>
        );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={tip.title}
      size="md"
    >
      <div className="space-y-4 py-1 text-left">
        <div className="text-xs text-zinc-400 flex items-center gap-1.5 uppercase tracking-wider font-semibold text-amber-400">
          <Info className="h-3.5 w-3.5" />
          <span>Category: {tip.category}</span>
        </div>

        <p className="text-sm text-white/90 leading-relaxed font-medium">
          {tip.summary}
        </p>

        {renderIllustration()}

        <div className="space-y-2.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">Action Plan Steps:</h4>
          <ol className="space-y-2">
            {tip.steps.map((step, idx) => (
              <li key={idx} className="flex gap-2.5 items-start text-xs text-zinc-300 leading-relaxed">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="pt-4 flex justify-end">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto text-xs py-2 px-4 h-auto">
            {locale === 'th' ? 'ปิดหน้านี้' : 'Close Details'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
