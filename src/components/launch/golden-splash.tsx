"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

export type ParticleType = 'gold-dust' | 'coin' | 'sparkle';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  opacity: number;
  rotation: number;
  rotVel: number;
  kind: ParticleType;
  color: string;
  seed: number;
  active?: boolean;
}

export function drawGoldDust(ctx: CanvasRenderingContext2D, p: Particle) {
  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
  grad.addColorStop(0, `rgba(245, 215, 66, ${p.opacity})`);
  grad.addColorStop(1, `rgba(201, 150, 12, 0)`);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fill();
}

export function drawCoin(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  const squish = Math.abs(Math.cos(p.rotation));
  ctx.scale(1, Math.max(0.1, squish));
  
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size);
  grad.addColorStop(0, `rgba(245, 215, 66, ${p.opacity})`);
  grad.addColorStop(0.8, `rgba(201, 150, 12, ${p.opacity})`);
  grad.addColorStop(1, `rgba(130, 90, 5, ${p.opacity})`);
  ctx.fillStyle = grad;
  
  ctx.beginPath();
  ctx.arc(0, 0, p.size, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity * 0.5})`;
  ctx.lineWidth = 1;
  ctx.stroke();

  if (p.size > 8) {
    ctx.fillStyle = `rgba(8, 6, 0, ${p.opacity * 0.7})`;
    ctx.font = `bold ${p.size * 1.1}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("€", 0, 0);
  }
  ctx.restore();
}

export function drawSparkle(ctx: CanvasRenderingContext2D, p: Particle) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2);
  grad.addColorStop(0, `rgba(245, 215, 66, ${p.opacity * 0.4})`);
  grad.addColorStop(1, 'rgba(245, 215, 66, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, p.size * 2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = `rgba(255, 245, 215, ${p.opacity})`;
  ctx.beginPath();
  const rOuter = p.size;
  ctx.moveTo(0, -rOuter);
  ctx.quadraticCurveTo(0, 0, rOuter, 0);
  ctx.quadraticCurveTo(0, 0, 0, rOuter);
  ctx.quadraticCurveTo(0, 0, -rOuter, 0);
  ctx.quadraticCurveTo(0, 0, 0, -rOuter);
  ctx.closePath();
  ctx.fill();
  
  ctx.restore();
}

export function spawnParticle(
  kind: ParticleType,
  w: number,
  h: number,
  fromCenter: boolean = false
): Particle {
  const seed = Math.random();
  let maxLife = 0;
  let size = 0;
  let rotation = Math.random() * Math.PI * 2;
  let rotVel = 0;
  let color = '#FFFFFF';
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;

  if (kind === 'gold-dust') {
    maxLife = 60 + Math.random() * 40;
    size = 2 + Math.random() * 3;
    rotVel = (Math.random() - 0.5) * 0.05;
    color = '#F5D742';

    if (fromCenter) {
      x = w / 2 + (Math.random() - 0.5) * 40;
      y = h / 2 + (Math.random() - 0.5) * 40;
    } else {
      x = Math.random() * w;
      y = h + Math.random() * 20;
    }
    vx = (Math.random() - 0.5) * 1.5;
    vy = -2 - Math.random() * 2;
  } else if (kind === 'coin') {
    maxLife = 100 + Math.random() * 60;
    size = 6 + Math.random() * 6;
    rotVel = (Math.random() - 0.5) * 0.1;
    color = '#C9960C';

    if (fromCenter) {
      x = w / 2;
      y = h / 2;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      vx = Math.cos(angle) * speed;
      vy = Math.sin(angle) * speed - 2;
    } else {
      x = Math.random() * w;
      y = h + Math.random() * 20;
      vx = (Math.random() - 0.5) * 2;
      vy = -3 - Math.random() * 3;
    }
  } else {
    maxLife = 50 + Math.random() * 30;
    size = 3 + Math.random() * 5;
    rotVel = (Math.random() - 0.5) * 0.2;
    color = '#FFFFFF';

    if (fromCenter) {
      x = w / 2;
      y = h / 2;
    } else {
      x = Math.random() * w;
      y = Math.random() * h;
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    vx = Math.cos(angle) * speed;
    vy = Math.sin(angle) * speed;
  }

  return {
    x,
    y,
    vx,
    vy,
    life: 0,
    maxLife,
    size,
    opacity: 0,
    rotation,
    rotVel,
    kind,
    color,
    seed,
    active: true,
  };
}

export const POOL_SIZE = 120;

export function acquireParticle(pool: Particle[]): Particle | null {
  const p = pool.find((item) => !item.active);
  if (p) {
    p.active = true;
    return p;
  }
  return null;
}

export function releaseParticle(pool: Particle[], p: Particle) {
  p.active = false;
}

interface GoldenSplashProps {
  onProceed: () => void;
}

// Particle element for floating money & gold particles
function Particle({ style, char }: { style: React.CSSProperties; char: string }) {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute bottom-0 text-amber-400/5 text-xl md:text-2xl font-black opacity-0 select-none"
      style={style}
    >
      {char}
    </span>
  );
}

// Deterministic particles generated outside the component to adhere to react-hooks/purity
const PARTICLES = Array.from({ length: 16 }, (_, i) => {
  const characters = ["🪙", "💵", "$"];
  return {
    id: i,
    char: characters[i % characters.length],
    style: {
      left: `${4 + i * 6.2}%`,
      animationDelay: `${(i * 0.22).toFixed(2)}s`,
      animationDuration: `${3.2 + (i % 4) * 0.5}s`,
      animationName: "bb-particle-float-v2",
      animationTimingFunction: "ease-out",
      animationIterationCount: "infinite",
    } as React.CSSProperties,
  };
});

const budgetLetters = Array.from("BUDGET");
const bossLetters = Array.from("BOSS");

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.15,
    },
  },
};

const letterVariants = {
  hidden: {
    opacity: 0,
    y: -90,
    scale: 2.2,
    rotateX: -90,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: {
      type: "spring" as const,
      damping: 9,
      stiffness: 150,
    },
  },
};

export function GoldenSplash({ onProceed }: GoldenSplashProps) {
  const [phase, setPhase] = useState<"reckoning" | "statement" | "invitation">("reckoning");
  const [ready, setReady] = useState(false);

  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    window.addEventListener("resize", resize);
    resize();

    // Populate pool of 120 particles
    const pool: Particle[] = Array.from({ length: POOL_SIZE }, () => ({
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      size: 0,
      opacity: 0,
      rotation: 0,
      rotVel: 0,
      kind: "gold-dust",
      color: "#FFFFFF",
      seed: 0,
      active: false,
    }));

    let frameCount = 0;
    let lastPhase = phaseRef.current;

    const tick = () => {
      if (document.hidden) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Phase transition checks and bursts
      const currentPhase = phaseRef.current;
      if (lastPhase !== currentPhase) {
        if (currentPhase === "statement") {
          // When moving to 'statement', spawn 15 coins and 20 sparkles from the screen center.
          for (let i = 0; i < 15; i++) {
            const p = acquireParticle(pool);
            if (p) {
              Object.assign(p, spawnParticle("coin", width, height, true));
            }
          }
          for (let i = 0; i < 20; i++) {
            const p = acquireParticle(pool);
            if (p) {
              Object.assign(p, spawnParticle("sparkle", width, height, true));
            }
          }
        } else if (currentPhase === "invitation") {
          // When moving to 'invitation', spawn 10 sparkles from the logo position (approx center horizontally, 30% down from the top).
          for (let i = 0; i < 10; i++) {
            const p = acquireParticle(pool);
            if (p) {
              Object.assign(p, spawnParticle("sparkle", width, height, true));
              p.x = width / 2;
              p.y = height * 0.3;
            }
          }
        }
        lastPhase = currentPhase;
      }

      // Spawn logic: spawns gold-dust from the bottom continuously (every 3 frames, max 60 active)
      frameCount++;
      if (frameCount % 3 === 0) {
        const activeDustCount = pool.filter(p => p.active && p.kind === 'gold-dust').length;
        if (activeDustCount < 60) {
          const p = acquireParticle(pool);
          if (p) {
            const spawned = spawnParticle('gold-dust', width, height, false);
            Object.assign(p, spawned);
          }
        }
      }

      // Physics, Update, Draw, and Recycle loop
      for (const p of pool) {
        if (!p.active) continue;

        p.life++;
        if (p.life >= p.maxLife) {
          releaseParticle(pool, p);
          continue;
        }

        const t = p.life / p.maxLife;
        p.opacity = Math.sin(t * Math.PI); // easeInOut-ish opacity

        // Physics: gravity, wind/turbulence, rotation, rotVel, life/maxLife
        if (p.kind === 'gold-dust') {
          p.vy += 0.01;
          p.vx += Math.sin(p.life * 0.05 + p.seed * 10) * 0.08;
        } else if (p.kind === 'coin') {
          p.vy += 0.15;
          p.vx += Math.sin(p.life * 0.02 + p.seed * 5) * 0.02;
        } else {
          p.vx *= 0.98;
          p.vy *= 0.98;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotVel;

        if (p.kind === 'gold-dust') {
          drawGoldDust(ctx, p);
        } else if (p.kind === 'coin') {
          drawCoin(ctx, p);
        } else if (p.kind === 'sparkle') {
          drawSparkle(ctx, p);
        }
      }

      animationFrameId = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [prefersReducedMotion]);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("statement"), 400);
    const t2 = setTimeout(() => setPhase("invitation"), 1800);
    const t3 = setTimeout(() => setReady(true), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  return (
    <>
      {/* Particle float keyframes injected via style tag */}
      <style>{`
        @keyframes bb-particle-float-v2 {
          0%   { transform: translateY(0) scale(0.6) rotate(0deg); opacity: 0; }
          15%  { opacity: 0.6; }
          80%  { opacity: 0.4; }
          100% { transform: translateY(-85vh) scale(1.1) rotate(360deg); opacity: 0; }
        }
        @keyframes bb-glow-pulse {
          0%, 100% { text-shadow: 0 0 16px rgba(245,215,66,0.5), 0 0 40px rgba(245,215,66,0.2); }
          50%       { text-shadow: 0 0 36px rgba(245,215,66,0.95), 0 0 90px rgba(245,215,66,0.45); }
        }
        @keyframes bb-cta-breathe {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245,215,66,0.6), inset 0 0 0 1px rgba(245,215,66,0.7); }
          50%       { box-shadow: 0 0 28px 8px rgba(245,215,66,0.35), inset 0 0 0 1px rgba(255,255,255,1); }
        }
        @keyframes bb-scanline {
          0%   { background-position: 0 0; }
          100% { background-position: 0 8px; }
        }
      `}</style>

      <div
        data-testid="golden-splash"
        className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#080600] text-[#F8F3E8] overflow-hidden select-none"
      >
        { !prefersReducedMotion && (
          <canvas
            ref={canvasRef}
            aria-hidden="true"
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ zIndex: 1 }}
          />
        ) }

        {/* Floating Money & Gold Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {PARTICLES.map((p) => (
            <Particle key={p.id} style={p.style} char={p.char} />
          ))}
        </div>

        {/* Cinematic Ambient Gold Radial Glows */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          animate={{
            opacity: phase === "reckoning" ? 0.08 : phase === "statement" ? 0.28 : 0.2,
          }}
          transition={{ duration: 0.8 }}
          style={{
            background: "radial-gradient(circle 750px at 50% 50%, #F5D742 0%, #C9960C 25%, transparent 80%)",
          }}
        />

        {/* Scanline Overlay */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-10"
          style={{
            backgroundImage: "repeating-linear-gradient(0deg, rgba(0,0,0,0.22) 0px, rgba(0,0,0,0.22) 1px, transparent 1px, transparent 4px)",
            animation: "bb-scanline 0.3s steps(1) infinite",
          }}
        />

        {/* Main Content Area */}
        <div className="relative flex flex-col items-center w-full max-w-xl px-6 z-20 text-center">

          {/* Monogram Crest */}
          <motion.div
            initial={{ opacity: 0, scale: 0.3, y: 20 }}
            animate={
              phase !== "reckoning"
                ? { opacity: 1, scale: 1, y: 0 }
                : { opacity: 0, scale: 0.3, y: 20 }
            }
            transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0 }}
            className="relative mb-6 flex justify-center"
          >
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              animate={phase === "statement" ? { opacity: [0, 0.7, 0] } : { opacity: 0 }}
              transition={{ duration: 1.2, delay: 0.1 }}
              style={{
                background: "radial-gradient(circle 70px at 50% 50%, #F5D742 0%, transparent 70%)",
                filter: "blur(10px)",
              }}
            />
            <svg className="w-20 h-20 drop-shadow-[0_0_20px_rgba(245,215,66,0.6)]" viewBox="0 0 100 100">
              <motion.path
                d="M 18,50 A 32,32 0 1,1 82,50 A 32,32 0 0,1 18,50"
                fill="none"
                stroke="#F5D742"
                strokeWidth="2"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={phase !== "reckoning" ? { pathLength: 1 } : { pathLength: 0 }}
                transition={{ duration: 0.9, ease: "easeInOut", delay: 0.1 }}
              />
              <text
                x="50"
                y="58"
                textAnchor="middle"
                className="font-black fill-[#F5D742]"
                fontSize="22"
                style={{ fontFamily: "var(--font-space-grotesk, sans-serif)", letterSpacing: "-0.04em" }}
              >
                BB
              </text>
            </svg>
          </motion.div>

          {/* Top Metallic Blade Accent Line */}
          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={phase !== "reckoning" ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
            className="w-full h-[2px] mb-6"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #C9960C 30%, #F5D742 50%, #C9960C 70%, transparent 100%)",
              boxShadow: "0 0 12px #F5D742",
            }}
          />

          {/* 3D Staggered Letter Slam: BUDGET on Line 1, BOSS on Line 2 */}
          <div className="flex flex-col items-center gap-1 select-none" style={{ perspective: "1000px" }}>
            {/* LINE 1: BUDGET */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={phase !== "reckoning" ? "visible" : "hidden"}
              className="flex justify-center text-4xl md:text-6xl font-black uppercase tracking-widest text-white font-space-grotesk"
            >
              {budgetLetters.map((letter, idx) => (
                <motion.span
                  key={idx}
                  variants={letterVariants}
                  className="inline-block transform-gpu filter drop-shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                  style={{ transformOrigin: "bottom center" }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>

            {/* LINE 2: BOSS */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate={phase !== "reckoning" ? "visible" : "hidden"}
              className="flex justify-center text-5xl md:text-7xl font-black uppercase tracking-[0.3em] bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 bg-clip-text text-transparent font-space-grotesk"
              style={{
                animation: phase === "invitation" ? "bb-glow-pulse 2.4s ease-in-out infinite" : "none",
              }}
            >
              {bossLetters.map((letter, idx) => (
                <motion.span
                  key={idx}
                  variants={letterVariants}
                  className="inline-block transform-gpu filter drop-shadow-[0_6px_30px_rgba(245,215,66,0.65)]"
                  style={{ transformOrigin: "bottom center" }}
                >
                  {letter}
                </motion.span>
              ))}
            </motion.div>
          </div>

          {/* ACT 3: SHOUTED SLOGAN BANNER */}
          <AnimatePresence>
            {phase === "invitation" && (
              <motion.div
                initial={{ scale: 0, rotate: -15, opacity: 0 }}
                animate={{ scale: 1, rotate: -2, opacity: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 240, damping: 11 }}
                className="mt-6 inline-block rounded-2xl border-2 border-[#F5D742] bg-zinc-950 px-6 py-2.5 shadow-[0_0_35px_rgba(245,215,66,0.3)] animate-pulse"
              >
                <span 
                  className="text-sm md:text-base font-black uppercase tracking-widest bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 bg-clip-text text-transparent filter drop-shadow font-space-grotesk"
                >
                  &ldquo;Shut up and do it!!!&rdquo;
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Blade Line */}
          <motion.div
            initial={{ scaleX: 0, originX: 1 }}
            animate={phase !== "reckoning" ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
            className="w-2/3 h-[1px] mt-8 mb-8"
            style={{
              background: "linear-gradient(90deg, transparent 0%, #C9960C 40%, transparent 100%)",
              opacity: 0.6,
            }}
          />

          {/* CTA ENTER BUTTON */}
          <div className="h-16 flex items-center justify-center">
            <AnimatePresence>
              {ready && (
                <motion.button
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -14 }}
                  transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  onClick={onProceed}
                  className="relative px-9 py-3 text-black bg-[#F5D742] font-black text-sm tracking-widest uppercase cursor-pointer transition-all duration-200 hover:bg-amber-300 hover:scale-105 active:scale-[0.97] rounded-xl shadow-[0_0_25px_rgba(245,215,66,0.4)]"
                  style={{
                    fontFamily: "var(--font-space-grotesk, sans-serif)",
                    animation: "bb-cta-breathe 2s ease-in-out infinite",
                  }}
                >
                  [ ENTER BOSS MODE ]
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
