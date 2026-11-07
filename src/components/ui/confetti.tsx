'use client';

import { useEffect, useRef, useCallback } from 'react';

interface ConfettiProps {
  isActive: boolean;
  duration?: number;
  onComplete?: () => void;
  colorPalette?: string[];
}

export function Confetti({ 
  isActive, 
  duration = 3000, 
  onComplete,
  colorPalette = ['#9dcab7', '#ccb37a', '#f5d742', '#6b7280', '#ffffff']
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const particles = useRef<Array<{
    x: number; y: number; vx: number; vy: number; 
    color: string; size: number; rotation: number; rotationSpeed: number;
  }>>([]);

  const animateRef = useRef<((ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => void) | null>(null);

  const initParticles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    particles.current = Array.from({ length: 80 }, () => ({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 12,
      vy: -Math.random() * 10 - 5,
      color: colorPalette[Math.floor(Math.random() * colorPalette.length)],
      size: Math.random() * 8 + 4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
    }));
  }, [colorPalette]);

  useEffect(() => {
    let lastTime = performance.now();
    animateRef.current = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const now = performance.now();
      const elapsed = now - lastTime;
      lastTime = now;
      const dt = Math.min(Math.max(elapsed / 16.67, 0.2), 3.0);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let allDead = true;
      particles.current.forEach(p => {
        if (p.y < canvas.height + 20) {
          allDead = false;
          p.vy += 0.3 * dt; // gravity
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.rotation += p.rotationSpeed * dt;
          
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);
          ctx.fillStyle = p.color;
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
          ctx.restore();
        }
      });

      if (!allDead) {
        animationRef.current = requestAnimationFrame(() => animateRef.current!(ctx, canvas));
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      onComplete?.();
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      if (typeof ctx.setTransform === 'function') {
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    initParticles();

    const timeout = setTimeout(() => {
      onComplete?.();
    }, duration);

    animationRef.current = requestAnimationFrame(() => animateRef.current!(ctx, canvas));

    return () => {
      window.removeEventListener('resize', resize);
      clearTimeout(timeout);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive, duration, onComplete, animateRef, initParticles]);

  if (!isActive) return null;

  return (
    <canvas
      ref={canvasRef}
      data-testid="confetti-canvas"
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100vw', height: '100vh' }}
    />
  );
}