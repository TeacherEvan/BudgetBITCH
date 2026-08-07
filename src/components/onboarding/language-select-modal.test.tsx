// components/onboarding/language-select-modal.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageSelectModal } from './language-select-modal';

describe('LanguageSelectModal', () => {
  const mockOnComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockOnComplete.mockClear();
  });

  it('renders welcome copy when open', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    expect(screen.getByText('Welcome to Budget Boss')).toBeInTheDocument();
    expect(screen.getByText('Choose your language & currency to get started')).toBeInTheDocument();
    expect(screen.getByText('Plan first. Panic less.')).toBeInTheDocument();
  });

  it('renders all six language options', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('Français')).toBeInTheDocument();
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
    expect(screen.getByText('Português')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
  });

  it('defaults to English + USD and completes both', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /Get Started/i }));
    expect(mockOnComplete).toHaveBeenCalledWith({ locale: 'en', currency: 'USD' });
  });

  it('completes with a selected language and currency', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    fireEvent.click(screen.getByRole('button', { name: /Français/i }));
    fireEvent.change(screen.getByLabelText('Select currency'), { target: { value: 'EUR' } });
    fireEvent.click(screen.getByRole('button', { name: /Get Started/i }));
    expect(mockOnComplete).toHaveBeenCalledWith({ locale: 'fr', currency: 'EUR' });
  });

  it('does not render when isOpen is false', () => {
    render(<LanguageSelectModal isOpen={false} onComplete={mockOnComplete} />);
    expect(screen.queryByText('Welcome to Budget Boss')).not.toBeInTheDocument();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });
});
