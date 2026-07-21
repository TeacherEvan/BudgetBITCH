// components/pwa/install-prompt.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { Download, X, Share2, Plus, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function PWAInstallPrompt({ 
  onDismiss, 
  locale = 'en' 
}: { 
  onDismiss?: () => void;
  locale?: 'th' | 'en';
}) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [supportsInstallEvent, setSupportsInstallEvent] = useState(false);
  const [waitingForPrompt, setWaitingForPrompt] = useState(false);
  const installRequestedRef = useRef(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    
    // Check if the browser supports the beforeinstallprompt event
    setSupportsInstallEvent(typeof window !== 'undefined' && ('beforeinstallprompt' in window || 'BeforeInstallPromptEvent' in window));

    // Check if running in standalone mode (already installed)
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        (window.navigator as any).standalone === true;
      setIsStandalone(isStandaloneMode);
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream);
      
      // If not installed, trigger banner after 3 seconds
      if (!isStandaloneMode) {
        setTimeout(() => {
          if (mountedRef.current) {
            // Check if dismissed in this session
            const dismissed = sessionStorage.getItem('budgetbitch:pwaDismissed');
            if (!dismissed) {
              setShowPrompt(true);
            }
          }
        }, 3000);
      }
    };

    checkStandalone();

    const handler = (e: Event) => {
      const promptEvent = e as BeforeInstallPromptEvent;
      promptEvent.preventDefault();
      setDeferredPrompt(promptEvent);
      setShowPrompt(true);
      setWaitingForPrompt(false);
      
      // If the user already clicked "Install" before the event fired,
      // trigger the native browser install request immediately!
      if (installRequestedRef.current) {
        promptEvent.prompt();
        installRequestedRef.current = false;
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      mountedRef.current = false;
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
        setDeferredPrompt(null);
        onDismiss?.();
      }
    } else if (supportsInstallEvent) {
      // Browser supports native install prompt but event hasn't fired yet
      installRequestedRef.current = true;
      setWaitingForPrompt(true);
    } else {
      // Browser doesn't support programmatic install (e.g. iOS Safari or Firefox desktop)
      setShowHelpModal(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('budgetbitch:pwaDismissed', 'true');
    onDismiss?.();
  };

  // If already installed, do not render banner
  if (isStandalone || !showPrompt) return null;

  const labels = {
    th: {
      title: 'ติดตั้ง BudgetBITCH',
      description: 'เพิ่มลงหน้าจอหลักเพื่อเข้าถึงง่ายขึ้น ทำงานออฟไลน์ได้',
      install: 'ติดตั้ง',
      preparing: 'กำลังเตรียมการ...',
      later: 'ภายหลัง',
      helpTitle: 'วิธีติดตั้งแอป',
      close: 'ปิด',
      iosSteps: [
        'แตะปุ่มแชร์ 📤 ในแถบเครื่องมือของ Safari ด้านล่าง',
        'เลื่อนลงมาแล้วเลือก "เพิ่มลงหน้าจอโฮม" (Add to Home Screen) ➕',
        'แตะ "เพิ่ม" (Add) ที่มุมขวาบน',
      ],
      androidSteps: [
        'แตะปุ่มเมนู (จุด 3 จุด) ที่มุมขวาบนของเบราว์เซอร์',
        'เลือก "ติดตั้งแอป" (Install app) หรือ "เพิ่มลงหน้าจอหลัก"',
        'กดตกลงเพื่อติดตั้ง',
      ],
      desktopSteps: [
        'คลิกไอคอนติดตั้ง (รูปหน้าจอพร้อมลูกศรชี้ลง) ในแถบที่อยู่ URL ด้านบนขวา',
        'คลิก "ติดตั้ง" (Install) เพื่อยืนยัน',
      ]
    },
    en: {
      title: 'Install BudgetBITCH',
      description: 'Add to home screen for quick access. Works offline.',
      install: 'Install',
      preparing: 'Preparing...',
      later: 'Later',
      helpTitle: 'How to Install PWA',
      close: 'Close',
      iosSteps: [
        'Tap the Share button 📤 in Safari\'s navigation bar.',
        'Scroll down and select "Add to Home Screen" ➕',
        'Tap "Add" in the top-right corner.',
      ],
      androidSteps: [
        'Tap the Menu button (3 dots) in the browser\'s top-right corner.',
        'Select "Install app" or "Add to Home screen".',
        'Confirm the installation prompts.',
      ],
      desktopSteps: [
        'Click the Install icon (monitor with down arrow) in the URL address bar.',
        'Click "Install" in the confirmation popup.',
      ]
    },
  };

  const l = labels[locale];

  return (
    <>
      <div className="fixed bottom-4 left-4 right-4 md:bottom-6 md:left-auto md:right-6 md:w-96 z-50 animate-in slide-up">
        <div className="bg-black/95 backdrop-blur-xl border border-amber-400/30 rounded-2xl p-5 shadow-2xl">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 flex items-center justify-center flex-shrink-0">
                <Download className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">{l.title}</h3>
                <p className="text-xs text-white/70 mt-0.5">{l.description}</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/50 hover:text-white transition-colors p-1 flex-shrink-0"
              aria-label="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="mt-4 flex gap-3">
            <Button 
              variant="primary" 
              onClick={handleInstall}
              isLoading={waitingForPrompt}
              className="flex-1 text-xs py-2 h-auto"
            >
              {waitingForPrompt ? l.preparing : l.install}
            </Button>
            <Button 
              variant="ghost" 
              onClick={handleDismiss}
              className="flex-1 text-xs py-2 h-auto"
            >
              {l.later}
            </Button>
          </div>
        </div>
      </div>

      {/* Manual PWA Install Guidance Modal */}
      <Modal
        isOpen={showHelpModal}
        onClose={() => setShowHelpModal(false)}
        title={l.helpTitle}
        size="md"
      >
        <div className="space-y-4 py-1 text-left">
          <div className="flex gap-3 bg-amber-400/10 border border-amber-400/20 rounded-xl p-3.5 text-xs text-amber-300">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {locale === 'th' 
                ? 'เบราว์เซอร์ของคุณยังไม่รองรับการติดตั้งแบบอัตโนมัติ กรุณาทำตามวิธีติดตั้งด้านล่างสำหรับเครื่องของคุณ:' 
                : 'Your browser does not support automatic installation. Please follow the instructions below for your device:'}
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-white text-xs uppercase tracking-wider text-amber-400">
              {isIOS ? 'Apple iOS (Safari)' : 'Android / Mobile Browser'}
            </h4>
            <ol className="list-decimal pl-5 space-y-2 text-xs text-white/80">
              {isIOS 
                ? l.iosSteps.map((step, idx) => <li key={idx} className="leading-relaxed">{step}</li>)
                : l.androidSteps.map((step, idx) => <li key={idx} className="leading-relaxed">{step}</li>)
              }
            </ol>
          </div>

          {!isIOS && (
            <div className="space-y-3 pt-2 border-t border-white/10">
              <h4 className="font-bold text-white text-xs uppercase tracking-wider text-amber-400">
                Desktop (Chrome / Edge / Safari)
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-xs text-white/80">
                {l.desktopSteps.map((step, idx) => <li key={idx} className="leading-relaxed">{step}</li>)}
              </ol>
            </div>
          )}

          <div className="pt-4 flex justify-end">
            <Button variant="secondary" onClick={() => setShowHelpModal(false)} className="w-full sm:w-auto text-xs py-2 px-4 h-auto">
              {l.close}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}