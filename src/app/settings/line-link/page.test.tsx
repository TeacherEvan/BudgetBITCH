// src/app/settings/line-link/page.test.tsx
// W7: the LINE link page reveals a manual bot-code entry only after LIFF login
// has produced a lineUserId.
import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockRouter = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock('next/navigation', () => ({ useRouter: () => mockRouter }));

vi.mock('@/components/auth/require-auth', () => ({
  RequireAuth: ({ children }: { children: ReactNode }) => children,
}));

type Status = 'idle' | 'loading' | 'linked' | 'error';

const linkState = vi.hoisted(() => {
  const state: {
    status: Status;
    error: string | null;
    lineUserId: string | null;
    code: string;
    setCode: ReturnType<typeof vi.fn>;
    start: ReturnType<typeof vi.fn>;
    link: ReturnType<typeof vi.fn>;
  } = {
    status: 'idle',
    error: null,
    lineUserId: null,
    code: '',
    setCode: vi.fn(),
    start: vi.fn(async () => undefined),
    link: vi.fn(async () => undefined),
  };
  return { state };
});

vi.mock('@/hooks/use-line-link', () => ({
  useLineLink: () => linkState.state,
}));

import LineLinkPage from './page';

function resetState(overrides: Partial<typeof linkState.state> = {}) {
  linkState.state = {
    status: 'idle',
    error: null,
    lineUserId: null,
    code: '',
    setCode: vi.fn(),
    start: vi.fn(async () => undefined),
    link: vi.fn(async () => undefined),
    ...overrides,
  };
}

describe('LineLinkPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetState();
  });

  it('shows the LIFF start button and no code field before a lineUserId exists', () => {
    render(<LineLinkPage />);

    expect(
      screen.getByRole('button', { name: /link my line account/i }),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/line link code/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /link with code/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /link my line account/i }));
    expect(linkState.state.start).toHaveBeenCalledTimes(1);
  });

  it('renders a labelled code input and a "Link with code" button after LIFF login', () => {
    resetState({ lineUserId: 'U-logged-in', code: 'abc123' });
    render(<LineLinkPage />);

    const input = screen.getByLabelText(/line link code/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue('abc123');

    const submit = screen.getByRole('button', { name: /link with code/i });
    expect(submit).toBeInTheDocument();
    expect(submit.className).toMatch(/min-h-11/);
    expect(
      screen.queryByRole('button', { name: /link my line account/i }),
    ).not.toBeInTheDocument();

    fireEvent.change(input, { target: { value: 'new-code' } });
    expect(linkState.state.setCode).toHaveBeenCalledWith('new-code');

    fireEvent.click(submit);
    expect(linkState.state.link).toHaveBeenCalledTimes(1);
  });

  it('keeps the submit button disabled until a code is entered', () => {
    resetState({ lineUserId: 'U-logged-in' });
    render(<LineLinkPage />);

    expect(
      screen.getByRole('button', { name: /link with code/i }),
    ).toBeDisabled();
  });

  it('shows a success message and hides the form once linked', () => {
    resetState({ status: 'linked', lineUserId: 'U-logged-in' });
    render(<LineLinkPage />);

    expect(screen.getByRole('status')).toHaveTextContent(/linked/i);
    expect(screen.queryByLabelText(/line link code/i)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /link with code/i }),
    ).not.toBeInTheDocument();
  });

  it('shows the mapped error message when linking fails', () => {
    resetState({
      status: 'error',
      lineUserId: 'U-logged-in',
      error: 'That code is invalid or has expired. Ask the LINE bot for a new one.',
    });
    render(<LineLinkPage />);

    expect(screen.getByRole('alert')).toHaveTextContent(/invalid or has expired/i);
  });
});
