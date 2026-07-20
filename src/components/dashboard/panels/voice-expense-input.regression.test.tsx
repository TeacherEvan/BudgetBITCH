// REGRESSION: a verified voice transcript must always present an Accept/store
// action. Previously, if the SpeechRecognition session ended without firing
// `onend` (a real Web Speech API edge case), `isListening` was left true, the
// transcript was spoken back ("verified") but `setShowConfirmation` never ran —
// so no Accept button appeared and the expense could never be stored.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act, waitFor, fireEvent, screen } from '@testing-library/react';
import { VoiceExpenseInput } from './voice-expense-input';

class FakeRecognition {
  continuous = false; interimResults = true; lang = 'en-US'; maxAlternatives = 1;
  onstart: ((e: Event) => void) | null = null;
  onresult: ((e: any) => void) | null = null;
  onerror: ((e: any) => void) | null = null;
  onend: ((e: Event) => void) | null = null;
  start() { this.onstart?.(new Event('start')); }
  // NOTE: stop() intentionally does NOT fire onend -> simulates stuck listening
  stop() {}
  abort() {}
  emitFinal(text: string) {
    this.onresult?.({ resultIndex: 0, results: [{ 0: { transcript: text }, isFinal: true, length: 1 }] });
  }
}
let rec: FakeRecognition | null = null;
class FakeSR { constructor() { rec = new FakeRecognition(); return rec; } }

vi.mock('@/hooks/use-currency', () => ({ useCurrency: () => (a: number) => `฿${a}` }));

describe('VoiceExpenseInput stuck-listening bug', () => {
  beforeEach(() => {
    vi.stubGlobal('SpeechRecognition', FakeSR as any);
    vi.stubGlobal('webkitSpeechRecognition', FakeSR as any);
    (window as any).SpeechRecognition = FakeSR;
    (window as any).webkitSpeechRecognition = FakeSR;
    const synth = { speak: vi.fn(), cancel: vi.fn() };
    (window as any).speechSynthesis = synth;
    (window as any).SpeechSynthesisUtterance = class { constructor(public text: string) {} };
  });
  afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

  it('BUG: transcript verified + spoken but NO Accept button when onend never fires', async () => {
    const onAddExpense = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(<VoiceExpenseInput locale="en" onAddExpense={onAddExpense} isOpen onClose={onClose} />);

    const mic = await waitFor(() => {
      const b = document.querySelector('button[class*="rounded-full"]') as HTMLButtonElement | null;
      expect(b).toBeTruthy();
      return b!;
    });
    act(() => { fireEvent.click(mic); });          // onstart -> isListening = true
    act(() => { rec!.emitFinal('Paid Grab 150 baht'); }); // transcript set, but NO onend

    // give React time to process; if the bug exists, confirmation never shows
    await new Promise((r) => setTimeout(r, 200));

    // The bug: transcript was heard + spoken back, but no Accept action appears.
    const saveBtns = screen.queryAllByText('Save');
    expect(saveBtns.length).toBeGreaterThan(0); // MUST have an Accept/store action
  });
});
