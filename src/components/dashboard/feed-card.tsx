'use client';

import { motion } from 'framer-motion';
import { ExternalLink, Fuel, TrendingUp, Zap, ShoppingBag, AlertCircle } from 'lucide-react';
import { NewsItem } from '@/lib/types/budget';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const CATEGORY_ICONS = {
  finance: <TrendingUp className="w-5 h-5 text-amber-400" />,
  economy: <Zap className="w-5 h-5 text-blue-400" />,
  local: <AlertCircle className="w-5 h-5 text-emerald-400" />,
  eco_tips: <Zap className="w-5 h-5 text-emerald-400" />,
  fuel: <Fuel className="w-5 h-5 text-rose-400" />,
  deals: <ShoppingBag className="w-5 h-5 text-amber-400" />,
};

const CATEGORY_LABELS: Record<NewsItem['category'], { th: string; en: string }> = {
  finance: { th: 'การเงิน', en: 'Finance' },
  economy: { th: 'เศรษฐกิจ', en: 'Economy' },
  local: { th: 'ท้องถิ่น', en: 'Local' },
  eco_tips: { th: 'เคล็ดลับ', en: 'Tips' },
  fuel: { th: 'น้ำมัน', en: 'Fuel' },
  deals: { th: 'โปรโมชั่น', en: 'Deals' },
};

interface FeedCardProps {
  item: NewsItem;
  locale: 'th' | 'en';
  index: number;
}

export function FeedCard({ item, locale, index }: FeedCardProps) {
  const isActionable = !!item.actionable;

  return (
    <motion.article
      className="group p-4 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition-colors relative overflow-hidden"
      whileHover={{ y: -2, boxShadow: '0 8px 32px rgba(245, 215, 66, 0.08)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ transitionDelay: `${index * 0.05}s` }}
    >
      {/* Gold shimmer sweep on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--gold-glow)]/10 to-transparent"
        initial={{ x: '-100%' }}
        whileHover={{ x: '100%' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      <div className="flex items-start gap-3 relative z-10">
        <div className="flex-shrink-0 mt-0.5">
          {CATEGORY_ICONS[item.category]}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-medium text-amber-400 uppercase">
              {CATEGORY_LABELS[item.category][locale]}
            </span>
            <span className="text-xs text-white/40">
              {format(
                new Date(item.pubDate),
                locale === 'th' ? 'd MMM yyyy' : 'MMM d, yyyy',
                { locale: locale === 'th' ? th : undefined }
              )}
            </span>
          </div>

          <h4 className="font-medium text-white text-sm group-hover:text-amber-400 transition-colors line-clamp-2">
            {item.title}
          </h4>

          {isActionable && (
            <motion.p
              className="mt-2 text-sm text-amber-400 font-medium flex items-center gap-1 animate-pulse"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0, scale: [1, 1.02, 1] }}
              transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 20, duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span>💡</span>
              {item.actionable}
            </motion.p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-white/50">{item.source}</span>
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              {locale === 'th' ? 'อ่านต่อ' : 'Read more'}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.article>
  );
}