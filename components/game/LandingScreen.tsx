"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";

interface LandingScreenProps {
  onStart: () => void;
}

function FloatingOrb({ position, color, speed }: { position: [number, number, number]; color: string; speed: number }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed;
    ref.current.position.x = position[0] + Math.sin(t * 0.7) * 1.5;
    ref.current.position.y = position[1] + Math.sin(t * 1.1) * 0.8;
    ref.current.position.z = position[2] + Math.cos(t * 0.5) * 1.2;
  });

  return (
    <Float speed={2} floatIntensity={0.3}>
      <mesh ref={ref} position={position}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </Float>
  );
}

function LandingScene() {
  return (
    <>
      <color attach="background" args={["#0a0a1a"]} />
      <fog attach="fog" args={["#0a0a1a", 5, 20]} />
      <ambientLight intensity={0.3} color="#aa88ff" />
      <directionalLight position={[3, 5, 2]} intensity={0.4} color="#cc88ff" />

      <Stars radius={15} depth={20} count={2500} factor={4} saturation={0.5} fade speed={0.3} />

      <Sparkles count={60} size={4} scale={[14, 8, 14]} speed={0.2} color="#ff69b4" />
      <Sparkles count={40} size={3} scale={[12, 6, 12]} speed={0.15} color="#b845ff" />
      <Sparkles count={30} size={2.5} scale={[10, 5, 10]} speed={0.25} color="#00d4ff" />

      <FloatingOrb position={[-3, 0, -2]} color="#ff69b4" speed={0.6} />
      <FloatingOrb position={[2.5, 1, -3]} color="#b845ff" speed={0.8} />
      <FloatingOrb position={[-1, -0.5, -1]} color="#00d4ff" speed={0.5} />
      <FloatingOrb position={[3, -1, -4]} color="#ffd700" speed={0.7} />
      <FloatingOrb position={[-2, 1.5, -5]} color="#39ff14" speed={0.4} />
    </>
  );
}

export function LandingScreen({ onStart }: LandingScreenProps) {
  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* 3D background */}
      <div className="absolute inset-0">
        <Canvas camera={{ position: [0, 0, 6], fov: 60 }}>
          <LandingScene />
        </Canvas>
      </div>

      {/* Content overlay */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <section className="animate-fade-in-up text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em]" style={{ color: "var(--neon-pink)" }}>
            Fantasy Adventure
          </p>
          <h1
            className="mt-4 text-7xl font-black sm:text-8xl"
            style={{
              color: "#fff",
              textShadow: "0 0 30px rgba(184,69,255,0.6), 0 0 60px rgba(255,45,149,0.3), 0 0 100px rgba(184,69,255,0.2)",
            }}
          >
            Pixie
          </h1>
          <p className="mx-auto mt-6 max-w-md text-base text-white/60 sm:text-lg">
            Choose a fairy, gather magical petals, and outsmart the witch&apos;s minions on your journey back to Pixie Land.
          </p>
          <button
            type="button"
            onClick={onStart}
            className="btn-neon mt-10 text-lg animate-shimmer"
          >
            Begin Adventure
          </button>
        </section>
      </div>
    </div>
  );
}
