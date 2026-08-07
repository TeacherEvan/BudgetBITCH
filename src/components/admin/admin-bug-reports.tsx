// components/admin/admin-bug-reports.tsx
'use client';

import { useState } from 'react';
import { Bug, Terminal, ChevronDown, ChevronUp, User, Calendar, ShieldCheck, Trash2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';

interface AdminBugReportsProps {
  locale?: string;
}

export function AdminBugReports(_props: AdminBugReportsProps) {
  void _props;
  const reports = useQuery(api.feedback.getRecent, { limit: 50 });
  const deleteReport = useMutation(api.feedback.deleteReport);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (reports === undefined) {
    return (
      <Card className="p-6 border-amber-400/20 bg-black/60">
        <div className="flex items-center gap-3 text-amber-400 animate-pulse">
          <Bug className="w-5 h-5" />
          <span className="text-sm font-medium">
            {'Loading Admin Bug Reports...'}
          </span>
        </div>
      </Card>
    );
  }

  const bugReports = reports.filter((r) => r.type === 'bug');

  const handleDelete = async (id: string) => {
    if (busyId) return;
    setBusyId(id);
    try {
      await deleteReport({ reportId: id as never });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section id="admin-bug-reports" className="scroll-mt-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-400 border border-amber-400/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#C9960C]">
              {'Admin Dashboard — Bug Reports'}
            </h2>
            <p className="text-xs text-white/50">
              {'Feedback & bug logs for ewiebotha@gmail.com with last 20 action history'}
            </p>
          </div>
        </div>
        <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300">
          {bugReports.length} {'reports'}
        </span>
      </div>

      {bugReports.length === 0 ? (
        <Card className="p-8 text-center bg-white/5 border-white/10">
          <Bug className="w-10 h-10 text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/60">
            {'No bug reports submitted yet.'}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {bugReports.map((report) => {
            const isExpanded = expandedId === report._id;
            const formattedDate = new Date(report.createdAt).toLocaleString(
              'en-US',
              { dateStyle: 'medium', timeStyle: 'short' }
            );

            return (
              <Card
                key={report._id}
                className="p-4 bg-black/80 border-white/10 hover:border-amber-400/30 transition-all space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-3 text-xs text-white/60 flex-wrap">
                      <span className="flex items-center gap-1 text-amber-400 font-medium">
                        <User className="w-3.5 h-3.5" />
                        {report.email || 'Anonymous'}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-white/40">
                        <Calendar className="w-3.5 h-3.5" />
                        {formattedDate}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-white whitespace-pre-wrap mt-1">
                      {report.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {report.actionLogs && report.actionLogs.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : report._id)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/20 text-xs text-amber-300 font-mono transition-colors"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>{report.actionLogs.length} logs</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(report._id)}
                      disabled={busyId === report._id}
                      aria-label={'Delete report'}
                      className="flex items-center justify-center p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {isExpanded && report.actionLogs && (
                  <div className="mt-3 p-3 rounded-xl bg-black border border-white/10 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>{'User Last 20 Action Logs:'}</span>
                    </div>
                    <div className="font-mono text-xs text-amber-300/90 space-y-1 max-h-48 overflow-y-auto scrollbar-thin">
                      {report.actionLogs.map((log, i) => (
                        <div key={i} className="py-0.5 border-b border-white/5 last:border-0">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
