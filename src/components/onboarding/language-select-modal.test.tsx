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

  it('renders Thai, English (ZA), and English (TH) options when open', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    expect(screen.getByRole('button', { name: /ไทย.*Thai/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /English \(South Africa\)/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /English \(Thailand\)/i })).toBeInTheDocument();
    expect(screen.getByText('Welcome to Budget-BOSS')).toBeInTheDocument();
    expect(screen.getByText('Choose your language to get started')).toBeInTheDocument();
  });

  it('renders flag emojis for all 3 locale choices', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    expect(screen.getAllByText('🇹🇭')).toHaveLength(2);
    expect(screen.getByText('🇿🇦')).toBeInTheDocument();
  });

  it('calls onComplete with th when Thai button clicked', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /ไทย.*Thai/i }));
    
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith('th');
  });

  it('calls onComplete with en-ZA when English (ZA) button clicked', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /English \(South Africa\)/i }));
    
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith('en-ZA');
  });

  it('calls onComplete with en-TH when English (TH) button clicked', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /English \(Thailand\)/i }));
    
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith('en-TH');
  });

  it('does not render when isOpen is false', () => {
    render(<LanguageSelectModal isOpen={false} onComplete={mockOnComplete} />);
    
    expect(screen.queryByText('Welcome to Budget-BOSS')).not.toBeInTheDocument();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('prevents closing via overlay click', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    const modal = screen.getByRole('dialog');
    fireEvent.click(modal); // Click overlay
    
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('prevents closing via escape key', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    fireEvent.keyDown(document, { key: 'Escape' });
    
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('locks body scroll when open', () => {
    const originalOverflow = document.body.style.overflow;
    
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    expect(document.body.style.overflow).toBe('hidden');
    
    // Cleanup
    document.body.style.overflow = originalOverflow;
  });

  it('restores body scroll on unmount', () => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    const { unmount } = render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    unmount();
    
    expect(document.body.style.overflow).toBe('unset');
    
    document.body.style.overflow = originalOverflow;
  });

  it('shows tagline "Plan first. Panic less."', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('Plan first. Panic less.')).toBeInTheDocument();
  });

  it('shows persistence note about settings', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    expect(screen.getByText(/Your language is set once/i)).toBeInTheDocument();
  });
});