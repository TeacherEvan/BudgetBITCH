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
 * Kept for backwards compatibility; prefer setSoundMuted() for new wiring.
 */
export function setAudioMuted(muted: boolean): void {
  isAudioMuted = muted;
}

export function isMuted(): boolean {
  return isAudioMuted;
}

/**
 * Canonical mute API for settings wiring: call setSoundMuted(value) from the
 * display-preferences/settings layer (outside this module's scope).
 */
export function setSoundMuted(muted: boolean): void {
  setAudioMuted(muted);
}

/**
 * Schedule nodes only once a suspended AudioContext has actually resumed.
 * Scheduling at the pre-resume currentTime drops the first sound entirely.
 */
function scheduleWhenReady(ctx: AudioContext, schedule: (readyCtx: AudioContext) => void): void {
  if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
    void ctx.resume()
      .then(() => {
        if (isAudioMuted) return;
        try {
          schedule(ctx);
        } catch {
          // Graceful catch for any Web Audio execution errors
        }
      })
      .catch(() => {
        // Autoplay resume blocked — drop this sound rather than scheduling into a stopped context.
      });
    return;
  }
  schedule(ctx);
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

    scheduleWhenReady(ctx, (readyCtx) => {
      const duration = 0.012; // 12ms burst
      const sampleRate = readyCtx.sampleRate || 44100;
      const frameCount = Math.max(1, Math.floor(sampleRate * duration));
      const noiseBuffer = readyCtx.createBuffer(1, frameCount, sampleRate);
      const output = noiseBuffer.getChannelData(0);

      for (let i = 0; i < frameCount; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = readyCtx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;

      const filter = readyCtx.createBiquadFilter();
      filter.type = 'bandpass';
      const now = readyCtx.currentTime;
      filter.frequency.setValueAtTime(3200, now);
      filter.frequency.exponentialRampToValueAtTime(800, now + duration);
      filter.Q.setValueAtTime(3.5, now);

      const gainNode = readyCtx.createGain();
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      whiteNoise.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(readyCtx.destination);

      whiteNoise.start(now);
      whiteNoise.stop(now + duration);
    });
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

    scheduleWhenReady(ctx, (readyCtx) => {
      const now = readyCtx.currentTime;
      const duration = 0.35; // 350ms chime

      // Primary oscillator (A5: 880Hz)
      const osc1 = readyCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1108, now + 0.12);

      // Harmonic overtone oscillator (C#6: ~1108Hz)
      const osc2 = readyCtx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1108, now);
      osc2.frequency.exponentialRampToValueAtTime(1760, now + 0.15);

      const gainNode = readyCtx.createGain();
      gainNode.gain.setValueAtTime(0.2, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(readyCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    });
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

    scheduleWhenReady(ctx, (readyCtx) => {
      const now = readyCtx.currentTime;
      const duration = 0.003; // 3ms click

      const osc = readyCtx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now);

      const filter = readyCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, now);
      filter.Q.setValueAtTime(12, now); // High Q transient click

      const gainNode = readyCtx.createGain();
      gainNode.gain.setValueAtTime(0.25, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(readyCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    });
  } catch {
    // Graceful catch
  }
}
