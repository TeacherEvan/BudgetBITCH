import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StorageDiagnosticsModal } from './storage-diagnostics-modal';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';

// Mock DB utilities
const mockGetStorageEstimate = vi.fn();
const mockGetLocalCheckpoints = vi.fn();
const mockRestoreCheckpoint = vi.fn();
const mockAuditAndRepairDatabase = vi.fn();

vi.mock('@/lib/db/local-db', () => ({
  getStorageEstimate: (...args: unknown[]) => mockGetStorageEstimate(...args),
  getLocalCheckpoints: (...args: unknown[]) => mockGetLocalCheckpoints(...args),
  restoreCheckpoint: (...args: unknown[]) => mockRestoreCheckpoint(...args),
  auditAndRepairDatabase: (...args: unknown[]) => mockAuditAndRepairDatabase(...args),
}));

// Mock cloud snapshot restore utility
const mockRestoreFromCloudSnapshot = vi.fn();

vi.mock('@/lib/convex/sync-snapshots', () => ({
  restoreFromCloudSnapshot: (...args: unknown[]) => mockRestoreFromCloudSnapshot(...args),
}));

// Mock Convex react hook
const mockUseQuery = vi.fn();

vi.mock('convex/react', () => ({
  useQuery: (...args: unknown[]) => mockUseQuery(...args),
}));

// Mock Convex client provider (used for dynamic import during cloud snapshot restore)
const mockConvexQuery = vi.fn();

vi.mock('@/components/providers/convex-client-provider', () => ({
  convex: {
    query: (...args: unknown[]) => mockConvexQuery(...args),
  },
}));

describe('StorageDiagnosticsModal', () => {
  const mockOnClose = vi.fn();
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_CONVEX_URL = 'https://test.convex.cloud';

    // Default mock implementations
    mockGetStorageEstimate.mockResolvedValue({
      persisted: true,
      usage: 1048576, // 1 MB
      quota: 1073741824, // 1 GB
    });
    mockGetLocalCheckpoints.mockResolvedValue([]);
    mockAuditAndRepairDatabase.mockResolvedValue({
      status: 'success',
      logs: ['Data integrity verified.'],
    });
    mockRestoreCheckpoint.mockResolvedValue(true);
    mockRestoreFromCloudSnapshot.mockResolvedValue(true);
    mockUseQuery.mockReturnValue([]);
    mockConvexQuery.mockResolvedValue(null);

    vi.stubGlobal('confirm', vi.fn().mockReturnValue(true));
    vi.stubGlobal('alert', vi.fn());

    Object.defineProperty(window, 'location', {
      configurable: true,
      writable: true,
      value: {
        ...originalLocation,
        reload: vi.fn(),
      },
    });
  });

  describe('1. Storage Quota, Usage & Eviction Persistence Status', () => {
    it('renders formatted storage usage, total quota, progress bar, and "Protected from Browser Eviction" badge when persisted', async () => {
      mockGetStorageEstimate.mockResolvedValue({
        persisted: true,
        usage: 5242880, // 5 MB
        quota: 10485760, // 10 MB (50%)
      });

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      // Verify headers and description
      expect(screen.getByText('Database Diagnostics & Recovery')).toBeInTheDocument();
      expect(screen.getByText('Protected from Browser Eviction')).toBeInTheDocument();

      // Wait for storage estimation to load
      await waitFor(() => {
        expect(screen.getByText('Used: 5 MB')).toBeInTheDocument();
        expect(screen.getByText('Total: 10 MB')).toBeInTheDocument();
      });

      // Verify "Yes (Secure)" badge and its emerald styles
      const badge = screen.getByText('Yes (Secure)');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-emerald-400/20');
      expect(badge.className).toContain('text-emerald-400');

      // Verify progress bar width (50%) using document since Modal uses createPortal
      const progressBar = document.querySelector('.bg-amber-400.h-2');
      expect(progressBar).toHaveStyle({ width: '50%' });
    });

    it('renders unpersisted badge ("No (At risk of browser eviction)") with warning styling when persisted is false', async () => {
      mockGetStorageEstimate.mockResolvedValue({
        persisted: false,
        usage: 0,
        quota: 2147483648, // 2 GB
      });

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Used: 0 Bytes')).toBeInTheDocument();
        expect(screen.getByText('Total: 2 GB')).toBeInTheDocument();
      });

      const badge = screen.getByText('No (At risk of browser eviction)');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('bg-rose-400/20');
      expect(badge.className).toContain('text-rose-400');
    });

    it('renders Thai localized strings correctly when locale="th"', async () => {
      mockGetStorageEstimate.mockResolvedValue({
        persisted: true,
        usage: 2048, // 2 KB
        quota: 1048576, // 1 MB
      });

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="th" />);

      expect(screen.getByText('การวิเคราะห์และกู้คืนฐานข้อมูล')).toBeInTheDocument();
      expect(screen.getByText('ปกป้องจากการลบโดยอัตโนมัติ')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('ใช้ไป: 2 KB')).toBeInTheDocument();
      });

      expect(screen.getByText('ใช่ (ปลอดภัย)')).toBeInTheDocument();
    });
  });

  describe('2. Database Audit Scan', () => {
    it('clicking "Run Integrity Scan" triggers auditAndRepairDatabase() and displays logs in console view', async () => {
      mockAuditAndRepairDatabase.mockResolvedValue({
        status: 'success',
        logs: [
          'Scanning expenses store...',
          'Scanning incomes store...',
          'Data integrity scan finished: 0 errors found.',
        ],
      });

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(mockGetStorageEstimate).toHaveBeenCalled();
      });

      const scanBtn = screen.getByRole('button', { name: 'Run Integrity Scan' });
      fireEvent.click(scanBtn);

      expect(mockAuditAndRepairDatabase).toHaveBeenCalledTimes(1);

      // Verify logs appear in console log view
      await waitFor(() => {
        expect(screen.getByText('Scanning expenses store...')).toBeInTheDocument();
        expect(screen.getByText('Scanning incomes store...')).toBeInTheDocument();
        expect(screen.getByText('Data integrity scan finished: 0 errors found.')).toBeInTheDocument();
      });

      // Verify loadStorageInfo was refreshed after audit
      expect(mockGetStorageEstimate).toHaveBeenCalledTimes(2);
      expect(mockGetLocalCheckpoints).toHaveBeenCalledTimes(2);
    });

    it('clicking "เริ่มตรวจสอบ" triggers auditAndRepairDatabase() in Thai locale', async () => {
      mockAuditAndRepairDatabase.mockResolvedValue({
        status: 'success',
        logs: ['ตรวจสอบโครงสร้างข้อมูลสำเร็จ'],
      });

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="th" />);

      await waitFor(() => {
        expect(mockGetStorageEstimate).toHaveBeenCalled();
      });

      const scanBtn = screen.getByRole('button', { name: 'เริ่มตรวจสอบ' });
      fireEvent.click(scanBtn);

      expect(mockAuditAndRepairDatabase).toHaveBeenCalledTimes(1);

      await waitFor(() => {
        expect(screen.getByText('ตรวจสอบโครงสร้างข้อมูลสำเร็จ')).toBeInTheDocument();
      });
    });

    it('handles audit failures and displays error logs in console view', async () => {
      mockAuditAndRepairDatabase.mockRejectedValue(new Error('Corrupted store structure'));

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(mockGetStorageEstimate).toHaveBeenCalled();
      });

      const scanBtn = screen.getByRole('button', { name: 'Run Integrity Scan' });
      fireEvent.click(scanBtn);

      await waitFor(() => {
        expect(screen.getByText('Error: Corrupted store structure')).toBeInTheDocument();
      });
    });
  });

  describe('3. Local Checkpoint Restoration', () => {
    const sampleCheckpoints = [
      { label: 'Auto Snapshot', timestamp: 1700000000000 },
      { label: 'Pre-Import Backup', timestamp: 1700003600000 },
    ];

    it('renders empty message when no local checkpoints exist', async () => {
      mockGetLocalCheckpoints.mockResolvedValue([]);

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('No local checkpoints saved')).toBeInTheDocument();
      });
    });

    it('clicking "Restore" opens window.confirm, calls restoreCheckpoint(timestamp), alerts, and reloads page on success', async () => {
      mockGetLocalCheckpoints.mockResolvedValue(sampleCheckpoints);
      mockRestoreCheckpoint.mockResolvedValue(true);

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Auto Snapshot')).toBeInTheDocument();
        expect(screen.getByText('Pre-Import Backup')).toBeInTheDocument();
      });

      const restoreBtns = screen.getAllByRole('button', { name: 'Restore' });
      fireEvent.click(restoreBtns[0]);

      expect(window.confirm).toHaveBeenCalledWith(
        'Restore from this checkpoint? Current local data will be overwritten.'
      );
      expect(mockRestoreCheckpoint).toHaveBeenCalledWith(1700000000000);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Restored successfully!');
        expect(window.location.reload).toHaveBeenCalledTimes(1);
      });
    });

    it('aborts local checkpoint restoration when user cancels confirmation dialog', async () => {
      mockGetLocalCheckpoints.mockResolvedValue(sampleCheckpoints);
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Auto Snapshot')).toBeInTheDocument();
      });

      const restoreBtns = screen.getAllByRole('button', { name: 'Restore' });
      fireEvent.click(restoreBtns[0]);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockRestoreCheckpoint).not.toHaveBeenCalled();
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('shows error alert and does not reload page if restoreCheckpoint returns false', async () => {
      mockGetLocalCheckpoints.mockResolvedValue(sampleCheckpoints);
      mockRestoreCheckpoint.mockResolvedValue(false);

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(screen.getByText('Auto Snapshot')).toBeInTheDocument();
      });

      const restoreBtns = screen.getAllByRole('button', { name: 'Restore' });
      fireEvent.click(restoreBtns[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Failed to restore checkpoint.');
        expect(window.location.reload).not.toHaveBeenCalled();
      });
    });

    it('handles localized Thai confirm dialog and success alert for local checkpoint restore', async () => {
      mockGetLocalCheckpoints.mockResolvedValue([sampleCheckpoints[0]]);
      mockRestoreCheckpoint.mockResolvedValue(true);

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="th" />);

      await waitFor(() => {
        expect(screen.getByText('Auto Snapshot')).toBeInTheDocument();
      });

      const restoreBtn = screen.getByRole('button', { name: 'กู้คืน' });
      fireEvent.click(restoreBtn);

      expect(window.confirm).toHaveBeenCalledWith(
        'กู้คืนข้อมูลจากสแนปช็อตนี้หรือไม่? ข้อมูลปัจจุบันจะถูกเขียนทับ'
      );

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('กู้คืนสำเร็จแล้ว!');
        expect(window.location.reload).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('4. Cloud Snapshot Recovery', () => {
    const sampleCloudSnapshots = [
      {
        _id: 'cloud_snap_1' as Id<'dailySnapshots'>,
        createdAt: 1700000000000,
        date: '2026-07-20',
        storeCounts: { expenses: 10, incomes: 5 },
      },
      {
        _id: 'cloud_snap_2' as Id<'dailySnapshots'>,
        createdAt: 1700086400000,
        date: '2026-07-21',
        storeCounts: { expenses: 12, incomes: 6 },
      },
    ];

    it('renders empty message when no cloud snapshots exist', async () => {
      mockUseQuery.mockReturnValue([]);

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(mockGetStorageEstimate).toHaveBeenCalled();
      });

      expect(screen.getByText('No cloud backups found')).toBeInTheDocument();
    });

    it('clicking "Restore" on a cloud snapshot fetches snapshot via Convex query, calls restoreFromCloudSnapshot, alerts, and reloads', async () => {
      mockUseQuery.mockReturnValue(sampleCloudSnapshots);
      const snapshotPayload = {
        _id: 'cloud_snap_1',
        date: '2026-07-20',
        storeCounts: { expenses: 10, incomes: 5 },
        data: { expenses: [], incomes: [] },
      };
      mockConvexQuery.mockResolvedValue(snapshotPayload);
      mockRestoreFromCloudSnapshot.mockResolvedValue(true);

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(mockGetStorageEstimate).toHaveBeenCalled();
      });

      expect(screen.getByText('Cloud Sync (15 items)')).toBeInTheDocument();
      expect(screen.getByText('Cloud Sync (18 items)')).toBeInTheDocument();

      const restoreBtns = screen.getAllByRole('button', { name: 'Restore' });
      fireEvent.click(restoreBtns[0]);

      expect(window.confirm).toHaveBeenCalledWith('Restore cloud backup from 2026-07-20?');

      await waitFor(() => {
        expect(mockConvexQuery).toHaveBeenCalledWith(api.snapshots.getSnapshotById, {
          snapshotId: 'cloud_snap_1',
        });
        expect(mockRestoreFromCloudSnapshot).toHaveBeenCalledWith(snapshotPayload);
        expect(window.alert).toHaveBeenCalledWith('Restored from cloud successfully!');
        expect(window.location.reload).toHaveBeenCalledTimes(1);
      });
    });

    it('aborts cloud restore when user cancels confirmation prompt', async () => {
      mockUseQuery.mockReturnValue([sampleCloudSnapshots[0]]);
      vi.stubGlobal('confirm', vi.fn().mockReturnValue(false));

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(mockGetStorageEstimate).toHaveBeenCalled();
      });

      const restoreBtn = screen.getByRole('button', { name: 'Restore' });
      fireEvent.click(restoreBtn);

      expect(window.confirm).toHaveBeenCalled();
      expect(mockConvexQuery).not.toHaveBeenCalled();
      expect(mockRestoreFromCloudSnapshot).not.toHaveBeenCalled();
      expect(window.location.reload).not.toHaveBeenCalled();
    });

    it('handles cloud restore failure when snapshot is missing or restore returns false', async () => {
      mockUseQuery.mockReturnValue([sampleCloudSnapshots[0]]);
      mockConvexQuery.mockResolvedValue(null); // Snapshot not found

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(mockGetStorageEstimate).toHaveBeenCalled();
      });

      const restoreBtn = screen.getByRole('button', { name: 'Restore' });
      fireEvent.click(restoreBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Cloud restore failed: Snapshot not found or unauthorized');
        expect(window.location.reload).not.toHaveBeenCalled();
      });
    });

    it('handles missing NEXT_PUBLIC_CONVEX_URL gracefully', async () => {
      delete process.env.NEXT_PUBLIC_CONVEX_URL;
      mockUseQuery.mockReturnValue([sampleCloudSnapshots[0]]);

      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(mockGetStorageEstimate).toHaveBeenCalled();
      });

      const restoreBtn = screen.getByRole('button', { name: 'Restore' });
      fireEvent.click(restoreBtn);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Cloud restore failed: Convex URL not configured');
      });
    });
  });

  describe('5. Modal Visibility & Controls', () => {
    it('does not render anything when isOpen is false', () => {
      const { container } = render(
        <StorageDiagnosticsModal isOpen={false} onClose={mockOnClose} locale="en" />
      );

      expect(container.firstChild).toBeNull();
    });

    it('triggers onClose when Close button is clicked', async () => {
      render(<StorageDiagnosticsModal isOpen={true} onClose={mockOnClose} locale="en" />);

      await waitFor(() => {
        expect(mockGetStorageEstimate).toHaveBeenCalled();
      });

      const closeBtn = screen.getByRole('button', { name: 'Close' });
      fireEvent.click(closeBtn);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });
});
