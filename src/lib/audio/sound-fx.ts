/**
 * Procedural Web Audio Synthesizer
 * Zero-dependency procedural audio engine using native AudioContext / webkitAudioContext.
 *
 * Battery & Safety:
 * - Lazy initialization on first user interaction
 * - Graceful fallback when AudioContext is unavailable or muted/blocked
 * - Safe for headless / SSR / JSDOM environments
 */

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

let audioCtx: AudioContext | null = null;
let isAudioMuted = false;

/**
 * Returns the singleton AudioContext instance or null if in SSR / unsupported environment.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioCtx) {
    try {
      audioCtx = new AudioContextClass();
    } catch {
      // AudioContext creation might fail due to policy or platform limits
      return null;
    }
  }

  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {
      // Ignore autoplay resume failures
    });
  }

  return audioCtx;
}

/**
 * Resets audio context reference (mainly for test teardown / reset).
 */
export function resetAudioContext(): void {
  if (audioCtx && typeof audioCtx.close === 'function') {
    try {
      audioCtx.close().catch(() => {});
    } catch {
      // Ignore close errors
    }
  }
  audioCtx = null;
}

/**
 * Enable or disable all procedural sound effects.
 */
export function setAudioMuted(muted: boolean): void {
  isAudioMuted = muted;
}

export function isMuted(): boolean {
  return isAudioMuted;
}

/**
 * Play a simulated thermal receipt paper tear sound.
 * 12ms white noise burst + sweeping bandpass filter simulating thermal receipt tear.
 */
export function playPaperTearSound(): void {
  if (isAudioMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const duration = 0.012; // 12ms burst
    const sampleRate = ctx.sampleRate || 44100;
    const frameCount = Math.max(1, Math.floor(sampleRate * duration));
    const noiseBuffer = ctx.createBuffer(1, frameCount, sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < frameCount; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    const now = ctx.currentTime;
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + duration);
    filter.Q.setValueAtTime(3.5, now);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + duration);
  } catch {
    // Graceful catch for any Web Audio execution errors
  }
}

/**
 * Play a dual harmonic sine oscillator success chime (880Hz -> 1108Hz) with smooth exponential decay.
 */
export function playSuccessChime(): void {
  if (isAudioMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.35; // 350ms chime

    // Primary oscillator (A5: 880Hz)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(1108, now + 0.12);

    // Harmonic overtone oscillator (C#6: ~1108Hz)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1108, now);
    osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.2, now);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + duration);
    osc2.stop(now + duration);
  } catch {
    // Graceful catch
  }
}

/**
 * Play an ultra-short high-Q transient click (3ms, 1200Hz).
 */
export function playToggleClick(): void {
  if (isAudioMuted) return;

  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const duration = 0.003; // 3ms click

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1200, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.setValueAtTime(12, now); // High Q transient click

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.25, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  } catch {
    // Graceful catch
  }
}
