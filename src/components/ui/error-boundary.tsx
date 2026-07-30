// components/ui/error-boundary.tsx
'use client';

import { Component, type ReactNode } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  locale?: 'th' | 'en';
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // Persist to console for local debugging; admin notification is user-triggered
    // via the Report Bug button to avoid silent data egress.
    console.error('[ErrorBoundary]', error, info);
  }

  private handleReport = () => {
    const { error } = this.state;
    const context = error ? `${error.name}: ${error.message}\n${error.stack ?? ''}` : '';
    const subject = encodeURIComponent('Budget Boss Bug Report');
    const body = encodeURIComponent(
      `What happened?\n\n\n--- Technical context (auto-captured) ---\n${context}\n\nUser-Agent: ${typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'}`,
    );
    const mailto = `mailto:admin@budgetbitch.app?subject=${subject}&body=${body}`;
    window.open(mailto, '_blank');
  };

  render() {
    if (this.state.hasError) {
      const isThai = this.props.locale === 'th';
      const { error } = this.state;
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-400/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-400" />
            </div>
            <h1 className="text-xl font-semibold text-white">
              {isThai ? 'เกิดข้อผิดพลาด' : 'Something Went Wrong'}
            </h1>
            {error?.message && (
              <p className="text-sm text-white/60 break-words">
                {error.message}
              </p>
            )}
            <p className="text-sm text-white/60">
              {isThai
                ? 'แอปพบข้อผิดพลาด คุณสามารถรายงานปัญหาได้หรือโหลดหน้าใหม่'
                : 'The app hit an unexpected error. You can report it or reload.'}
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <Button
                variant="primary"
                onClick={this.handleReport}
                className="w-full gap-2 justify-center"
                data-testid="report-bug-btn"
              >
                <Send className="w-4 h-4" />
                {isThai ? 'รายงานปัญหา' : 'Report Bug'}
              </Button>
              <Button variant="secondary" onClick={() => window.location.reload()} className="w-full">
                {isThai ? 'โหลดใหม่' : 'Reload'}
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
