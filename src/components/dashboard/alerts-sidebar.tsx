// components/dashboard/alerts-sidebar.tsx
'use client';

import { useState, useEffect } from 'react';
import { AlertCircle, TrendingUp, Fuel, Zap, ShoppingBag, ExternalLink } from 'lucide-react';
import { NewsItem } from '@/lib/types/budget';
import { format } from 'date-fns';
import { th } from 'date-fns/locale';

const CATEGORY_ICONS: Record<NewsItem['category'], React.ReactNode> = {
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

async function fetchNewsAPI(locale: 'th' | 'en'): Promise<NewsItem[]> {
  const res = await fetch(`/api/news?locale=${locale}`, { 
    cache: 'no-store',
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to fetch news');
  const data = await res.json();
  return data.items || [];
}

export function AlertsSidebar({ locale }: { locale: 'th' | 'en' }) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    
    const loadNews = async () => {
      try {
        setLoading(true);
        const items = await fetchNewsAPI(locale);
        if (mounted) {
          // Sort by actionable first, then by date
          const sorted = items.sort((a, b) => {
            if (a.actionable && !b.actionable) return -1;
            if (!a.actionable && b.actionable) return 1;
            return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
          });
          setNews(sorted.slice(0, 10));
          setError(null);
        }
      } catch {
        if (mounted) {
          setError(locale === 'th' ? 'โหลดข่าวไม่สำเร็จ' : 'Failed to load news');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadNews();
    return () => { mounted = false; };
  }, [locale]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-white/50">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-white text-lg">
          {locale === 'th' ? 'ข่าวและข้อมูลล่าสุด' : 'Latest Updates'}
        </h3>
      </div>

      {news.length === 0 ? (
        <div className="text-center py-8 text-white/50">
        <p>{locale === 'th' ? '📡 ยังไม่มีข่าวล่าสุดในพื้นที่ — ไว้กลับมาดูใหม่ทีหลัง เราค้นหาราคาน้ำมัน โปรโมชั่น และข่าวที่กระทบงบคุณ' : '📡 No local updates right now — check back later. We scan for fuel prices, deals, and news that affect your budget.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {news.map((item) => (
            <article
              key={item.link}
              className="group p-4 rounded-xl bg-black/30 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {CATEGORY_ICONS[item.category]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-amber-400 uppercase">
                      {CATEGORY_LABELS[item.category][locale]}
                    </span>
                    <span className="text-xs text-white/40">
                      {format(new Date(item.pubDate), locale === 'th' ? 'd MMM yyyy' : 'MMM d, yyyy', { locale: locale === 'th' ? th : undefined })}
                    </span>
                  </div>
                  <h4 className="font-medium text-white text-sm line-clamp-2 group-hover:text-amber-400 transition-colors">
                    {item.title}
                  </h4>
                  {item.actionable && (
                    <p className="mt-2 text-sm text-amber-400 font-medium flex items-center gap-1">
                      <span>💡</span>
                      {item.actionable}
                    </p>
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
            </article>
          ))}
        </div>
      )}
    </div>
  );
}