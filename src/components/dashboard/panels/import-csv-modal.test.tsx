// components/dashboard/panels/import-csv-modal.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ImportCsvModal } from './import-csv-modal';
import type { ParsedExpense } from '@/modules/budgeting/csv-import';

const SAMPLE = [
  'date,merchant,amount,category,note',
  '2026-01-01,Grab,120,transport,Morning ride',
  '2026-01-02,Netflix,429,subscriptions,',
].join('\n');

function renderModal(props: Partial<React.ComponentProps<typeof ImportCsvModal>> = {}) {
  const onImport = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <ImportCsvModal isOpen onClose={onClose} onImport={onImport} locale="en" {...props} />,
  );
  return { onImport, onClose, ...utils };
}

describe('ImportCsvModal', () => {
  it('renders nothing when closed', () => {
    render(<ImportCsvModal isOpen={false} onClose={() => {}} onImport={() => {}} locale="en" />);
    expect(screen.queryByTestId('csv-preview-btn')).toBeNull();
  });

  it('parses pasted CSV and shows a valid-count preview', async () => {
    const { onImport } = renderModal();
    fireEvent.change(screen.getByTestId('csv-text-area'), { target: { value: SAMPLE } });
    fireEvent.click(screen.getByTestId('csv-preview-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('csv-confirm-btn')).toBeInTheDocument();
    });
    expect(screen.getByText('2 valid rows')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('csv-confirm-btn'));
    await waitFor(() => {
      expect(onImport).toHaveBeenCalledTimes(1);
    });
    const rows: ParsedExpense[] = onImport.mock.calls[0][0];
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ merchant: 'Grab', amount: 120, category: 'transport' });
  });

  it('skips invalid rows and reports them without blocking import', async () => {
    const { onImport } = renderModal();
    const csv = [
      'date,merchant,amount',
      '2026-01-01,Grab,120',
      'bad-date,Shell,200',
    ].join('\n');
    fireEvent.change(screen.getByTestId('csv-text-area'), { target: { value: csv } });
    fireEvent.click(screen.getByTestId('csv-preview-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('csv-confirm-btn')).toBeInTheDocument();
    });
    expect(screen.getByText('1 valid rows')).toBeInTheDocument();
    expect(screen.getByText('1 rows skipped')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('csv-confirm-btn'));
    await waitFor(() => {
      expect(onImport).toHaveBeenCalledWith([expect.objectContaining({ merchant: 'Grab' })]);
    });
  });

  it('disables confirm when there are no valid rows', async () => {
    const { onImport } = renderModal();
    const csv = 'date,merchant,amount\nbad-date,Shell,200';
    fireEvent.change(screen.getByTestId('csv-text-area'), { target: { value: csv } });
    fireEvent.click(screen.getByTestId('csv-preview-btn'));

    await waitFor(() => {
      expect(screen.getByText('1 rows skipped')).toBeInTheDocument();
    });
    expect(screen.queryByTestId('csv-confirm-btn')).toBeNull();
    expect(onImport).not.toHaveBeenCalled();
  });
});
