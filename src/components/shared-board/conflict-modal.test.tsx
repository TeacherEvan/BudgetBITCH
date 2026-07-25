// components/shared-board/conflict-modal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConflictModal } from './conflict-modal';

describe('ConflictModal', () => {
  const mockResolve = vi.fn();
  const mockClose = vi.fn();

  const sampleConflict = {
    localUpdatedAt: Date.now() - 5000,
    remoteUpdatedAt: Date.now(),
    localSummary: 'Edited rent expense',
    remoteSummary: 'Added grocery bill',
  };

  it('renders conflict modal when open with details', () => {
    render(
      <ConflictModal
        isOpen={true}
        conflict={sampleConflict}
        onResolve={mockResolve}
        onClose={mockClose}
      />
    );

    expect(screen.getByText('Sync Conflict — Review Changes')).toBeInTheDocument();
    expect(screen.getByText('Edited rent expense')).toBeInTheDocument();
    expect(screen.getByText('Added grocery bill')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Merge Both Versions/i })).toBeInTheDocument();
  });

  it('invokes onResolve with merge when Merge button clicked', () => {
    render(
      <ConflictModal
        isOpen={true}
        conflict={sampleConflict}
        onResolve={mockResolve}
        onClose={mockClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Merge Both Versions/i }));

    expect(mockResolve).toHaveBeenCalledWith('merge');
  });

  it('invokes onResolve with keep_local when Keep My Local Version clicked', () => {
    render(
      <ConflictModal
        isOpen={true}
        conflict={sampleConflict}
        onResolve={mockResolve}
        onClose={mockClose}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Keep My Local Version/i }));

    expect(mockResolve).toHaveBeenCalledWith('keep_local');
  });

  it('does not render when isOpen is false', () => {
    render(
      <ConflictModal
        isOpen={false}
        conflict={sampleConflict}
        onResolve={mockResolve}
        onClose={mockClose}
      />
    );

    expect(screen.queryByText('Sync Conflict — Review Changes')).not.toBeInTheDocument();
  });
});
