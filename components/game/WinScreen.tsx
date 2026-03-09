"use client";

import { useEffect, useState } from "react";

interface WinScreenProps {
  onPlayAgain: () => void;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speedX: number;
  speedY: number;
  rotation: number;
  delay: number;
}

function createConfetti(count: number): Particle[] {
  const colors = ["#ff69b4", "#ffd700", "#00d4ff", "#39ff14", "#b845ff", "#ff6b35"];
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 30 + Math.random() * 40,
    y: -10 - Math.random() * 20,
    color: colors[i % colors.length],
    size: 6 + Math.random() * 8,
    speedX: (Math.random() - 0.5) * 4,
    speedY: 1.5 + Math.random() * 3,
    rotation: Math.random() * 360,
    delay: Math.random() * 1.5,
  }));
}

export function WinScreen({ onPlayAgain }: WinScreenProps) {
  const [particles] = useState(() => createConfetti(50));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className="relative flex h-dvh w-full items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #0a2a1a 0%, #0a0a1a 70%)" }}
    >
      {/* Confetti particles */}
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size * 1.4,
            background: p.color,
            borderRadius: "2px",
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${2 + p.speedY}s linear ${p.delay}s infinite`,
            boxShadow: `0 0 6px ${p.color}80`,
          }}
        />
      ))}

      {/* Radial glow burst */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(circle at 50% 45%, rgba(57,255,20,0.12) 0%, transparent 60%)",
          animation: visible ? "glow-burst 2s ease-out forwards" : "none",
        }}
      />

      <section className={`relative text-center transition-all duration-700 ${visible ? "scale-100 opacity-100" : "scale-75 opacity-0"}`}>
        <p
          className="text-sm font-bold uppercase tracking-[0.3em]"
          style={{ color: "var(--neon-green)" }}
        >
          Victory
        </p>
        <h2
          className="animate-bounce-in mt-4 text-5xl font-black sm:text-6xl"
          style={{
            color: "#fff",
            textShadow: "0 0 30px rgba(57,255,20,0.5), 0 0 60px rgba(57,255,20,0.2)",
          }}
        >
          Pixie Land Restored
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-white/60 sm:text-lg">
          You reached Pixie Land, gathered every magical petal, and drove the witch&apos;s minions away.
        </p>
        <button
          type="button"
          onClick={onPlayAgain}
          className="btn-neon mt-10 text-lg animate-shimmer"
          style={{ background: "linear-gradient(135deg, #39ff14, #00d4ff)" }}
        >
          Play Again
        </button>
      </section>
    </div>
  );
}
