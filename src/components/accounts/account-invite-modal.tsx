// src/components/accounts/account-invite-modal.tsx
'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Users, QrCode, Link2 } from 'lucide-react';

interface AccountInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  inviteCode: string;
  inviteUrl: string;
  accountName: string;
  locale: 'th' | 'en';
}

export function AccountInviteModal({
  isOpen,
  onClose,
  inviteCode,
  inviteUrl,
  accountName,
  locale
}: AccountInviteModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const steps = locale === 'th' ? [
    { num: '1', text: 'คัดลอกรหัสหรือลิงก์คำเชิญสีทองด้านล่าง' },
    { num: '2', text: 'ส่งต่อให้เพื่อน คู่รัก หรือสมาชิกครอบครัวของคุณ' },
    { num: '3', text: 'เมื่อเปิดลิงก์และเข้าสู่ระบบ สมาชิกจะร่วมบอร์ดโดยอัตโนมัติ' }
  ] : [
    { num: '1', text: 'Copy the gold invite code or URL link below.' },
    { num: '2', text: 'Share it with your partner, family, or business partner.' },
    { num: '3', text: 'Once they log in via the link, they join the board automatically.' }
  ];

  const labels = {
    th: {
      title: 'เชิญเข้าร่วมบัญชีร่วมกัน',
      desc: 'ให้สมาชิกคนอื่นสแกน QR Code หรือใช้ลิงก์คำเชิญเพื่อเข้าถึงข้อมูลบอร์ดแบบเรียลไทม์:',
      code: 'รหัสคำเชิญ',
      copy: 'คัดลอกลิงก์',
      copied: 'คัดลอกแล้ว!',
      close: 'เสร็จสิ้น',
      instructions: 'ขั้นตอนการเข้าร่วมบอร์ด:'
    },
    en: {
      title: 'Invite to Shared Account',
      desc: 'Let other members scan this QR code or use the invite link to access real-time shared budget boards:',
      code: 'Invite Code',
      copy: 'Copy Link',
      copied: 'Copied Link!',
      close: 'Done',
      instructions: 'How to join this board:'
    }
  };

  const l = labels[locale] || labels.en;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${l.title} (${accountName})`}
      size="md"
    >
      <div className="space-y-4 py-1 text-center select-none">
        <p className="text-xs text-zinc-400 leading-relaxed text-left">
          {l.desc}
        </p>

        {/* 24k Gold Metallic Card Wrapper */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-400/35 bg-gradient-to-b from-amber-400/5 to-amber-400/10 p-5 shadow-[0_0_35px_rgba(245,215,66,0.15)] gap-4">
          <div className="relative rounded-2xl bg-zinc-950 p-3 border border-amber-400/20 shadow-inner">
            <QRCodeSVG 
              value={inviteUrl} 
              size={160} 
              bgColor="#080600" 
              fgColor="#F5D742" 
              level="M" 
              includeMargin
            />
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 border border-black shadow">
              <QrCode className="h-3.5 w-3.5 text-black font-bold" />
            </div>
          </div>

          <div className="w-full space-y-2">
            <div className="text-[10px] uppercase tracking-wider font-bold text-amber-400 flex items-center justify-center gap-1">
              <Link2 className="h-3 w-3" />
              <span>{l.code}</span>
            </div>

            <div className="font-mono text-sm font-semibold bg-black/40 px-3 py-1.5 rounded-lg border border-amber-400/20 text-amber-300 max-w-xs mx-auto">
              {inviteCode}
            </div>

            <div className="flex w-full items-center gap-2 max-w-sm mx-auto pt-2">
              <input
                type="text"
                readOnly
                value={inviteUrl}
                className="flex-1 truncate rounded-xl border border-zinc-800 bg-black/60 px-3.5 py-2 font-mono text-xs text-amber-300 outline-none cursor-default"
              />
              <Button 
                variant="primary" 
                onClick={handleCopy}
                className="shrink-0 bg-amber-400 hover:bg-amber-300 text-black font-bold px-3 py-2 rounded-xl text-xs h-auto flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    <span>{l.copied}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>{l.copy}</span>
                  </>
                )}
              </Button>
            </div>

            <a
              href={inviteUrl}
              className="block w-full truncate text-center text-xs text-amber-400 underline pt-1"
            >
              {inviteUrl}
            </a>
          </div>
        </div>

        {/* 3-Step Joining Guide */}
        <div className="space-y-3 pt-3 border-t border-zinc-800 text-left">
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span>{l.instructions}</span>
          </h4>
          <ul className="space-y-2.5">
            {steps.map((s, idx) => (
              <li key={idx} className="flex gap-3 items-start text-xs text-zinc-300 leading-relaxed">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-400/20 border border-amber-400/40 text-[10px] font-bold text-amber-400">
                  {s.num}
                </span>
                <span>{s.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} className="w-full text-xs py-2 px-4 h-auto">
            {l.close}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
