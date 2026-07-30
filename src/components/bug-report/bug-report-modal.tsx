// components/bug-report/bug-report-modal.tsx
'use client';

import { useState } from 'react';
import { Bug, Send, CheckCircle2, Terminal, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { getUserActionLogs } from '@/lib/utils/action-logger';

interface BugReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  locale?: string;
}

export function BugReportModal({
  isOpen,
  onClose,
  userEmail,
  locale = 'en',
}: BugReportModalProps) {
  const reportMutation = useMutation(api.feedback.report);

  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Read once per render for the preview; the actual submit reads a fresh buffer
  // at send time (see handleSubmit) so it captures activity up to the click.
  const actionLogs = getUserActionLogs();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Please enter bug description');
      return;
    }

    setError(null);
    setSubmitting(true);

    // Read the action log buffer at send time (not during render) so it reflects
    // the actual session activity and avoids an SSR/CSR hydration mismatch.
    const actionLogs = getUserActionLogs();

    try {
      await reportMutation({
        type: 'bug',
        message: message.trim(),
        email: userEmail || undefined,
        actionLogs,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
        locale,
      });

      setSubmitted(true);
      setTimeout(() => {
        setMessage('');
        setSubmitted(false);
        onClose();
      }, 1800);
    } catch (err) {
      console.error('Failed to submit bug report:', err);
      setError('Failed to send bug report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={'Report a Bug'}
      size="md"
    >
      {submitted ? (
        <div className="py-8 text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white">
            {'Bug Report Sent!'}
          </h3>
          <p className="text-sm text-white/70 max-w-sm mx-auto">
            {'Thank you. Your notes and last 20 feature action logs have been sent to the admin dashboard.'}
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5 py-2">
          <div className="flex items-start gap-3 p-3.5 bg-amber-400/10 border border-amber-400/20 rounded-xl text-xs text-amber-300">
            <Bug className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-200">
                {'Reports go to the in-app Admin Dashboard'}
              </p>
              <p className="text-amber-300/80 mt-0.5 leading-relaxed">
                {'Automatically attaches your last 20 feature actions & process logs to help debug fast (no email is sent).'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-white/70">
              {'Bug Description / Notes'}
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                'Describe what happened, what feature was used, or unexpected behavior...'
              }
              rows={4}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-amber-400/60 focus:ring-1 focus:ring-amber-400/60"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action logs preview dropdown */}
          <div className="border border-white/10 rounded-xl overflow-hidden bg-black/40">
            <button
              type="button"
              onClick={() => setShowLogs(!showLogs)}
              className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-white/70 hover:text-white hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {`Attached Action Logs (${actionLogs.length} entries)`}
                </span>
              </div>
              <span className="text-[10px] text-amber-400 font-mono">
                {showLogs ? ('Hide') : ('View')}
              </span>
            </button>

            {showLogs && (
              <div className="p-3 bg-black border-t border-white/10 max-h-40 overflow-y-auto font-mono text-[11px] text-amber-300/80 space-y-1 scrollbar-thin">
                {actionLogs.length > 0 ? (
                  actionLogs.map((log, idx) => <div key={idx}>{log}</div>)
                ) : (
                  <div className="text-white/40 italic">
                    {'No action logs recorded in this session yet.'}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={submitting}
              className="text-xs"
            >
              {'Cancel'}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={submitting || !message.trim()}
              isLoading={submitting}
              className="text-xs gap-2 bg-amber-400 text-black hover:bg-amber-300 font-semibold"
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? ('Sending...') : ('Send Bug Report')}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
