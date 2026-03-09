"use client";

import { useEffect, useState } from "react";

interface LoseScreenProps {
  onTryAgain: () => void;
}

interface Ember {
  id: number;
  x: number;
  delay: number;
  size: number;
  duration: number;
}

function createEmbers(count: number): Ember[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    size: 3 + Math.random() * 5,
    duration: 3 + Math.random() * 4,
  }));
}

export function LoseScreen({ onTryAgain }: LoseScreenProps) {
  const [embers] = useState(() => createEmbers(30));
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  return (
    <div
      className="relative flex h-dvh w-full items-center justify-center overflow-hidden"
      style={{ background: "radial-gradient(ellipse at 50% 40%, #2a0a0a 0%, #0a0a1a 70%)" }}
    >
      {/* Rising ember particles */}
      {embers.map((e) => (
        <div
          key={e.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: `${e.x}%`,
            bottom: "-5%",
            width: e.size,
            height: e.size,
            background: "#ff4444",
            boxShadow: "0 0 8px #ff222280, 0 0 16px #ff000040",
            animation: `ember-rise ${e.duration}s ease-out ${e.delay}s infinite`,
          }}
        />
      ))}

      {/* Red vignette */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, rgba(255,0,0,0.2) 100%)",
        }}
      />

      {/* Pulsing red glow */}
      <div
        className="pointer-events-none absolute inset-0 animate-pulse-glow"
        style={{
          background: "radial-gradient(circle at 50% 45%, rgba(255,0,0,0.08) 0%, transparent 50%)",
        }}
      />

      <section className={`relative text-center transition-all duration-1000 ${visible ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-red-400">
          Defeat
        </p>
        <h2
          className="mt-4 text-5xl font-black sm:text-6xl"
          style={{
            color: "#fff",
            textShadow: "0 0 30px rgba(255,0,0,0.5), 0 0 60px rgba(255,0,0,0.2)",
          }}
        >
          The Minions Won
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-base text-white/60 sm:text-lg">
          The witch&apos;s minions fought back hard. Recharge your courage and try again.
        </p>
        <button
          type="button"
          onClick={onTryAgain}
          className="btn-neon mt-10 text-lg"
          style={{ background: "linear-gradient(135deg, #ff2d55, #ff6b35)" }}
        >
          Try Again
        </button>
      </section>
    </div>
  );
}
