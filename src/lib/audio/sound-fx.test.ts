import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  getAudioContext,
  resetAudioContext,
  setAudioMuted,
  isMuted,
  playPaperTearSound,
  playSuccessChime,
  playToggleClick,
} from './sound-fx';

describe('Procedural Web Audio Synthesizer (sound-fx)', () => {
  let mockAudioContext: any;
  let mockDestination: any;

  beforeEach(() => {
    resetAudioContext();
    setAudioMuted(false);

    mockDestination = {};

    const createMockAudioParam = (initialValue = 0) => ({
      value: initialValue,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
    });

    mockAudioContext = {
      sampleRate: 44100,
      currentTime: 0,
      state: 'running',
      destination: mockDestination,
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createBuffer: vi.fn((channels: number, length: number) => ({
        numberOfChannels: channels,
        length,
        getChannelData: vi.fn(() => new Float32Array(length)),
      })),
      createBufferSource: vi.fn(() => ({
        buffer: null,
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
      createBiquadFilter: vi.fn(() => ({
        type: 'lowpass',
        frequency: createMockAudioParam(350),
        Q: createMockAudioParam(1),
        connect: vi.fn(),
      })),
      createGain: vi.fn(() => ({
        gain: createMockAudioParam(1),
        connect: vi.fn(),
      })),
      createOscillator: vi.fn(() => ({
        type: 'sine',
        frequency: createMockAudioParam(440),
        connect: vi.fn(),
        start: vi.fn(),
        stop: vi.fn(),
      })),
    };

    // Use regular function constructor so new AudioContext() works properly
    vi.stubGlobal('AudioContext', function () {
      return mockAudioContext;
    });
  });

  afterEach(() => {
    resetAudioContext();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lazily initializes AudioContext on demand', () => {
    const ctx = getAudioContext();
    expect(ctx).toBe(mockAudioContext);
  });

  it('resumes suspended context when retrieved', () => {
    mockAudioContext.state = 'suspended';
    getAudioContext();
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('handles muted state correctly and skips playback', () => {
    setAudioMuted(true);
    expect(isMuted()).toBe(true);

    playPaperTearSound();
    playSuccessChime();
    playToggleClick();

    expect(mockAudioContext.createGain).not.toHaveBeenCalled();
  });

  it('executes playPaperTearSound cleanly without throwing', () => {
    expect(() => playPaperTearSound()).not.toThrow();
    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(1, expect.any(Number), 44100);
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it('executes playSuccessChime cleanly without throwing', () => {
    expect(() => playSuccessChime()).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(2);
    expect(mockAudioContext.createGain).toHaveBeenCalled();
  });

  it('executes playToggleClick cleanly without throwing', () => {
    expect(() => playToggleClick()).not.toThrow();
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.createBiquadFilter).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.createGain).toHaveBeenCalledTimes(1);
  });

  it('safely handles missing AudioContext in headless/SSR environments', () => {
    vi.stubGlobal('AudioContext', undefined);
    vi.stubGlobal('webkitAudioContext', undefined);

    // Should not throw even when AudioContext is undefined
    expect(() => playPaperTearSound()).not.toThrow();
    expect(() => playSuccessChime()).not.toThrow();
    expect(() => playToggleClick()).not.toThrow();
  });
});
