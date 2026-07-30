// components/bug-report/bug-report-modal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BugReportModal } from './bug-report-modal';

const mockReport = vi.fn().mockResolvedValue({ reportId: 'report-123' });

vi.mock('convex/react', () => ({
  useMutation: () => mockReport,
}));

vi.mock('@/lib/utils/action-logger', () => ({
  getUserActionLogs: () => ['[10:00:00] Clicked Dashboard', '[10:00:05] Opened Settings'],
}));

describe('BugReportModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders modal header and description when open', () => {
    render(<BugReportModal isOpen={true} onClose={mockOnClose} userEmail="test@example.com" />);

    expect(screen.getByText('Report a Bug')).toBeInTheDocument();
    expect(screen.getByText(/ewiebotha@gmail.com/i)).toBeInTheDocument();
    expect(screen.getByText(/Attached Action Logs \(2 entries\)/i)).toBeInTheDocument();
  });

  it('submits bug report with message, user email, and action logs', async () => {
    render(<BugReportModal isOpen={true} onClose={mockOnClose} userEmail="user@example.com" />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Chart is not rendering on mobile' } });

    const submitBtn = screen.getByRole('button', { name: /Send Bug Report/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockReport).toHaveBeenCalledTimes(1);
      expect(mockReport).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'bug',
          message: 'Chart is not rendering on mobile',
          email: 'user@example.com',
          actionLogs: ['[10:00:00] Clicked Dashboard', '[10:00:05] Opened Settings'],
        })
      );
    });
  });
});
