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

  it('renders USA, France, and China country flag choices when open', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('France')).toBeInTheDocument();
    expect(screen.getByText('China (中国)')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Budget Boss')).toBeInTheDocument();
    expect(screen.getByText('Choose your country & language to get started')).toBeInTheDocument();
  });

  it('renders flag emojis for all 3 country choices (USA 🇺🇸, France 🇫🇷, China 🇨🇳)', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('🇺🇸')).toBeInTheDocument();
    expect(screen.getByText('🇫🇷')).toBeInTheDocument();
    expect(screen.getByText('🇨🇳')).toBeInTheDocument();
  });

  it('calls onComplete with "en" when United States button clicked', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /United States/i }));
    
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith('en');
  });

  it('calls onComplete with "fr" when France button clicked', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /France/i }));
    
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith('fr');
  });

  it('calls onComplete with "zh" when China button clicked', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    fireEvent.click(screen.getByRole('button', { name: /China/i }));
    
    expect(mockOnComplete).toHaveBeenCalledTimes(1);
    expect(mockOnComplete).toHaveBeenCalledWith('zh');
  });

  it('does not render when isOpen is false', () => {
    render(<LanguageSelectModal isOpen={false} onComplete={mockOnComplete} />);
    
    expect(screen.queryByText('Welcome to Budget Boss')).not.toBeInTheDocument();
    expect(mockOnComplete).not.toHaveBeenCalled();
  });

  it('shows tagline "Plan first. Panic less."', () => {
    render(<LanguageSelectModal isOpen={true} onComplete={mockOnComplete} />);
    
    expect(screen.getByText('Plan first. Panic less.')).toBeInTheDocument();
  });
});