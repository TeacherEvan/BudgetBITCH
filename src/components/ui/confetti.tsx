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
    animateRef.current = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      let allDead = true;
      particles.current.forEach(p => {
        if (p.y < canvas.height + 20) {
          allDead = false;
          p.vy += 0.3; // gravity
          p.x += p.vx;
          p.y += p.vy;
          p.rotation += p.rotationSpeed;
          
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
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
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