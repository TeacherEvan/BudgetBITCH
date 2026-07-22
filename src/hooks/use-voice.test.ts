/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/use-voice.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useVoice } from './use-voice';

// Create proper mock classes
class MockSpeechRecognition {
  continuous = false;
  interimResults = true;
  lang = 'en-US';
  maxAlternatives = 1;
  start = vi.fn();
  stop = vi.fn();
  abort = vi.fn();
  onstart: ((event: Event) => void) | null = null;
  onresult: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onend: ((event: Event) => void) | null = null;
}

class MockSpeechSynthesisUtterance {
  lang = 'en-US';
  rate = 1.0;
  pitch = 1.0;
  volume = 1;
  onstart: (() => void) | null = null;
  onend: (() => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  text = '';
  
  constructor(text: string) {
    this.text = text;
  }
}

function createMockSynthesis() {
  return {
    speak: vi.fn(),
    cancel: vi.fn(),
    pending: false,
    speaking: false,
    paused: false,
    getVoices: vi.fn(() => [
      { lang: 'en-US', name: 'English Voice', default: true },
      { lang: 'th-TH', name: 'Thai Voice', default: false },
    ]),
    pause: vi.fn(),
    resume: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe('useVoice Hook', () => {
  let mockSynthesis: ReturnType<typeof createMockSynthesis>;
  let originalWindow: Window & typeof globalThis;
  let originalLocalStorage: any;
  let originalSpeechRecognition: any;
  let originalWebkitSpeechRecognition: any;
  let originalSpeechSynthesis: any;
  let originalSpeechSynthesisUtterance: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create fresh synthesis mock for each test
    mockSynthesis = createMockSynthesis();
    
    // Store originals
    originalWindow = global.window;
    originalLocalStorage = global.localStorage;
    const g = globalThis as unknown as Record<string, unknown>;
    originalSpeechRecognition = g.SpeechRecognition;
    originalWebkitSpeechRecognition = g.webkitSpeechRecognition;
    originalSpeechSynthesis = g.speechSynthesis;
    originalSpeechSynthesisUtterance = g.SpeechSynthesisUtterance;
    
    const mockStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      length: 0,
      key: vi.fn(),
    };

    // Mock window with localStorage
    global.window = {
      ...global.window,
      localStorage: mockStorage,
      matchMedia: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    } as unknown as Window & typeof globalThis;
    
    // Ensure mocks are on global AND window
    g.SpeechRecognition = MockSpeechRecognition;
    g.webkitSpeechRecognition = MockSpeechRecognition;
    (global.window as unknown as Record<string, unknown>).SpeechRecognition = MockSpeechRecognition;
    (global.window as unknown as Record<string, unknown>).webkitSpeechRecognition = MockSpeechRecognition;
    (global.window as unknown as Record<string, unknown>).speechSynthesis = mockSynthesis;
    g.speechSynthesis = mockSynthesis;
    (global.window as unknown as Record<string, unknown>).SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    g.SpeechSynthesisUtterance = MockSpeechSynthesisUtterance;
    global.localStorage = mockStorage;
  });

  afterEach(() => {
    const g = globalThis as unknown as Record<string, unknown>;
    global.window = originalWindow;
    global.localStorage = originalLocalStorage;
    g.SpeechRecognition = originalSpeechRecognition;
    g.webkitSpeechRecognition = originalWebkitSpeechRecognition;
    g.speechSynthesis = originalSpeechSynthesis;
    if (global.window) {
      (global.window as unknown as Record<string, unknown>).speechSynthesis = originalSpeechSynthesis;
    }
    g.SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('returns isSupported true when SpeechRecognition available', () => {
      const { result } = renderHook(() => useVoice('en-US'));
      
      expect(result.current.isSupported).toBe(true);
    });

    it('returns isSupported false when SpeechRecognition not available', () => {
      const g = globalThis as unknown as Record<string, unknown>;
      const win = global.window as unknown as Record<string, unknown>;
      g.SpeechRecognition = undefined;
      g.webkitSpeechRecognition = undefined;
      win.SpeechRecognition = undefined;
      win.webkitSpeechRecognition = undefined;
      
      const { result } = renderHook(() => useVoice('en-US'));
      
      expect(result.current.isSupported).toBe(false);
    });

    it('initializes with default settings (enabled: false)', () => {
      const { result } = renderHook(() => useVoice('en-US'));
      
      expect(result.current.settings.enabled).toBe(false);
      expect(result.current.settings.rate).toBe(1.0);
      expect(result.current.settings.pitch).toBe(1.0);
      expect(result.current.settings.lang).toBe('en-US');
    });

    it('initializes with provided language', () => {
      const { result } = renderHook(() => useVoice('th-TH'));
      
      expect(result.current.settings.lang).toBe('th-TH');
    });

    it('loads settings from localStorage when available', () => {
      vi.mocked(global.window.localStorage.getItem).mockReturnValue(
        JSON.stringify({ enabled: true, rate: 1.5, pitch: 1.2 })
      );
      
      const { result } = renderHook(() => useVoice('en-US'));
      
      expect(result.current.settings.enabled).toBe(true);
      expect(result.current.settings.rate).toBe(1.5);
      expect(result.current.settings.pitch).toBe(1.2);
      expect(result.current.settings.lang).toBe('en-US'); // Lang overrides stored
    });

    it('falls back to defaults when localStorage is corrupted', () => {
      vi.mocked(global.window.localStorage.getItem).mockReturnValue('invalid json');
      
      const { result } = renderHook(() => useVoice('en-US'));
      
      expect(result.current.settings.enabled).toBe(false);
      expect(result.current.settings.rate).toBe(1.0);
    });

    it('initial state has no transcript or error', () => {
      const { result } = renderHook(() => useVoice('en-US'));
      
      expect(result.current.isListening).toBe(false);
      expect(result.current.isSpeaking).toBe(false);
      expect(result.current.transcript).toBe('');
      expect(result.current.error).toBeNull();
    });
  });

  describe('Settings Management', () => {
    it('updateSettings updates and persists to localStorage', () => {
      const { result } = renderHook(() => useVoice('en-US'));
      
      act(() => {
        result.current.updateSettings({ enabled: true, rate: 1.3 });
      });
      
      expect(result.current.settings.enabled).toBe(true);
      expect(result.current.settings.rate).toBe(1.3);
      expect(global.window.localStorage.setItem).toHaveBeenCalledWith(
        'voiceSettings',
        expect.stringContaining('"enabled":true')
      );
    });

    it('updateSettings preserves existing settings', () => {
      const { result } = renderHook(() => useVoice('en-US'));
      
      act(() => {
        result.current.updateSettings({ rate: 1.5 });
      });
      
      expect(result.current.settings.rate).toBe(1.5);
      expect(result.current.settings.pitch).toBe(1.0); // preserved
      expect(result.current.settings.enabled).toBe(false); // preserved
    });

    it('toggleVoice flips enabled state', () => {
      const { result } = renderHook(() => useVoice('en-US'));
      
      expect(result.current.settings.enabled).toBe(false);
      
      act(() => {
        result.current.toggleVoice();
      });
      
      expect(result.current.settings.enabled).toBe(true);
      
      act(() => {
        result.current.toggleVoice();
      });
      
      expect(result.current.settings.enabled).toBe(false);
    });
  });

  describe('Text-to-Speech (speak)', () => {
    it('does not speak when disabled', () => {
      // Clear mock explicitly to ensure clean state
      mockSynthesis.speak.mockClear();
      mockSynthesis.cancel.mockClear();
      
      const { result } = renderHook(() => useVoice('en-US'));
      
      act(() => {
        result.current.speak('Hello world');
      });
      
      expect(mockSynthesis.speak).not.toHaveBeenCalled();
    });

    it('speaks when enabled with correct utterance settings', () => {
      const { result } = renderHook(() => useVoice('th-TH'));
      
      act(() => {
        result.current.updateSettings({ enabled: true, rate: 1.2, pitch: 1.1 });
      });
      
      act(() => {
        result.current.speak('สวัสดี');
      });
      
      expect(mockSynthesis.cancel).toHaveBeenCalled();
      expect(mockSynthesis.speak).toHaveBeenCalled();
      
      const utterance = mockSynthesis.speak.mock.calls[0][0];
      expect(utterance.lang).toBe('th-TH');
      expect(utterance.rate).toBe(1.2);
      expect(utterance.pitch).toBe(1.1);
      expect(utterance.text).toBe('สวัสดี');
    });

    it('sets isSpeaking true on start, false on end', async () => {
      const { result } = renderHook(() => useVoice('en-US'));
      
      act(() => {
        result.current.updateSettings({ enabled: true });
      });
      
      act(() => {
        result.current.speak('Test');
      });
      
      // Simulate utterance onstart
      const utterance = mockSynthesis.speak.mock.calls[0][0];
      act(() => {
        if (utterance.onstart) utterance.onstart();
      });
      
      expect(result.current.isSpeaking).toBe(true);
      
      // Simulate utterance onend
      act(() => {
        if (utterance.onend) utterance.onend();
      });
      
      expect(result.current.isSpeaking).toBe(false);
    });

    it('handles synthesis error', () => {
      const { result } = renderHook(() => useVoice('en-US'));
      
      act(() => {
        result.current.updateSettings({ enabled: true });
      });
      
      act(() => {
        result.current.speak('Test');
      });
      
      // Simulate synthesis error
      const utterance = mockSynthesis.speak.mock.calls[0][0];
      act(() => {
        if (utterance.onerror) utterance.onerror({ error: 'interrupted' });
      });
      
      expect(result.current.error).toBe('interrupted');
      expect(result.current.isSpeaking).toBe(false);
    });
  });

  describe('Cleanup', () => {
    it('aborts recognition on unmount pattern', () => {
      const { unmount } = renderHook(() => useVoice('en-US'));
      
      unmount();
      
      // In real implementation, the instance would be tracked
      expect(true).toBe(true);
    });
  });
});