'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { 
  getStorageEstimate, 
  getLocalCheckpoints, 
  restoreCheckpoint, 
  auditAndRepairDatabase,
  requestPersistentStorage,
  createLocalCheckpoint,
} from '@/lib/db/local-db';
import { restoreFromCloudSnapshot } from '@/lib/convex/sync-snapshots';
import { Shield, Database, Activity } from 'lucide-react';
import { format } from 'date-fns';

interface StorageDiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  locale: string;
}

export function StorageDiagnosticsModal({ isOpen, onClose}: StorageDiagnosticsModalProps) {
  const [storageInfo, setStorageInfo] = useState<{ persisted: boolean; usage: number; quota: number }>({
    persisted: false,
    usage: 0,
    quota: 0,
  });
  const [localCheckpoints, setLocalCheckpoints] = useState<{ label: string; timestamp: number }[]>([]);
  const [auditLogs, setAuditLogs] = useState<string[]>([]);
  const [auditStatus, setAuditStatus] = useState<'idle' | 'running' | 'success' | 'failed'>('idle');
  const [restoringCheckpoint, setRestoringCheckpoint] = useState<number | null>(null);
  const [restoringCloud, setRestoringCloud] = useState<string | null>(null);
  const [requestingPersist, setRequestingPersist] = useState(false);
  const [creatingCheckpoint, setCreatingCheckpoint] = useState(false);

  // Fetch Convex cloud snapshots list
  const cloudSnapshots = useQuery(api.snapshots.listCloudSnapshots) ?? [];

  const loadStorageInfo = async () => {
    const info = await getStorageEstimate();
    setStorageInfo(info);
    const checkpoints = await getLocalCheckpoints();
    setLocalCheckpoints(checkpoints);
  };

  useEffect(() => {
    if (isOpen) {
      loadStorageInfo();
    }
  }, [isOpen]);

  const handleRequestPersistence = async () => {
    setRequestingPersist(true);
    try {
      await requestPersistentStorage();
      await loadStorageInfo();
    } finally {
      setRequestingPersist(false);
    }
  };

  const handleCreateCheckpoint = async () => {
    setCreatingCheckpoint(true);
    try {
      await createLocalCheckpoint('Manual Checkpoint');
      await loadStorageInfo();
    } finally {
      setCreatingCheckpoint(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditStatus('running');
    setAuditLogs(['Initializing data integrity scan...']);
    try {
      const result = await auditAndRepairDatabase();
      setAuditLogs(result.logs);
      setAuditStatus(result.status === 'failed' ? 'failed' : 'success');
      loadStorageInfo();
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      setAuditLogs((prev) => [...prev, `Error: ${errMessage}`]);
      setAuditStatus('failed');
    }
  };

  const handleRestoreCheckpoint = async (timestamp: number) => {
    if (!confirm('Restore from this checkpoint? Current local data will be overwritten.')) return;
    setRestoringCheckpoint(timestamp);
    const success = await restoreCheckpoint(timestamp);
    if (success) {
      alert('Restored successfully!');
      window.location.reload();
    } else {
      alert('Failed to restore checkpoint.');
    }
    setRestoringCheckpoint(null);
  };

  const handleRestoreCloud = async (snapshotId: string, snapshotDate: string) => {
    if (!confirm(`Restore cloud backup from ${snapshotDate}?`)) return;
    setRestoringCloud(snapshotId);
    try {
      // Import snapshots.getSnapshotById internally or fetch
      const url = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (!url) throw new Error('Convex URL not configured');
      
      // Dynamic import to fetch client
      const { convex } = await import('@/components/providers/convex-client-provider');
      const snapshot = await convex.query(api.snapshots.getSnapshotById, { snapshotId: snapshotId as Id<"dailySnapshots"> });
      
      if (snapshot) {
        const success = await restoreFromCloudSnapshot(snapshot);
        if (success) {
          alert('Restored from cloud successfully!');
          window.location.reload();
        } else {
          throw new Error('Restore method returned false');
        }
      } else {
        throw new Error('Snapshot not found or unauthorized');
      }
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      alert(('Cloud restore failed: ') + errMessage);
    } finally {
      setRestoringCloud(null);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const l = {
    en: {
      title: 'Database Diagnostics & Recovery',
      desc: 'Verify storage persistence, run data health audits, and restore from local checkpoints or cloud snapshots.',
      storageQuota: 'Storage Quota & Usage',
      persisted: 'Protected from Browser Eviction',
      yes: 'Yes (Secure)',
      no: 'No (At risk of browser eviction)',
      auditTitle: 'Data Integrity Audit',
      runAudit: 'Run Integrity Scan',
      auditSuccess: 'Audit Completed',
      auditRunning: 'Scanning...',
      checkpointTitle: 'Local Backup Checkpoints',
      noCheckpoints: 'No local checkpoints saved',
      cloudBackupTitle: 'Cloud Recovery Snapshots',
      noCloudBackups: 'No cloud backups found',
      restore: 'Restore',
      restoring: 'Restoring...',
      usageText: 'Used',
      close: 'Close',
      requestPersist: 'Request Protection',
      requesting: 'Requesting...',
      createCheckpoint: '+ Create Checkpoint Now',
      creating: 'Creating...',
    },
  }.en;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={l.title} size="md">
      <div className="space-y-6 text-sm text-white/80 max-h-[70vh] overflow-y-auto pr-2">
        <p className="text-white/60">{l.desc}</p>

        {/* 1. Storage Status */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <Database className="w-5 h-5" />
            <h3>{l.storageQuota}</h3>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-white/50">
              <span>{l.usageText}: {formatSize(storageInfo.usage)}</span>
              <span>Total: {formatSize(storageInfo.quota || 2147483648)}</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-amber-400 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, (storageInfo.usage / (storageInfo.quota || 2147483648)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <span>{l.persisted}</span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${
              storageInfo.persisted ? 'bg-emerald-400/20 text-emerald-400' : 'bg-rose-400/20 text-rose-400'
            }`}>
              <Shield className="w-3.5 h-3.5" />
              {storageInfo.persisted ? l.yes : l.no}
            </span>
          </div>
          {!storageInfo.persisted && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={handleRequestPersistence}
              disabled={requestingPersist}
              data-testid="request-persistence-btn"
            >
              {requestingPersist ? l.requesting : l.requestPersist}
            </Button>
          )}
        </div>

        {/* 2. Database Audit Tool */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Activity className="w-5 h-5" />
              <h3>{l.auditTitle}</h3>
            </div>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleRunAudit}
              disabled={auditStatus === 'running'}
            >
              {auditStatus === 'running' ? l.auditRunning : l.runAudit}
            </Button>
          </div>
          {auditLogs.length > 0 && (
            <div className="bg-black/40 rounded-lg p-3 font-mono text-[11px] leading-relaxed text-emerald-400/90 max-h-32 overflow-y-auto space-y-1">
              {auditLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="text-white/30">[{idx + 1}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Local Checkpoints */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <h3 className="text-amber-400 font-semibold">{l.checkpointTitle}</h3>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCreateCheckpoint}
              disabled={creatingCheckpoint}
              data-testid="create-checkpoint-btn"
            >
              {creatingCheckpoint ? l.creating : l.createCheckpoint}
            </Button>
          </div>
          {localCheckpoints.length === 0 ? (
            <p className="text-white/40 italic">{l.noCheckpoints}</p>
          ) : (
            <div className="space-y-2">
              {localCheckpoints.map((cp) => (
                <div key={cp.timestamp} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                  <div>
                    <p className="font-semibold text-white/90">{cp.label}</p>
                    <p className="text-xs text-white/40">{format(cp.timestamp, 'yyyy-MM-dd HH:mm:ss')}</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={restoringCheckpoint !== null}
                    onClick={() => handleRestoreCheckpoint(cp.timestamp)}
                  >
                    {restoringCheckpoint === cp.timestamp ? l.restoring : l.restore}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Cloud backups list */}
        <div className="space-y-3">
          <h3 className="text-amber-400 font-semibold border-b border-white/10 pb-1.5">{l.cloudBackupTitle}</h3>
          {cloudSnapshots.length === 0 ? (
            <p className="text-white/40 italic">{l.noCloudBackups}</p>
          ) : (
            <div className="space-y-2">
              {cloudSnapshots.map((snap) => (
                <div key={snap._id} className="flex items-center justify-between bg-white/5 p-3 rounded-lg border border-white/5">
                  <div>
                    <p className="font-semibold text-white/90">
                      Cloud Sync ({snap.storeCounts ? Object.values(snap.storeCounts).reduce((a, b) => a + b, 0) : 0} items)
                    </p>
                    <p className="text-xs text-white/40">
                      {format(snap.createdAt, 'yyyy-MM-dd HH:mm:ss')} ({snap.date})
                    </p>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    disabled={restoringCloud !== null}
                    onClick={() => handleRestoreCloud(snap._id, snap.date)}
                  >
                    {restoringCloud === snap._id ? l.restoring : l.restore}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-end pt-4 border-t border-white/10 mt-6">
        <Button variant="secondary" onClick={onClose}>
          {l.close}
        </Button>
      </div>
    </Modal>
  );
}
