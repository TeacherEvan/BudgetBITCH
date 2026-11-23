// src/components/launch/golden-splash.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  GoldenSplash,
  drawCoin,
  advanceDustSpawn,
  resetParticleSpriteCaches,
  type Particle,
} from './golden-splash';

const mockUseReducedMotion = vi.fn().mockReturnValue(false);
const motionCalls = vi.hoisted(() => [] as Array<{ tag: string; props: Record<string, any> }>);

vi.mock('framer-motion', async (importOriginal) => {
  const mod = await importOriginal() as Record<string, unknown>;
  const ReactModule = await import('react');
  const motion = new Proxy({}, {
    get(_target, tag: string) {
      if (typeof tag !== 'string') return undefined;
      return (props: Record<string, any>) => {
        motionCalls.push({ tag, props });
        const { initial, animate, exit, transition, variants, ...domProps } = props;
        return ReactModule.createElement(tag, domProps, props.children);
      };
    },
  });
  return {
    ...mod,
    motion,
    AnimatePresence: ({ children }: { children: any }) => children,
    useReducedMotion: () => mockUseReducedMotion(),
  };
});

describe('GoldenSplash', () => {
  beforeEach(() => {
    mockUseReducedMotion.mockReturnValue(false);
    motionCalls.length = 0;
    resetParticleSpriteCaches();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the golden splash screen and calls onProceed when button is clicked', async () => {
    vi.useFakeTimers();
    const handleProceed = vi.fn();

    render(<GoldenSplash onProceed={handleProceed} />);

    expect(screen.getByTestId('golden-splash')).toBeInTheDocument();

    // Fast-forward through animation phases (reckoning -> statement -> invitation -> ready)
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    // Check slogan badge renders
    expect(screen.getByText(/Shut up and do it!!!/i)).toBeInTheDocument();

    // Check Enter button appears and works
    const enterBtn = screen.getByRole('button', { name: /enter boss mode/i });
    expect(enterBtn).toBeInTheDocument();

    act(() => {
      enterBtn.click();
    });

    expect(handleProceed).toHaveBeenCalledTimes(1);
  });

  it('mounts a canvas element when motion is allowed', () => {
    render(<GoldenSplash onProceed={vi.fn()} />);
    expect(document.querySelector('canvas')).not.toBeNull();
  });

  it('does not mount canvas when prefers-reduced-motion', () => {
    mockUseReducedMotion.mockReturnValue(true);
    render(<GoldenSplash onProceed={vi.fn()} />);
    expect(document.querySelector('canvas')).toBeNull();
  });

  it('renders background particles with the correct updated keyframe name and low opacity style', () => {
    render(<GoldenSplash onProceed={vi.fn()} />);
    const styleTag = document.querySelector('style');
    expect(styleTag).not.toBeNull();
    expect(styleTag?.textContent).toContain('bb-particle-float-v2');

    // Verify background particles have text-amber-400/5 class
    const particles = screen.getAllByText(/🪙|💵|\$/);
    expect(particles.length).toBeGreaterThan(0);
    expect(particles[0]).toHaveClass('text-amber-400/5');
    expect(particles[0].style.animationName).toBe('bb-particle-float-v2');
  });

  // Regression for P2-4C: the cached-sprite drawCoin path left the sprite's
  // path open and stroked it, drawing a ghost rim. The rim must be an explicit
  // beginPath/arc/stroke with the coin's own coordinates.
  it('strokes an explicit coin rim arc after the cached sprite draw (no ghost stroke)', () => {
    // Force the cached-sprite branch by making every canvas getContext succeed.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
      beginPath: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
    } as unknown as CanvasRenderingContext2D);

    const ops: Array<{ name: string; args: unknown[] }> = [];
    const record = (name: string) => (...args: unknown[]) => {
      ops.push({ name, args });
      return undefined;
    };
    const ctx = {
      save: record('save'),
      restore: record('restore'),
      translate: record('translate'),
      rotate: record('rotate'),
      scale: record('scale'),
      drawImage: record('drawImage'),
      beginPath: record('beginPath'),
      arc: record('arc'),
      fill: record('fill'),
      stroke: record('stroke'),
      fillText: record('fillText'),
    } as unknown as CanvasRenderingContext2D;

    const p = {
      x: 123,
      y: 77,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 100,
      size: 12,
      opacity: 0.9,
      rotation: 0,
      rotVel: 0,
      kind: 'coin',
      color: '#C9960C',
      seed: 0.5,
      active: true,
    } satisfies Particle;

    drawCoin(ctx, p);

    expect(ops.find((op) => op.name === 'translate')?.args).toEqual([123, 77]);
    expect(ops.find((op) => op.name === 'drawImage')?.args.slice(1)).toEqual([-12, -12, 24, 24]);

    const strokeIndices = ops.flatMap((op, i) => (op.name === 'stroke' ? [i] : []));
    expect(strokeIndices).toHaveLength(1);
    const strokeIndex = strokeIndices[0];
    expect(ops[strokeIndex - 2]?.name).toBe('beginPath');
    expect(ops[strokeIndex - 1]).toEqual({
      name: 'arc',
      args: [0, 0, 12, 0, Math.PI * 2],
    });
  });

  // Regression for P2-4C: frameCount % 3 spawned 2.4x faster at 144 Hz.
  it('advances dust spawning by elapsed time rather than frame count', () => {
    const countSpawns = (dt: number, frames: number) => {
      let accum = 0;
      let spawns = 0;
      for (let i = 0; i < frames; i++) {
        const next = advanceDustSpawn(accum, dt);
        accum = next.accum;
        if (next.spawn) spawns += 1;
      }
      return spawns;
    };

    // 60 Hz: one "60fps frame equivalent" per tick -> one spawn every 3 ticks.
    expect(countSpawns(1, 2)).toBe(0);
    expect(countSpawns(1, 3)).toBe(1);

    // 144 Hz: three real frames are only ~1.25 frame equivalents -> no spawn.
    const dt144 = 1000 / 144 / 16.67;
    expect(countSpawns(dt144, 3)).toBe(0);
    expect(countSpawns(dt144, 8)).toBe(1);
  });

  it('runs CSS scanline and spring transitions when motion is allowed', async () => {
    vi.useFakeTimers();
    render(<GoldenSplash onProceed={vi.fn()} />);
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect((screen.getByTestId('scanline-overlay') as HTMLElement).style.animation).toContain(
      'bb-scanline'
    );
    expect((screen.getByTestId('boss-line') as HTMLElement).style.animation).toContain(
      'bb-glow-pulse'
    );
    expect((screen.getByRole('button', { name: /enter boss mode/i }) as HTMLElement).style.animation).toContain(
      'bb-cta-breathe'
    );
    expect(motionCalls.some((call) => (call.props.transition as any)?.type === 'spring')).toBe(true);
  });

  it('gates CSS scanline/pulse/breathe animations and spring transitions on reduced motion', async () => {
    mockUseReducedMotion.mockReturnValue(true);
    vi.useFakeTimers();

    render(<GoldenSplash onProceed={vi.fn()} />);
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });

    expect((screen.getByTestId('scanline-overlay') as HTMLElement).style.animation).toBe('none');
    expect((screen.getByTestId('boss-line') as HTMLElement).style.animation).toBe('none');
    expect((screen.getByRole('button', { name: /enter boss mode/i }) as HTMLElement).style.animation).toBe('none');
    expect(screen.getByText(/Shut up and do it!!!/i)).not.toHaveClass('animate-pulse');

    const particles = screen.getAllByText(/🪙|💵|\$/);
    expect(particles[0].style.animationName).toBe('none');

    expect(motionCalls.some((call) => (call.props.transition as any)?.type === 'spring')).toBe(false);
  });
});
