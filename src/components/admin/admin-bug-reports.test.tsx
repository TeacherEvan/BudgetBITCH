// components/admin/admin-bug-reports.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AdminBugReports } from './admin-bug-reports';

const mockReports = [
  {
    _id: 'rep-1',
    type: 'bug',
    message: 'Dashboard widget misaligned',
    email: 'user1@test.com',
    actionLogs: ['[08:00:00] Step 1', '[08:01:00] Step 2'],
    createdAt: 1700000000000,
  },
];

vi.mock('convex/react', () => ({
  useQuery: () => mockReports,
  useMutation: () => vi.fn(),
}));

describe('AdminBugReports', () => {
  it('renders submitted bug reports and allows expanding action logs', () => {
    render(<AdminBugReports locale="en" />);

    expect(screen.getByText(/Admin Dashboard — Bug Reports/i)).toBeInTheDocument();
    expect(screen.getByText('Dashboard widget misaligned')).toBeInTheDocument();
    expect(screen.getByText('user1@test.com')).toBeInTheDocument();

    const logsBtn = screen.getByRole('button', { name: /2 logs/i });
    fireEvent.click(logsBtn);

    expect(screen.getByText('[08:00:00] Step 1')).toBeInTheDocument();
    expect(screen.getByText('[08:01:00] Step 2')).toBeInTheDocument();
  });
});
