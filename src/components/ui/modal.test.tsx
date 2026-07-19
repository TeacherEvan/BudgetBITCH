import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Modal } from './modal';

// jsdom has no layout, so we assert the structural CSS classes that guarantee
// the modal can scroll independently of viewport height rather than measuring
// pixel overflow. These are the classes added in the overflow fix.
// Modal portals into document.body, so queries must target document.body.

const renderModal = (props: Partial<React.ComponentProps<typeof Modal>> = {}) =>
  render(
    <Modal isOpen onClose={vi.fn()} title="Test Title" {...props}>
      <div data-testid="modal-body-content">tall content</div>
    </Modal>,
  );

const getDialog = () => document.body.querySelector('[role="dialog"]') as HTMLElement;

describe('Modal', () => {
  it('applies a max-height constraint to keep content within the viewport', () => {
    renderModal();
    const dialog = getDialog();
    expect(dialog).not.toBeNull();
    // Both mobile (85vh) and desktop (90vh) constraints must be present.
    expect(dialog.className).toContain('max-h-[85vh]');
    expect(dialog.className).toContain('sm:max-h-[90vh]');
  });

  it('renders a scrollable body container with overflow-y-auto when content is tall', () => {
    renderModal();
    const dialog = getDialog();
    // The body is the direct child of the dialog containing the children.
    const body = dialog.querySelector('[data-testid="modal-body-content"]')?.parentElement as HTMLElement;
    expect(body).not.toBeNull();
    expect(body.className).toContain('overflow-y-auto');
    // flex child must be allowed to shrink so the body (not the dialog) scrolls.
    expect(body.className).toContain('flex-1');
    expect(body.className).toContain('min-h-0');
    // overscroll-contain prevents scroll-chaining to the page behind the modal.
    expect(body.className).toContain('overscroll-contain');
  });

  it('keeps the header pinned and the close button reachable when content overflows', () => {
    renderModal();
    const dialog = getDialog();
    // The header is the flex row sibling of the scrollable body (has flex-shrink-0).
    const header = dialog.querySelector('.flex-shrink-0') as HTMLElement;
    expect(header).not.toBeNull();
    expect(header.className).toContain('flex-shrink-0');
    expect(screen.getByRole('button', { name: /close modal/i })).toBeInTheDocument();
  });
});
