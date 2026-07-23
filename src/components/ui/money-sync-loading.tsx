// src/components/ui/money-sync-loading.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Wallet, RefreshCw, ShieldCheck } from 'lucide-react';

interface MoneySyncLoadingProps {
  locale?: 'th' | 'en';
  message?: string;
}

export function MoneySyncLoading({ locale = 'en', message }: MoneySyncLoadingProps) {
  const isThai = locale === 'th';

  return (
    <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center bg-[#080600]/95 text-white backdrop-blur-2xl px-4 py-8 select-none overflow-hidden">
      {/* Background Gold Ambient Glows */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Glassmorphism Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.92, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-md rounded-3xl border border-amber-400/30 bg-zinc-950/90 p-6 md:p-8 shadow-[0_0_50px_rgba(245,215,66,0.15)] text-center space-y-6"
      >
        {/* Top Header Badge */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <span className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-amber-400">
            <RefreshCw className="h-4 w-4 animate-spin text-amber-400" />
            <span>{isThai ? 'กำลังซิงค์กระแสเงิน' : 'MONEY FLOW ENGINE'}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="h-3 w-3" />
            <span>{isThai ? 'เรียลไทม์' : 'SECURE LIVE'}</span>
          </span>
        </div>

        {/* Headline / Message */}
        <div className="space-y-1">
          <h3 className="text-lg md:text-xl font-black uppercase tracking-wide text-white font-space-grotesk">
            {message || (isThai ? 'คำนวณรายรับ & รายจ่าย...' : 'Calculating Money In & Money Out...')}
          </h3>
          <p className="text-xs text-zinc-400">
            {isThai ? 'กำลังจัดสรรงบประมาณคงเหลือสุทธิอย่างเที่ยงตรง' : 'Synchronizing inflows, fixed expenses, and net disposable funds'}
          </p>
        </div>

        {/* Money In vs Money Out Interactive Visualizers */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* MONEY IN PANEL */}
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-left relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>{isThai ? 'เงินเข้า (MONEY IN)' : 'MONEY IN'}</span>
              </span>
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-emerald-300">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                +100%
              </motion.span>
            </div>
            <div className="mt-2 w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-400"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p className="mt-2 text-[9px] text-emerald-400/80 font-mono truncate">
              {isThai ? 'ซิงค์ช่องทางรายรับ' : 'Inflow Streams Ready'}
            </p>
          </div>

          {/* MONEY OUT PANEL */}
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 text-left relative overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-1">
                <TrendingDown className="h-3.5 w-3.5" />
                <span>{isThai ? 'เงินออก (MONEY OUT)' : 'MONEY OUT'}</span>
              </span>
            </div>
            <div className="text-xl md:text-2xl font-black font-mono text-amber-300">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              >
                TRACKED
              </motion.span>
            </div>
            <div className="mt-2 w-full h-1 bg-zinc-900 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-amber-400"
                initial={{ width: '0%' }}
                animate={{ width: '85%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
            </div>
            <p className="mt-2 text-[9px] text-amber-400/80 font-mono truncate">
              {isThai ? 'ตรวจสอบรายจ่ายคงที่' : 'Expenses & Bills Balanced'}
            </p>
          </div>
        </div>

        {/* NET FUNDS AVAILABLE PULSE BAR */}
        <div className="rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-400/10 via-yellow-400/5 to-amber-400/10 p-4 text-left space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-amber-300 flex items-center gap-1.5">
              <Wallet className="h-4 w-4 text-amber-400" />
              <span>{isThai ? 'เงินคงเหลือสุทธิ (FUNDS AVAILABLE)' : 'FUNDS AVAILABLE (NET)'}</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
              100% ACCURATE
            </span>
          </div>
          <div className="w-full h-2 bg-black/60 rounded-full overflow-hidden p-0.5 border border-amber-400/20">
            <motion.div 
              className="h-full bg-gradient-to-r from-amber-300 to-yellow-500 rounded-full"
              initial={{ width: '10%' }}
              animate={{ width: ['10%', '90%', '100%'] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
