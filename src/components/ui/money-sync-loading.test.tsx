// src/components/ui/money-sync-loading.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MoneySyncLoading } from './money-sync-loading';

describe('MoneySyncLoading', () => {
  it('renders Money In and Money Out section indicators correctly in English', () => {
    render(<MoneySyncLoading locale="en" message="Custom Loading Message" />);

    expect(screen.getByText('MONEY FLOW ENGINE')).toBeInTheDocument();
    expect(screen.getByText('Custom Loading Message')).toBeInTheDocument();
    expect(screen.getByText('MONEY IN')).toBeInTheDocument();
    expect(screen.getByText('MONEY OUT')).toBeInTheDocument();
    expect(screen.getByText('FUNDS AVAILABLE (NET)')).toBeInTheDocument();
  });

  it('renders Thai localized strings when locale is th', () => {
    render(<MoneySyncLoading locale="th" />);

    expect(screen.getByText('กำลังซิงค์กระแสเงิน')).toBeInTheDocument();
    expect(screen.getByText('เงินเข้า (MONEY IN)')).toBeInTheDocument();
    expect(screen.getByText('เงินออก (MONEY OUT)')).toBeInTheDocument();
    expect(screen.getByText('เงินคงเหลือสุทธิ (FUNDS AVAILABLE)')).toBeInTheDocument();
  });
});
