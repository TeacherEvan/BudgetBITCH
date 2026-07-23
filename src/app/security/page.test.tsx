import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SecurityPage from './page';

describe('SecurityPage', () => {
  it('renders the architecture, encryption, and 5-year-old sections', () => {
    render(<SecurityPage />);
    // Section headings
    expect(screen.getByTestId('security-stack')).toBeInTheDocument();
    expect(screen.getByTestId('security-encryption')).toBeInTheDocument();
    expect(screen.getByTestId('security-five-year-old')).toBeInTheDocument();
  });

  it('explains that personal data stays on device', () => {
    render(<SecurityPage />);
    expect(screen.getByText(/no personal data leaves|never leaves your device|data never leaves/i)).toBeInTheDocument();
  });

  it('mentions AES-GCM and TLS encryption', () => {
    render(<SecurityPage />);
    expect(screen.getByText(/AES-GCM/i)).toBeInTheDocument();
    expect(screen.getAllByText(/TLS/i).length).toBeGreaterThan(0);
  });
});
