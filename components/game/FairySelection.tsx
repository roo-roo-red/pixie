"use client";

import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Sparkles } from "@react-three/drei";
import * as THREE from "three";
import { FAIRIES } from "@/lib/game-data";
import { Fairy } from "@/types/game";

interface FairySelectionProps {
  onBack: () => void;
  onSelect: (fairy: Fairy) => void;
}

const FAIRY_COLORS: Record<string, { accent: string; glow: string; threeColor: string }> = {
  luna: { accent: "#ff69b4", glow: "rgba(255,105,180,0.3)", threeColor: "#ff69b4" },
  miri: { accent: "#00d4ff", glow: "rgba(0,212,255,0.3)", threeColor: "#00d4ff" },
  sola: { accent: "#ffd700", glow: "rgba(255,215,0,0.3)", threeColor: "#ffd700" },
};

function FairyPreviewOrb({ color }: { color: string }) {
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (bodyRef.current) {
      bodyRef.current.rotation.y = t * 0.8;
    }
    if (leftWingRef.current && rightWingRef.current) {
      const flapAngle = Math.sin(t * 10) * 0.35;
      leftWingRef.current.rotation.z = 0.3 + flapAngle;
      rightWingRef.current.rotation.z = -(0.3 + flapAngle);
    }
  });

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[1, 2, 2]} color={color} intensity={3} distance={8} />

      <Float speed={3} floatIntensity={0.4}>
        <group ref={bodyRef}>
          {/* Body */}
          <mesh>
            <sphereGeometry args={[0.35, 24, 24]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
          {/* Outer glow */}
          <mesh>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={0.6}
              transparent
              opacity={0.2}
              toneMapped={false}
            />
          </mesh>
          {/* Left wing */}
          <mesh ref={leftWingRef} position={[-0.2, 0.05, 0]} rotation={[0.2, -0.3, 0.3]}>
            <planeGeometry args={[0.5, 0.35]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={1}
              transparent
              opacity={0.45}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
          {/* Right wing */}
          <mesh ref={rightWingRef} position={[0.2, 0.05, 0]} rotation={[0.2, 0.3, -0.3]}>
            <planeGeometry args={[0.5, 0.35]} />
            <meshStandardMaterial
              color={color}
              emissive={color}
              emissiveIntensity={1}
              transparent
              opacity={0.45}
              side={THREE.DoubleSide}
              toneMapped={false}
            />
          </mesh>
        </group>
      </Float>

      <Sparkles count={15} size={2} scale={2} speed={0.8} color={color} />
    </>
  );
}

export function FairySelection({ onBack, onSelect }: FairySelectionProps) {
  return (
    <div
      className="flex h-dvh w-full items-center justify-center px-4"
      style={{ background: "radial-gradient(ellipse at 50% 30%, #1a0a3e 0%, #0a0a1a 70%)" }}
    >
      <section className="animate-fade-in-up w-full max-w-3xl">
        <h2
          className="text-center text-4xl font-black sm:text-5xl"
          style={{
            color: "#fff",
            textShadow: "0 0 20px rgba(184,69,255,0.4)",
          }}
        >
          Choose Your Fairy
        </h2>
        <p className="mt-3 text-center text-white/50">Pick your companion before stepping into the enchanted world.</p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {FAIRIES.map((fairy) => {
            const colors = FAIRY_COLORS[fairy.id] ?? { accent: "#b845ff", glow: "rgba(184,69,255,0.3)", threeColor: "#b845ff" };

            return (
              <button
                key={fairy.id}
                type="button"
                onClick={() => onSelect(fairy)}
                className="glass-panel group p-4 text-left transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                style={{
                  borderColor: "rgba(255,255,255,0.08)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = colors.accent;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 25px ${colors.glow}`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                {/* 3D Fairy preview */}
                <div className="h-32 w-full overflow-hidden rounded-lg" style={{ background: `radial-gradient(circle, ${colors.accent}15, transparent 70%)` }}>
                  <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
                    <color attach="background" args={["transparent"]} />
                    <FairyPreviewOrb color={colors.threeColor} />
                  </Canvas>
                </div>
                <h3 className="mt-3 text-xl font-black text-white">{fairy.name}</h3>
                <p className="text-sm font-semibold" style={{ color: colors.accent }}>{fairy.title}</p>
                <p className="mt-2 text-sm text-white/50">{fairy.description}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={onBack}
            className="glass-panel px-5 py-2 text-sm font-bold text-white/50 transition hover:text-white"
          >
            Back
          </button>
        </div>
      </section>
    </div>
  );
}
