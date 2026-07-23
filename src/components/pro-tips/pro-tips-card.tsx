// src/components/pro-tips/pro-tips-card.tsx
'use client';

import React, { useState } from 'react';
import { ProTip, getRandomProTip } from '@/lib/data/pro-tips';
import { ProTipsModal } from './pro-tips-modal';
import { Sparkles, ArrowRight, Lightbulb } from 'lucide-react';

interface ProTipsCardProps {
  locale: 'th' | 'en';
}

export function ProTipsCard({ locale }: ProTipsCardProps) {
  const [currentTip] = useState<ProTip>(() => getRandomProTip());
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <div 
        onClick={() => setModalOpen(true)}
        className="group relative cursor-pointer overflow-hidden rounded-[1.15rem] border border-amber-400/20 bg-amber-400/5 p-4 shadow-sm hover:border-amber-400/40 hover:bg-amber-400/10 transition-all duration-200 active:scale-[0.99] text-left"
      >
        {/* Glow accent */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-16 w-16 bg-amber-400/10 rounded-full blur-xl group-hover:bg-amber-400/25 transition-all duration-300" />
        
        <div className="flex gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400/20 border border-amber-400/30">
            <Lightbulb className="h-4 w-4 text-amber-400 animate-pulse" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                <Sparkles className="h-3 w-3" />
                {locale === 'th' ? 'เคล็ดลับฉบับบอส' : 'BOSS PRO-TIP'}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-amber-400 opacity-60 group-hover:translate-x-1 transition-transform" />
            </div>
            <h4 className="mt-1 text-sm font-semibold text-white group-hover:text-amber-300 transition-colors">
              {currentTip.title}
            </h4>
            <p className="mt-0.5 text-xs text-white/70 leading-relaxed truncate">
              {currentTip.teaser}
            </p>
          </div>
        </div>
      </div>

      <ProTipsModal
        tip={currentTip}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        locale={locale}
      />
    </>
  );
}
