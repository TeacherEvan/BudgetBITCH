"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ─── Particle system ──────────────────────────────────────────────────────────

type ParticleKind = "shamrock" | "coin" | "sparkle" | "star";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  kind: ParticleKind;
  opacity: number;
  rotation: number;
  rotVel: number;
  life: number;
  maxLife: number;
  color: string;
}

// ─── Canvas draw helpers ──────────────────────────────────────────────────────

function drawShamrock(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  const r = p.size * 0.38;
  ctx.fillStyle = p.color;
  ctx.strokeStyle = "rgba(0,60,0,0.4)";
  ctx.lineWidth = p.size * 0.08;

  for (let i = 0; i < 3; i++) {
    const a = (i * 2 * Math.PI) / 3 - Math.PI / 2;
    ctx.beginPath();
    ctx.arc(Math.cos(a) * r, Math.sin(a) * r, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // Curved stem
  ctx.beginPath();
  ctx.moveTo(0, r * 0.5);
  ctx.quadraticCurveTo(p.size * 0.28, p.size * 0.72, 0, p.size);
  ctx.strokeStyle = p.color;
  ctx.lineWidth = p.size * 0.14;
  ctx.lineCap = "round";
  ctx.stroke();

  ctx.restore();
}

function drawCoin(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);

  // Squish horizontally to simulate tumbling
  const squish = Math.abs(Math.cos(p.rotation * 2)) * 0.7 + 0.3;

  const grad = ctx.createRadialGradient(
    -p.size * 0.3, -p.size * 0.3, p.size * 0.1,
    0, 0, p.size
  );
  grad.addColorStop(0, "#FFF9C4");
  grad.addColorStop(0.4, "#FFD700");
  grad.addColorStop(0.8, "#F59E0B");
  grad.addColorStop(1, "#78350F");

  ctx.beginPath();
  ctx.ellipse(0, 0, p.size * squish, p.size, 0, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = "#78350F";
  ctx.lineWidth = p.size * 0.1;
  ctx.stroke();

  if (p.size > 7) {
    ctx.fillStyle = "#92400E";
    ctx.font = `bold ${p.size * 0.85}px serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("€", 0, 0);
  }

  ctx.restore();
}

function drawSparkle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.fillStyle = p.color;

  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? p.size : p.size * 0.35;
    const a = (i * Math.PI) / 4;
    if (i === 0) {
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    } else {
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalAlpha = p.opacity;
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.fillStyle = p.color;

  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? p.size : p.size * 0.42;
    const a = (i * Math.PI) / 5 - Math.PI / 2;
    if (i === 0) {
      ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    } else {
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRainbow(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2;
  const cy = h * 0.08;
  const arcColors = ["#FF0000", "#FF7F00", "#FFFF00", "#00DD00", "#1E90FF", "#4B0082", "#8B00FF"];
  const arcWidth = 16;
  const baseRadius = Math.min(w * 0.65, h * 0.9);

  arcColors.forEach((color, i) => {
    const r = baseRadius - i * arcWidth;
    if (r < 0) return;
    const pulse = 1 + Math.sin(t * 0.6 + i * 0.4) * 0.015;
    ctx.beginPath();
    ctx.arc(cx, cy, r * pulse, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = color;
    ctx.lineWidth = arcWidth;
    ctx.globalAlpha = 0.28 + Math.sin(t * 0.8 + i * 0.6) * 0.08;
    ctx.stroke();
  });
  ctx.globalAlpha = 1;
}

// ─── Particle factory ─────────────────────────────────────────────────────────

const GREEN_SHADES = ["#4ade80", "#22c55e", "#16a34a", "#15803d", "#86efac"];
const GOLD_SHADES = ["#FFD700", "#FFC107", "#FBBF24", "#F59E0B", "#FDE68A"];
const LIGHT_SHADES = ["#ffffff", "#FFF9C4", "#E0F7FA", "#FFD700", "#d9f99d"];

function spawnParticle(w: number, h: number): Particle {
  const kinds: ParticleKind[] = [
    "shamrock", "shamrock", "shamrock",
    "coin", "coin",
    "sparkle", "sparkle",
    "star",
  ];
  const kind = kinds[Math.floor(Math.random() * kinds.length)];

  const colorMap: Record<ParticleKind, string[]> = {
    shamrock: GREEN_SHADES,
    coin: GOLD_SHADES,
    sparkle: LIGHT_SHADES,
    star: LIGHT_SHADES,
  };
  const palette = colorMap[kind];
  const color = palette[Math.floor(Math.random() * palette.length)];

  const size =
    kind === "coin" ? 8 + Math.random() * 16 :
      kind === "shamrock" ? 10 + Math.random() * 18 :
        3 + Math.random() * 7;

  const maxLife = 140 + Math.random() * 200;

  return {
    x: Math.random() * w,
    y: h + size * 2,
    vx: (Math.random() - 0.5) * 1.4,
    vy: -(0.6 + Math.random() * 2.8),
    size,
    kind,
    opacity: 0,
    rotation: Math.random() * Math.PI * 2,
    rotVel: (Math.random() - 0.5) * 0.07,
    life: 0,
    maxLife,
    color,
  };
}

// ─── WelcomeScreen ────────────────────────────────────────────────────────────

export interface WelcomeScreenProps {
  onEnter: () => void;
}

export default function WelcomeScreen({ onEnter }: WelcomeScreenProps) {
  const prefersReducedMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const rafRef = useRef<number>(0);
  const timeRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);

  // Canvas particle loop
  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const tick = () => {
      const w = canvas.width;
      const h = canvas.height;
      timeRef.current += 0.016;
      const t = timeRef.current;

      ctx.clearRect(0, 0, w, h);

      // Rainbow background arcs
      drawRainbow(ctx, w, h, t);

      // Spawn
      if (particlesRef.current.length < 90 && Math.random() < 0.4) {
        particlesRef.current.push(spawnParticle(w, h));
      }

      // Update + draw + cull dead particles
      particlesRef.current = particlesRef.current.filter((p) => p.life < p.maxLife);
      for (const p of particlesRef.current) {
        p.life++;
        // Gentle sway as they float up
        p.x += p.vx + Math.sin(t + p.y * 0.008) * 0.35;
        p.y += p.vy;
        p.rotation += p.rotVel;

        const ratio = p.life / p.maxLife;
        p.opacity =
          ratio < 0.08 ? ratio / 0.08 :
            ratio > 0.82 ? (1 - ratio) / 0.18 :
              1;

        switch (p.kind) {
          case "shamrock": drawShamrock(ctx, p); break;
          case "coin": drawCoin(ctx, p); break;
          case "sparkle": drawSparkle(ctx, p); break;
          case "star": drawStar(ctx, p); break;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    tick();
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, [prefersReducedMotion]);

  // Animated loading progress (0 → 100 over ~3.4 s)
  useEffect(() => {
    if (prefersReducedMotion) {
      const frame = requestAnimationFrame(() => {
        setProgress(100);
        setReady(true);
      });

      return () => cancelAnimationFrame(frame);
    }

    const start = performance.now();
    const duration = 3400;
    let frame: number;

    const step = (now: number) => {
      const pct = Math.min(100, ((now - start) / duration) * 100);
      setProgress(pct);
      if (pct < 100) {
        frame = requestAnimationFrame(step);
      } else {
        setTimeout(() => setReady(true), 200);
      }
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [prefersReducedMotion]);

  const loadingMsg =
    progress < 30 ? "Summoning the leprechaun…" :
      progress < 60 ? "Polishing the gold coins…" :
        progress < 85 ? "Finding the rainbow's end…" :
          "Magic is ready!";

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Particle + rainbow canvas */}
      {prefersReducedMotion ? null : (
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      )}

      {/* Radial vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 70% at 50% 50%, transparent 20%, rgba(2,22,10,0.55) 100%)",
        }}
      />

      {/* Central glassmorphism card */}
      <motion.div
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={
          prefersReducedMotion
            ? { duration: 0 }
            : { duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }
        }
        className="absolute inset-0 flex items-center justify-center p-4"
      >
        <div
          className="relative w-full max-w-md rounded-3xl border p-8 text-center"
          style={{
            borderColor: "rgba(255,215,0,0.25)",
            background:
              "linear-gradient(145deg, rgba(0,70,20,0.5) 0%, rgba(5,46,22,0.72) 100%)",
            backdropFilter: "blur(24px) saturate(1.6)",
            WebkitBackdropFilter: "blur(24px) saturate(1.6)",
            boxShadow:
              "0 8px 60px rgba(0,0,0,0.55), " +
              "0 0 0 1px rgba(255,215,0,0.12), " +
              "inset 0 1px 0 rgba(255,255,255,0.08)",
          }}
        >
          {/* Celtic corner shamrocks */}
          {(["top-3 left-3", "top-3 right-3", "bottom-3 left-3", "bottom-3 right-3"] as const).map(
            (pos) => (
              <span
                key={pos}
                className={`absolute ${pos} text-yellow-400/50 text-xl select-none pointer-events-none`}
              >
                ☘
              </span>
            )
          )}

          {/* Leprechaun hat bounce-in */}
          <motion.div
            initial={prefersReducedMotion ? false : { scale: 0, rotate: -25 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { delay: 0.55, type: "spring", stiffness: 300, damping: 20 }
            }
            className="text-6xl mb-3 leading-none select-none"
          >
            🎩
          </motion.div>

          {/* Title block */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 0.75, duration: 0.65 }}
          >
            <p className="text-[10px] uppercase tracking-[0.4em] text-yellow-300/70 mb-1">
              Welcome to
            </p>
            <h1
              className="text-5xl font-black leading-none mb-1"
              style={{
                background:
                  "linear-gradient(90deg, #FFD700 0%, #FFF9C4 35%, #F59E0B 65%, #FFD700 100%)",
                backgroundSize: "200% 100%",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                animation: prefersReducedMotion ? "none" : "bbShimmer 2.8s linear infinite",
              }}
            >
              BudgetBITCH
            </h1>
            <p className="text-sm text-emerald-200/65 tracking-wide mt-1">
              The Storybook Spectacle Starts Here
            </p>
          </motion.div>

          {/* Gold divider */}
          <motion.div
            initial={prefersReducedMotion ? false : { scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 1, duration: 0.8 }}
            className="my-5 h-px origin-center"
            style={{
              background:
                "linear-gradient(90deg, transparent, #FFD700 30%, #fff 50%, #FFD700 70%, transparent)",
            }}
          />

          {/* Progress bar */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={prefersReducedMotion ? { duration: 0 } : { delay: 1.1, duration: 0.5 }}
          >
            <div
              className="h-2 rounded-full overflow-hidden mb-2"
              style={{
                background: "rgba(0,0,0,0.35)",
                border: "1px solid rgba(255,215,0,0.2)",
              }}
            >
              <div
                className="h-full rounded-full transition-none"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, #22c55e, #4ade80, #FFD700, #F59E0B, #ef4444, #a855f7, #22c55e)",
                  backgroundSize: "300% 100%",
                  animation: prefersReducedMotion ? "none" : "bbRainbow 1.8s linear infinite",
                  boxShadow: "0 0 12px rgba(255,215,0,0.55)",
                  transition: prefersReducedMotion ? "none" : "width 0.05s linear",
                }}
              />
            </div>
            <p className="text-[11px] text-emerald-300/55 tabular-nums">
              {Math.round(progress)}% — {loadingMsg}
            </p>
          </motion.div>

          {/* Enter button */}
          <AnimatePresence>
            {ready && (
              <motion.button
                key="enter"
                initial={prefersReducedMotion ? false : { opacity: 0, y: 10, scale: 0.94 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: "easeOut" }}
                onClick={onEnter}
                className="mt-4 cursor-pointer px-8 py-3 rounded-xl font-bold text-sm tracking-wide text-black select-none"
                style={{
                  background: "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                  boxShadow: "0 4px 24px rgba(255,165,0,0.45)",
                  animation: prefersReducedMotion ? "none" : "bbPulse 2s ease-in-out infinite",
                }}
              >
                ☘ Enter the Magic ☘
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Global keyframes */}
      <style>{`
        @keyframes bbShimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
        @keyframes bbRainbow {
          0%   { background-position: 0% center; }
          100% { background-position: 300% center; }
        }
        @keyframes bbPulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(255,165,0,0.45); }
          50%       { box-shadow: 0 4px 36px rgba(255,215,0,0.75), 0 0 0 6px rgba(255,215,0,0.12); }
        }
      `}</style>
    </div>
  );
}
