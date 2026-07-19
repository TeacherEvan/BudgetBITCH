// components/dashboard/priority-guide.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { useWizardProfile, useBudgets, useBills } from '@/hooks/use-local-db';
import { useLocale } from 'next-intl';

export type AlertTier = 'critical' | 'warning' | 'info';

export interface PriorityAlert {
  id: string;
  tier: AlertTier;
  title: string;
  body: string;
  cta?: { label: string; href: string };
}

const CRITICAL_SESSION_KEY = 'bb:critical-suppressed';
const WARNING_SESSION_KEY = 'bb:warn-suppressed';

export function readSessionSet(key: string): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = sessionStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function writeSessionSet(key: string, set: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/**
 * Computes the active priority alerts from the same local data the dashboard
 * already loads. No new data fetching. Pure derivation; dismissal is handled
 * by the consuming component (PriorityGuide / shell badge).
 */
export function usePriorityAlerts(locale: 'th' | 'en'): PriorityAlert[] {
  const { profile } = useWizardProfile();
  const { budgets, loading: budgetsLoading } = useBudgets();
  const { bills } = useBills();

  return useMemo(() => {
    const list: PriorityAlert[] = [];

    const noIncome = !profile || !profile.completed || !profile.answers?.income;
    const zeroBudgets = !budgetsLoading && budgets.length === 0;

    if (noIncome) {
      list.push({
        id: 'critical:income',
        tier: 'critical',
        title: locale === 'th' ? 'ยังไม่ได้ตั้งค่ารายได้' : "You haven't set your income yet",
        body: locale === 'th'
          ? 'ไม่มีรายได้ งบประจำวันจะแสดง ₿0 โปรดตั้งค่าเพื่อเริ่มต้น'
          : 'Without this, your daily budget shows ₿0. Set up now to begin.',
        cta: { label: locale === 'th' ? 'ตั้งค่าเลย' : 'Set Up Now', href: '/wizard' },
      });
    } else if (zeroBudgets) {
      list.push({
        id: 'critical:budgets',
        tier: 'critical',
        title: locale === 'th' ? 'ยังไม่ได้กำหนดงบประมาณ' : 'No budgets configured',
        body: locale === 'th'
          ? 'ตั้งค่างบประมาณเพื่อให้ระบบแจ้งเตือนการใช้จ่ายได้'
          : 'Configure your budgets so the system can warn you about overspending.',
        cta: { label: locale === 'th' ? 'ตั้งค่าเลย' : 'Set Up Now', href: '/wizard' },
      });
    }

    // WARNING: bills due within 7 days
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const dueSoon = bills.find(b => {
      if (!b.isActive) return false;
      const diff = (((b.dueDay - dayOfMonth) % daysInMonth) + daysInMonth) % daysInMonth;
      return diff > 0 && diff <= 7;
    });
    if (dueSoon) {
      list.push({
        id: 'warning:bill-due',
        tier: 'warning',
        title: locale === 'th' ? 'บิลครบกำหนดเร็วๆ นี้' : 'Bill due within 7 days',
        body: locale === 'th'
          ? `${dueSoon.name} ครบกำหนดวันที่ ${dueSoon.dueDay} จำนวน ${dueSoon.amount.toLocaleString()}`
          : `${dueSoon.name} is due on the ${dueSoon.dueDay}th (${dueSoon.amount.toLocaleString()})`,
      });
    }

    // INFO: setup tip
    if (profile?.completed && profile.answers?.income && budgets.length > 0) {
      list.push({
        id: 'info:tip',
        tier: 'info',
        title: locale === 'th' ? 'คำแนะนำ' : 'Pro tip',
        body: locale === 'th'
          ? 'กดที่แผงด้านข้างเพื่อเปิด/ปิดบอร์ดที่คุณต้องการดู'
          : 'Tap a panel in the sidebar to show or hide the boards you care about.',
      });
    }

    return list;
  }, [profile, budgets, budgetsLoading, bills, locale]);
}

export function PriorityGuide() {
  const locale = useLocale() as 'th' | 'en';
  const router = useRouter();
  const alerts = usePriorityAlerts(locale);

  const [dismissed, setDismissed] = useState<Set<string>>(() => new Set([
    ...readSessionSet(CRITICAL_SESSION_KEY),
    ...readSessionSet(WARNING_SESSION_KEY),
  ]));

  // INFO tips auto-dismiss after 10s
  useEffect(() => {
    const infoIds = alerts.filter(a => a.tier === 'info').map(a => a.id);
    if (infoIds.length === 0) return;
    const timers = infoIds.map(id => setTimeout(() => dismiss(id), 10000));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);

  function dismiss(id: string) {
    const alert = alerts.find(a => a.id === id);
    const next = new Set(dismissed);
    next.add(id);
    setDismissed(next);
    if (alert?.tier === 'critical') {
      const s = readSessionSet(CRITICAL_SESSION_KEY);
      s.add(id);
      writeSessionSet(CRITICAL_SESSION_KEY, s);
    } else if (alert?.tier === 'warning') {
      const s = readSessionSet(WARNING_SESSION_KEY);
      s.add(id);
      writeSessionSet(WARNING_SESSION_KEY, s);
    }
  }

  const visible = alerts.filter(a => !dismissed.has(a.id));
  if (visible.length === 0) return null;

  return (
    <div className="bb-status-strip flex flex-col gap-2 px-3 py-2 lg:px-4">
      <AnimatePresence initial={false}>
        {visible.map(alert => {
          const tierClass =
            alert.tier === 'critical'
              ? 'bb-priority-critical'
              : alert.tier === 'warning'
                ? 'bb-priority-warning'
                : 'bb-priority-info';
          const Icon = alert.tier === 'critical' ? AlertCircle : alert.tier === 'warning' ? AlertTriangle : Info;
          const color =
            alert.tier === 'critical'
              ? 'var(--danger)'
              : alert.tier === 'warning'
                ? 'var(--warning)'
                : 'var(--success)';
          const badge =
            alert.tier === 'critical'
              ? (locale === 'th' ? 'สำคัญ' : 'CRITICAL')
              : alert.tier === 'warning'
                ? (locale === 'th' ? 'แจ้งเตือน' : 'WARNING')
                : (locale === 'th' ? 'ข้อมูล' : 'INFO');

          return (
            <motion.div
              key={alert.id}
              layout
              initial={{ opacity: 0, y: -12, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className={`relative rounded-lg ${tierClass} bg-[var(--bg-surface-1)] px-3 py-2.5 pr-10 flex items-start gap-3 overflow-hidden`}
            >
              {alert.tier === 'critical' && (
                <span
                  aria-hidden
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    boxShadow: '0 0 0 0 rgba(232,64,64,0)',
                    animation: 'bb-pulse-ring 2.4s ease-out infinite',
                  }}
                />
              )}
              <Icon size={20} style={{ color, flexShrink: 0, marginTop: 1 }} aria-hidden />
              <div className="flex-1 min-w-0">
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color }}
                >
                  [{badge}]
                </span>
                <p className="text-sm font-medium text-[var(--text-1)] leading-snug mt-0.5">
                  {alert.title}
                </p>
                <p className="text-xs text-[var(--text-2)] mt-0.5 leading-snug">
                  {alert.body}
                </p>
                {alert.cta && (
                  <button
                    onClick={() => router.push(alert.cta!.href)}
                    className="mt-1.5 text-xs font-bold text-[var(--gold-bright)] hover:text-[var(--gold-glow)] transition-colors"
                  >
                    {alert.cta.label} →
                  </button>
                )}
              </div>
              <button
                onClick={() => dismiss(alert.id)}
                aria-label={locale === 'th' ? 'ปิด' : 'Dismiss'}
                className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-1)] hover:bg-white/5 transition-colors"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
