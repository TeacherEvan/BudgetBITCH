// app/quick-add/page.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuickAddPage from './page';

// Mock DB Hooks
const mockAddExpense = vi.fn();
const mockSaveProfile = vi.fn();
const mockProfile = {
  completed: true,
  answers: {
    income: 50000,
    rent: 10000,
  }
};

vi.mock('@/hooks/use-local-db', () => ({
  useExpenses: () => ({
    add: mockAddExpense,
  }),
  useWizardProfile: () => ({
    profile: mockProfile,
    save: mockSaveProfile,
  }),
}));

// Mock Next Navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock Next Intl
vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}));

// Mock Convex
const mockParseReceipt = vi.fn();
vi.mock('convex/react', () => ({
  useAction: () => mockParseReceipt,
}));

describe('QuickAddPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quick add components correctly', () => {
    render(<QuickAddPage />);
    expect(screen.getByText('Quick Add')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /scan receipt/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument();
  });

  it('toggles between expense (-) and income (+)', () => {
    render(<QuickAddPage />);
    const toggleButton = screen.getByRole('button', { name: /expense \(-\)/i });
    expect(toggleButton).toBeInTheDocument();

    // Toggle to income
    fireEvent.click(toggleButton);
    expect(screen.getByRole('button', { name: /income \(\+\)/i })).toBeInTheDocument();

    // Toggle back to expense
    fireEvent.click(screen.getByRole('button', { name: /income \(\+\)/i }));
    expect(screen.getByRole('button', { name: /expense \(-\)/i })).toBeInTheDocument();
  });

  it('validates empty inputs on save', async () => {
    render(<QuickAddPage />);
    const saveButton = screen.getByRole('button', { name: /save/i });
    
    fireEvent.click(saveButton);

    // Toast alert should display invalid amount
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid amount')).toBeInTheDocument();
    });
  });

  it('parses amount and note, then calls addExpense on save for expenses', async () => {
    render(<QuickAddPage />);
    const input = screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch');
    const saveButton = screen.getByRole('button', { name: /save/i });

    // Type amount and note
    fireEvent.change(input, { target: { value: '150.50 delicious dinner' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockAddExpense).toHaveBeenCalledTimes(1);
      expect(mockAddExpense).toHaveBeenCalledWith(expect.objectContaining({
        amount: 150.50,
        merchant: 'delicious dinner',
        source: 'manual',
      }));
      expect(screen.getByText('Expense recorded successfully!')).toBeInTheDocument();
    });
  });

  it('updates wizard profile income on save for income', async () => {
    render(<QuickAddPage />);
    const toggleButton = screen.getByRole('button', { name: /expense \(-\)/i });
    
    // Toggle to income
    fireEvent.click(toggleButton);

    const input = screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch');
    const saveButton = screen.getByRole('button', { name: /save/i });

    fireEvent.change(input, { target: { value: '2500 bonus' } });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockSaveProfile).toHaveBeenCalledTimes(1);
      expect(mockSaveProfile).toHaveBeenCalledWith(expect.objectContaining({
        answers: expect.objectContaining({
          income: 52500, // 50000 base + 2500 bonus
        }),
      }));
      expect(screen.getByText('Income added successfully!')).toBeInTheDocument();
    });
  });

  it('navigates back to dashboard when back clicked', () => {
    render(<QuickAddPage />);
    const backBtn = screen.getByRole('button', { name: /back/i });
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('processes image upload file selection via camera scan and populates inputs', async () => {
    mockParseReceipt.mockResolvedValue({
      amount: 450,
      merchant: 'Supermarket',
      category: 'food',
      date: '2026-07-21'
    });

    render(<QuickAddPage />);
    
    const file = new File(['mock-img-data'], 'receipt.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByTestId('camera-file-input') || document.querySelector('input[type="file"]');
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(mockParseReceipt).toHaveBeenCalledTimes(1);
      const input = screen.getByPlaceholderText('Type amount then note, e.g. 120 lunch') as HTMLInputElement;
      expect(input.value).toBe('450 Supermarket');
    });
  });

  it('handles receipt parsing errors gracefully and prompts for manual entry', async () => {
    mockParseReceipt.mockRejectedValue(new Error('AI parsing unavailable'));

    render(<QuickAddPage />);
    
    const file = new File(['mock-img-data'], 'receipt.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByTestId('camera-file-input') || document.querySelector('input[type="file"]');
    
    if (fileInput) {
      fireEvent.change(fileInput, { target: { files: [file] } });
    }

    await waitFor(() => {
      expect(screen.getByText('AI parsing unavailable')).toBeInTheDocument();
    });
  });
});
