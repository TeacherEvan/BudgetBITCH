// components/dashboard/panels/purchase-note-modal.test.tsx
import { render, screen, fireEvent, act } from '@testing-library/react';
import { PurchaseNoteModal } from './purchase-note-modal';

describe('PurchaseNoteModal', () => {
  it('renders the merchant and current note when open', () => {
    render(
      <PurchaseNoteModal
        isOpen
        onClose={() => {}}
        locale="en"
        merchant="Grab"
        initialNote="Client ride"
        onSave={() => {}}
      />,
    );
    expect(screen.getByText('Shared Purchase Note')).toBeInTheDocument();
    expect(screen.getByText('Grab')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Client ride')).toBeInTheDocument();
  });

  it('calls onSave with the trimmed value then closes', async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <PurchaseNoteModal
        isOpen
        onClose={onClose}
        locale="en"
        merchant="Grab"
        initialNote=""
        onSave={onSave}
      />,
    );
    const textarea = screen.getByLabelText('Note') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: '  Birthday gift  ' } });
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    });
    expect(onSave).toHaveBeenCalledWith('Birthday gift');
    expect(onClose).toHaveBeenCalled();
  });

  it('does not render when closed', () => {
    render(
      <PurchaseNoteModal
        isOpen={false}
        onClose={() => {}}
        locale="en"
        merchant="Grab"
        initialNote=""
        onSave={() => {}}
      />,
    );
    expect(screen.queryByText('Shared Purchase Note')).not.toBeInTheDocument();
  });
});
