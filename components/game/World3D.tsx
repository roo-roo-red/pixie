"use client";

import { useRef, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles, Stars, Trail } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { Area, AreaWorld, Direction, HazardTile, MinionState, Point, PowerId } from "@/types/game";
import { getMinionsForArea } from "@/lib/game-data";

interface World3DProps {
  area: Area;
  areaWorld: AreaWorld;
  playerPosition: Point;
  resolvedObstacleNodes: Record<string, Point | null>;
  collectedPetals: Set<PowerId>;
  obstaclesCleared: Set<string>;
  onMove: (direction: Direction) => void;
  playerHealth: number;
  isDashing: boolean;
  lastMoveDirection: Direction;
  minionStates: MinionState[];
  now: number;
}

const AREA_THEMES: Record<string, {
  bg: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  ambientColor: string;
  sunColor: string;
  sunIntensity: number;
  groundColor: string;
  tileColor: string;
  wallColor: string;
  sparkleColor: string;
  sparkleCount: number;
  wallDecor: "flowers" | "crystals" | "shadows" | "rainbow";
}> = {
  "flower-forest": {
    bg: "#1a0a2e",
    fogColor: "#1a0a2e",
    fogNear: 8,
    fogFar: 20,
    ambientIntensity: 0.5,
    ambientColor: "#ffd4e8",
    sunColor: "#ffcc77",
    sunIntensity: 1.0,
    groundColor: "#1a3a2a",
    tileColor: "#2a5a3a",
    wallColor: "#3a7a4a",
    sparkleColor: "#ff69b4",
    sparkleCount: 40,
    wallDecor: "flowers",
  },
  "crystal-river": {
    bg: "#0a1a3e",
    fogColor: "#0a1a3e",
    fogNear: 7,
    fogFar: 18,
    ambientIntensity: 0.45,
    ambientColor: "#aaccff",
    sunColor: "#88bbff",
    sunIntensity: 0.8,
    groundColor: "#0a2a3a",
    tileColor: "#1a3a5a",
    wallColor: "#2a5a7a",
    sparkleColor: "#00d4ff",
    sparkleCount: 50,
    wallDecor: "crystals",
  },
  "shadow-path": {
    bg: "#12061e",
    fogColor: "#12061e",
    fogNear: 5,
    fogFar: 15,
    ambientIntensity: 0.3,
    ambientColor: "#aa88dd",
    sunColor: "#8866aa",
    sunIntensity: 0.5,
    groundColor: "#1a0a2a",
    tileColor: "#2a1a3a",
    wallColor: "#3a1a4a",
    sparkleColor: "#b845ff",
    sparkleCount: 30,
    wallDecor: "shadows",
  },
  "pixie-land": {
    bg: "#1a0a3e",
    fogColor: "#1a0a3e",
    fogNear: 10,
    fogFar: 25,
    ambientIntensity: 0.7,
    ambientColor: "#ffeedd",
    sunColor: "#ffddaa",
    sunIntensity: 1.2,
    groundColor: "#2a1a4a",
    tileColor: "#3a2a5a",
    wallColor: "#5a3a7a",
    sparkleColor: "#ffd700",
    sparkleCount: 80,
    wallDecor: "rainbow",
  },
};

function pointKey(point: Point) {
  return `${point.x},${point.y}`;
}

function toWorld(point: Point, width: number, height: number) {
  return {
    x: point.x - width / 2 + 0.5,
    z: point.y - height / 2 + 0.5,
  };
}

/* ── Camera with shake + dash zoom ── */

function FollowCamera({
  target,
  playerHealth,
  isDashing,
}: {
  target: { x: number; z: number };
  playerHealth: number;
  isDashing: boolean;
}) {
  const { camera } = useThree();
  const prevHealthRef = useRef(playerHealth);
  const shakeRef = useRef(0);

  useFrame((_, delta) => {
    // Detect damage → trigger shake
    if (playerHealth < prevHealthRef.current) {
      shakeRef.current = 1.0;
    }
    prevHealthRef.current = playerHealth;

    // Decay shake
    if (shakeRef.current > 0) {
      shakeRef.current = Math.max(0, shakeRef.current - delta * 4);
    }

    // Base camera position
    const zoomOffset = isDashing ? -0.8 : 0;
    const desired = new THREE.Vector3(
      target.x + 3.8,
      6.2 + zoomOffset * 0.3,
      target.z + 4.6 + zoomOffset,
    );

    // Apply shake offset
    if (shakeRef.current > 0) {
      const intensity = shakeRef.current * 0.15;
      desired.x += (Math.random() - 0.5) * intensity;
      desired.y += (Math.random() - 0.5) * intensity;
      desired.z += (Math.random() - 0.5) * intensity;
    }

    const lerpSpeed = isDashing ? 0.15 : 0.08;
    camera.position.lerp(desired, lerpSpeed);
    camera.lookAt(target.x, 0.1, target.z);
  });

  return null;
}

/* ── Fairy character with wings + trail ── */

function FairyOrb({
  target,
  lastMoveDirection,
}: {
  target: { x: number; z: number };
  lastMoveDirection: Direction;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Mesh>(null);
  const leftWingRef = useRef<THREE.Mesh>(null);
  const rightWingRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  const facingAngle = useMemo(() => {
    switch (lastMoveDirection) {
      case "up": return Math.PI;
      case "down": return 0;
      case "left": return Math.PI / 2;
      case "right": return -Math.PI / 2;
    }
  }, [lastMoveDirection]);

  useFrame((state) => {
    if (!groupRef.current || !bodyRef.current) return;

    const t = state.clock.elapsedTime;

    // Smooth movement
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, target.x, 0.2);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, target.z, 0.2);
    groupRef.current.position.y = 0.36 + Math.sin(t * 4) * 0.06;

    // Face movement direction
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      facingAngle,
      0.12,
    );

    // Wing flap
    if (leftWingRef.current && rightWingRef.current) {
      const flapAngle = Math.sin(t * 12) * 0.4;
      leftWingRef.current.rotation.z = 0.3 + flapAngle;
      rightWingRef.current.rotation.z = -(0.3 + flapAngle);
    }

    // Light follows
    if (lightRef.current) {
      lightRef.current.position.copy(groupRef.current.position);
      lightRef.current.position.y += 0.4;
    }
  });

  return (
    <>
      <group ref={groupRef}>
        {/* Trail effect */}
        <Trail
          width={0.6}
          length={6}
          color="#c084fc"
          attenuation={(w) => w * w}
        >
          {/* Body orb */}
          <mesh ref={bodyRef} castShadow>
            <sphereGeometry args={[0.2, 24, 24]} />
            <meshStandardMaterial
              color="#c084fc"
              emissive="#a855f7"
              emissiveIntensity={2}
              toneMapped={false}
            />
          </mesh>
        </Trail>

        {/* Inner glow orb */}
        <mesh>
          <sphereGeometry args={[0.28, 16, 16]} />
          <meshStandardMaterial
            color="#e9d5ff"
            emissive="#c084fc"
            emissiveIntensity={0.8}
            transparent
            opacity={0.25}
            toneMapped={false}
          />
        </mesh>

        {/* Left wing */}
        <mesh
          ref={leftWingRef}
          position={[-0.12, 0.05, -0.02]}
          rotation={[0.2, -0.3, 0.3]}
        >
          <planeGeometry args={[0.3, 0.2]} />
          <meshStandardMaterial
            color="#e9d5ff"
            emissive="#c084fc"
            emissiveIntensity={1}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {/* Right wing */}
        <mesh
          ref={rightWingRef}
          position={[0.12, 0.05, -0.02]}
          rotation={[0.2, 0.3, -0.3]}
        >
          <planeGeometry args={[0.3, 0.2]} />
          <meshStandardMaterial
            color="#e9d5ff"
            emissive="#c084fc"
            emissiveIntensity={1}
            transparent
            opacity={0.5}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
        </mesh>

        {/* Sparkle halo around fairy */}
        <Sparkles count={8} size={1.5} scale={0.6} speed={0.8} color="#e9d5ff" />
      </group>
      <pointLight ref={lightRef} color="#c084fc" intensity={3} distance={5} decay={2} />
    </>
  );
}

/* ── Wall decorations per area ── */

function FlowerDecor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.35, 6]} />
        <meshStandardMaterial color="#2a8a3a" />
      </mesh>
      {/* Flower head */}
      <Float speed={2} floatIntensity={0.15} rotationIntensity={0.1}>
        <mesh position={[0, 0.45, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color="#ff69b4"
            emissive="#ff69b4"
            emissiveIntensity={0.6}
            toneMapped={false}
          />
        </mesh>
      </Float>
    </group>
  );
}

function CrystalDecor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]} rotation={[0, Math.random() * Math.PI, 0.1]}>
        <octahedronGeometry args={[0.12, 0]} />
        <meshStandardMaterial
          color="#66ddff"
          emissive="#00aaff"
          emissiveIntensity={1.2}
          transparent
          opacity={0.7}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function ShadowWisp({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + 0.3 + Math.sin(t * 1.5 + position[0]) * 0.15;
    ref.current.position.x = position[0] + Math.sin(t * 0.8 + position[2]) * 0.1;
  });

  return (
    <mesh ref={ref} position={position}>
      <sphereGeometry args={[0.07, 8, 8]} />
      <meshStandardMaterial
        color="#9955dd"
        emissive="#7733bb"
        emissiveIntensity={1}
        transparent
        opacity={0.4}
        toneMapped={false}
      />
    </mesh>
  );
}

function RainbowPillar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.5, 8]} />
        <meshStandardMaterial
          color="#d946ef"
          emissive="#d946ef"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <Sparkles count={4} size={1.2} scale={0.4} speed={1} color="#ffd700" position={[0, 0.5, 0]} />
    </group>
  );
}

function WallDecoration({
  type,
  position,
}: {
  type: "flowers" | "crystals" | "shadows" | "rainbow";
  position: [number, number, number];
}) {
  switch (type) {
    case "flowers": return <FlowerDecor position={position} />;
    case "crystals": return <CrystalDecor position={position} />;
    case "shadows": return <ShadowWisp position={position} />;
    case "rainbow": return <RainbowPillar position={position} />;
  }
}

/* ── Area-specific ambient particles ── */

function AreaParticles({ areaId }: { areaId: string }) {
  switch (areaId) {
    case "flower-forest":
      return (
        <>
          <Sparkles count={20} size={2} scale={[10, 2, 10]} speed={0.1} color="#ffcc44" position={[0, 1, 0]} />
          <Sparkles count={15} size={1.5} scale={[8, 3, 8]} speed={0.15} color="#ff88aa" position={[0, 1.5, 0]} />
        </>
      );
    case "crystal-river":
      return (
        <>
          <Sparkles count={30} size={2} scale={[10, 2, 10]} speed={0.2} color="#44aaff" position={[0, 0.5, 0]} />
          <Sparkles count={15} size={3} scale={[12, 1, 12]} speed={0.08} color="#aaddff" position={[0, 0.2, 0]} />
        </>
      );
    case "shadow-path":
      return (
        <Sparkles count={15} size={2.5} scale={[10, 4, 10]} speed={0.05} color="#6633aa" position={[0, 2, 0]} />
      );
    case "pixie-land":
      return (
        <>
          <Sparkles count={30} size={3} scale={[10, 3, 10]} speed={0.4} color="#ff69b4" position={[0, 1, 0]} />
          <Sparkles count={30} size={3} scale={[10, 3, 10]} speed={0.3} color="#ffd700" position={[0, 1.5, 0]} />
          <Sparkles count={20} size={2.5} scale={[10, 3, 10]} speed={0.35} color="#00d4ff" position={[0, 2, 0]} />
          <Sparkles count={20} size={2} scale={[10, 3, 10]} speed={0.25} color="#39ff14" position={[0, 1.2, 0]} />
        </>
      );
    default:
      return null;
  }
}

/* ── Portal ring with rotating animation ── */

function PortalRing({
  position,
  color,
}: {
  position: [number, number, number];
  color: string;
}) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.x = Math.PI / 2;
    ref.current.rotation.z = state.clock.elapsedTime * 1.5;
  });

  return (
    <group position={position}>
      {/* Outer ring */}
      <mesh ref={ref}>
        <torusGeometry args={[0.28, 0.04, 12, 24]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2.5}
          toneMapped={false}
        />
      </mesh>
      {/* Inner glow disc */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.22, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
          toneMapped={false}
        />
      </mesh>
      {/* Sparkles rising from portal */}
      <Sparkles count={6} size={1.5} scale={0.5} speed={1.2} color={color} position={[0, 0.3, 0]} />
      <pointLight color={color} intensity={1.5} distance={3} decay={2} />
    </group>
  );
}

/* ── Hazard visual components ── */

const HAZARD_VISUALS: Record<string, { color: string; emissive: string; particle: string }> = {
  lava: { color: "#ff4400", emissive: "#ff2200", particle: "#ff6b35" },
  poison: { color: "#22cc44", emissive: "#11aa22", particle: "#39ff14" },
  thorns: { color: "#886633", emissive: "#554422", particle: "#ff69b4" },
  spikes: { color: "#888899", emissive: "#6666aa", particle: "#aaaaff" },
};

function isHazardActiveVisual(hazard: HazardTile, now: number): boolean {
  if (!hazard.cycleSec) return true;
  const cycleMs = hazard.cycleSec * 1000;
  const offset = (hazard.phaseOffset ?? 0) * cycleMs;
  const phase = ((now + offset) % cycleMs) / cycleMs;
  return phase < 0.5;
}

function HazardMesh({
  hazard,
  gridWidth,
  gridHeight,
  now,
}: {
  hazard: HazardTile;
  gridWidth: number;
  gridHeight: number;
  now: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const vis = HAZARD_VISUALS[hazard.type] ?? HAZARD_VISUALS.lava;
  const active = isHazardActiveVisual(hazard, now);
  const world = toWorld(hazard.position, gridWidth, gridHeight);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Pulse when active
    if (active) {
      groupRef.current.scale.y = 1 + Math.sin(t * 6) * 0.15;
    } else {
      groupRef.current.scale.y = THREE.MathUtils.lerp(groupRef.current.scale.y, 0.2, 0.1);
    }
  });

  if (hazard.type === "lava") {
    return (
      <group ref={groupRef} position={[world.x, 0.02, world.z]}>
        {/* Lava pool */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.4, 16]} />
          <meshStandardMaterial
            color={active ? vis.color : "#331100"}
            emissive={active ? vis.emissive : "#110000"}
            emissiveIntensity={active ? 2 : 0.2}
            toneMapped={false}
          />
        </mesh>
        {active && (
          <>
            <Sparkles count={6} size={1.5} scale={0.6} speed={1.5} color={vis.particle} position={[0, 0.2, 0]} />
            <pointLight color={vis.emissive} intensity={1} distance={2} decay={2} position={[0, 0.3, 0]} />
          </>
        )}
      </group>
    );
  }

  if (hazard.type === "poison") {
    return (
      <group ref={groupRef} position={[world.x, 0.02, world.z]}>
        {/* Poison fog cloud */}
        <mesh position={[0, active ? 0.25 : 0.05, 0]}>
          <sphereGeometry args={[0.32, 10, 10]} />
          <meshStandardMaterial
            color={active ? vis.color : "#113311"}
            emissive={active ? vis.emissive : "#001100"}
            emissiveIntensity={active ? 1.2 : 0.1}
            transparent
            opacity={active ? 0.45 : 0.1}
            toneMapped={false}
          />
        </mesh>
        {active && (
          <Sparkles count={4} size={1.2} scale={0.5} speed={0.4} color={vis.particle} position={[0, 0.3, 0]} />
        )}
      </group>
    );
  }

  if (hazard.type === "thorns") {
    return (
      <group ref={groupRef} position={[world.x, 0.02, world.z]}>
        {/* Thorn spikes */}
        {[-0.15, 0, 0.15].map((offset, i) => (
          <mesh key={i} position={[offset, active ? 0.18 : 0.05, offset * 0.5]}>
            <coneGeometry args={[0.06, active ? 0.3 : 0.08, 5]} />
            <meshStandardMaterial
              color={vis.color}
              emissive={active ? vis.emissive : "#221100"}
              emissiveIntensity={active ? 0.8 : 0.1}
              toneMapped={false}
            />
          </mesh>
        ))}
        {active && (
          <pointLight color="#ff69b4" intensity={0.5} distance={1.5} decay={2} position={[0, 0.3, 0]} />
        )}
      </group>
    );
  }

  // spikes
  return (
    <group ref={groupRef} position={[world.x, 0.02, world.z]}>
      {/* Metal spike grid */}
      {[
        [-0.15, -0.15], [0.15, -0.15], [0, 0],
        [-0.15, 0.15], [0.15, 0.15],
      ].map(([ox, oz], i) => (
        <mesh key={i} position={[ox, active ? 0.2 : 0.02, oz]}>
          <coneGeometry args={[0.04, active ? 0.35 : 0.04, 4]} />
          <meshStandardMaterial
            color={vis.color}
            emissive={active ? vis.emissive : "#222233"}
            emissiveIntensity={active ? 1.5 : 0.1}
            metalness={0.8}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      ))}
      {active && (
        <>
          <Sparkles count={3} size={1} scale={0.4} speed={2} color={vis.particle} position={[0, 0.3, 0]} />
          <pointLight color={vis.emissive} intensity={0.8} distance={1.5} decay={2} position={[0, 0.3, 0]} />
        </>
      )}
    </group>
  );
}

/* ── Minion visual components ── */

const MINION_COLORS: Record<string, { body: string; emissive: string; eye: string }> = {
  imp: { body: "#ef4444", emissive: "#ff2222", eye: "#ffff00" },
  wisp: { body: "#a855f7", emissive: "#7c3aed", eye: "#e9d5ff" },
  stalker: { body: "#1e1e1e", emissive: "#ff0044", eye: "#ff0000" },
  golem: { body: "#78716c", emissive: "#f97316", eye: "#fbbf24" },
};

function MinionMesh({
  state,
  visualType,
  gridWidth,
  gridHeight,
}: {
  state: MinionState;
  visualType: string;
  gridWidth: number;
  gridHeight: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const colors = MINION_COLORS[visualType] ?? MINION_COLORS.imp;
  const isStunned = state.stunnedUntil > Date.now();

  useFrame((clock) => {
    if (!groupRef.current) return;
    const target = toWorld(state.position, gridWidth, gridHeight);
    groupRef.current.position.x = THREE.MathUtils.lerp(groupRef.current.position.x, target.x, 0.15);
    groupRef.current.position.z = THREE.MathUtils.lerp(groupRef.current.position.z, target.z, 0.15);

    const t = clock.clock.elapsedTime;
    // Bobbing
    const bobHeight = visualType === "wisp" ? 0.5 + Math.sin(t * 3) * 0.12 : 0.35;
    groupRef.current.position.y = bobHeight;

    // Stunned wobble
    if (isStunned) {
      groupRef.current.rotation.z = Math.sin(t * 15) * 0.3;
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, 0.1);
    }
  });

  if (state.defeated) return null;

  if (visualType === "wisp") {
    return (
      <group ref={groupRef}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 12, 12]} />
          <meshStandardMaterial
            color={isStunned ? "#8888ff" : colors.body}
            emissive={isStunned ? "#4444ff" : colors.emissive}
            emissiveIntensity={isStunned ? 0.5 : 2}
            transparent
            opacity={isStunned ? 0.4 : 0.75}
            toneMapped={false}
          />
        </mesh>
        {/* Eye */}
        <mesh position={[0, 0.04, 0.14]}>
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color={colors.eye}
            emissive={colors.eye}
            emissiveIntensity={isStunned ? 0.3 : 2}
            toneMapped={false}
          />
        </mesh>
        <Sparkles count={4} size={1} scale={0.4} speed={isStunned ? 0.1 : 0.8} color={isStunned ? "#8888ff" : colors.emissive} />
        <pointLight color={isStunned ? "#4444ff" : colors.emissive} intensity={isStunned ? 0.3 : 1} distance={2} decay={2} />
      </group>
    );
  }

  if (visualType === "stalker") {
    return (
      <group ref={groupRef}>
        {/* Tall dark body */}
        <mesh castShadow>
          <capsuleGeometry args={[0.12, 0.35, 6, 12]} />
          <meshStandardMaterial
            color={isStunned ? "#666688" : colors.body}
            emissive={isStunned ? "#333366" : colors.emissive}
            emissiveIntensity={isStunned ? 0.3 : 1.5}
            toneMapped={false}
          />
        </mesh>
        {/* Glowing eyes */}
        <mesh position={[-0.05, 0.1, 0.1]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color={colors.eye}
            emissive={colors.eye}
            emissiveIntensity={isStunned ? 0.5 : 3}
            toneMapped={false}
          />
        </mesh>
        <mesh position={[0.05, 0.1, 0.1]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color={colors.eye}
            emissive={colors.eye}
            emissiveIntensity={isStunned ? 0.5 : 3}
            toneMapped={false}
          />
        </mesh>
        {/* Chase indicator when chasing */}
        {state.isChasing && !isStunned && (
          <pointLight color="#ff0000" intensity={2} distance={3} decay={2} />
        )}
      </group>
    );
  }

  // Default: imp / golem
  return (
    <group ref={groupRef}>
      {/* Cone body */}
      <mesh castShadow>
        <coneGeometry args={[0.18, 0.4, 10]} />
        <meshStandardMaterial
          color={isStunned ? "#8888aa" : colors.body}
          emissive={isStunned ? "#444466" : colors.emissive}
          emissiveIntensity={isStunned ? 0.3 : 1.5}
          toneMapped={false}
        />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.05, 0.02, 0.13]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial
          color={colors.eye}
          emissive={colors.eye}
          emissiveIntensity={isStunned ? 0.3 : 2}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0.05, 0.02, 0.13]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial
          color={colors.eye}
          emissive={colors.eye}
          emissiveIntensity={isStunned ? 0.3 : 2}
          toneMapped={false}
        />
      </mesh>
      <pointLight color={isStunned ? "#444466" : colors.emissive} intensity={isStunned ? 0.2 : 0.8} distance={2} decay={2} />
    </group>
  );
}

/* ── Main World3D ── */

export function World3D({
  area,
  areaWorld,
  playerPosition,
  resolvedObstacleNodes,
  collectedPetals,
  obstaclesCleared,
  onMove,
  playerHealth,
  isDashing,
  lastMoveDirection,
  minionStates,
  now,
}: World3DProps) {
  const theme = AREA_THEMES[area.id] ?? AREA_THEMES["flower-forest"];
  const wallSet = new Set(areaWorld.walls.map(pointKey));
  const petalMap = new Map<string, PowerId>();
  const obstacleMap = new Map<string, string>();

  for (const power of area.petals) {
    const node = areaWorld.petalNodes[power];
    if (node) {
      petalMap.set(pointKey(node), power);
    }
  }

  for (const obstacle of area.obstacles) {
    const node = resolvedObstacleNodes[obstacle.id] ?? areaWorld.obstacleNodes[obstacle.id];
    if (node) {
      obstacleMap.set(pointKey(node), obstacle.id);
    }
  }

  const tileMeshes = [];

  for (let y = 0; y < areaWorld.height; y += 1) {
    for (let x = 0; x < areaWorld.width; x += 1) {
      const key = `${x},${y}`;
      const world = toWorld({ x, y }, areaWorld.width, areaWorld.height);
      const isWall = wallSet.has(key);
      const obstacleId = obstacleMap.get(key);
      const obstacle = area.obstacles.find((entry) => entry.id === obstacleId);
      const isObstacleActive = Boolean(obstacle && !obstaclesCleared.has(obstacle.id));
      const petalId = petalMap.get(key);
      const hasPetal = Boolean(petalId && !collectedPetals.has(petalId));
      const isExit = areaWorld.exit?.x === x && areaWorld.exit?.y === y;
      const isBack = areaWorld.backEntry?.x === x && areaWorld.backEntry?.y === y;
      const isGoal = areaWorld.goal?.x === x && areaWorld.goal?.y === y;

      const tileColor = isGoal
        ? "#7c3aed"
        : isExit
          ? "#0ea5e9"
          : isBack
            ? "#06b6d4"
            : isWall
              ? theme.wallColor
              : theme.tileColor;

      tileMeshes.push(
        <group key={key} position={[world.x, 0, world.z]}>
          {/* Base tile */}
          <mesh receiveShadow>
            <boxGeometry args={[0.95, isWall ? 0.4 : 0.08, 0.95]} />
            <meshStandardMaterial color={tileColor} roughness={isWall ? 0.5 : 0.7} />
          </mesh>

          {/* Wall decorations */}
          {isWall && (
            <WallDecoration
              type={theme.wallDecor}
              position={[world.x, 0.2, world.z]}
            />
          )}

          {/* Petal pickup */}
          {hasPetal && (
            <Float speed={1.8} rotationIntensity={0.7} floatIntensity={0.7}>
              <mesh position={[0, 0.45, 0]} castShadow>
                <octahedronGeometry args={[0.18, 0]} />
                <meshStandardMaterial
                  color="#ffd700"
                  emissive="#ffd700"
                  emissiveIntensity={2.5}
                  toneMapped={false}
                />
              </mesh>
              <Sparkles count={4} size={1} scale={0.4} speed={0.6} color="#ffd700" position={[0, 0.45, 0]} />
            </Float>
          )}

          {/* Obstacle / minion */}
          {isObstacleActive && (
            <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.3}>
              <group position={[0, 0.38, 0]}>
                {/* Minion body */}
                <mesh castShadow>
                  <coneGeometry args={[0.22, 0.5, 12]} />
                  <meshStandardMaterial
                    color="#ef4444"
                    emissive="#ff0000"
                    emissiveIntensity={1.5}
                    toneMapped={false}
                  />
                </mesh>
                {/* Minion eyes */}
                <mesh position={[-0.06, 0.05, 0.16]}>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <meshStandardMaterial
                    color="#ffff00"
                    emissive="#ffff00"
                    emissiveIntensity={2}
                    toneMapped={false}
                  />
                </mesh>
                <mesh position={[0.06, 0.05, 0.16]}>
                  <sphereGeometry args={[0.04, 8, 8]} />
                  <meshStandardMaterial
                    color="#ffff00"
                    emissive="#ffff00"
                    emissiveIntensity={2}
                    toneMapped={false}
                  />
                </mesh>
                {/* Danger glow */}
                <pointLight color="#ff3333" intensity={0.8} distance={2} decay={2} />
              </group>
            </Float>
          )}

          {/* Portal rings for exits/entries/goals */}
          {isExit && (
            <PortalRing position={[0, 0.35, 0]} color="#0ea5e9" />
          )}
          {isBack && (
            <PortalRing position={[0, 0.35, 0]} color="#06b6d4" />
          )}
          {isGoal && (
            <PortalRing position={[0, 0.35, 0]} color="#d946ef" />
          )}
        </group>,
      );
    }
  }

  const playerTarget = toWorld(playerPosition, areaWorld.width, areaWorld.height);

  return (
    <div className="h-full w-full">
      <Canvas camera={{ position: [4, 6, 5], fov: 52 }} shadows>
        <color attach="background" args={[theme.bg]} />
        <fog attach="fog" args={[theme.fogColor, theme.fogNear, theme.fogFar]} />
        <ambientLight intensity={theme.ambientIntensity} color={theme.ambientColor} />
        <directionalLight
          position={[5, 10, 4]}
          intensity={theme.sunIntensity}
          color={theme.sunColor}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Stars radius={18} depth={22} count={2000} factor={3} saturation={0.4} fade speed={0.5} />
        <Sparkles count={theme.sparkleCount} size={3.5} scale={[11, 4, 11]} speed={0.3} color={theme.sparkleColor} />

        {/* Area-specific ambient particles */}
        <AreaParticles areaId={area.id} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]} receiveShadow>
          <planeGeometry args={[areaWorld.width + 3, areaWorld.height + 3]} />
          <meshStandardMaterial color={theme.groundColor} roughness={0.9} />
        </mesh>

        {tileMeshes}

        {/* Hazard tiles */}
        {areaWorld.hazards.map((h, i) => (
          <HazardMesh
            key={`hazard-${i}`}
            hazard={h}
            gridWidth={areaWorld.width}
            gridHeight={areaWorld.height}
            now={now}
          />
        ))}

        <FairyOrb target={playerTarget} lastMoveDirection={lastMoveDirection} />

        {/* Minions */}
        {minionStates.map((ms) => {
          const def = getMinionsForArea(area.id).find((d) => d.id === ms.id);
          if (!def) return null;
          return (
            <MinionMesh
              key={ms.id}
              state={ms}
              visualType={def.visualType}
              gridWidth={areaWorld.width}
              gridHeight={areaWorld.height}
            />
          );
        })}

        <FollowCamera
          target={playerTarget}
          playerHealth={playerHealth}
          isDashing={isDashing}
        />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.5}
            luminanceSmoothing={0.4}
            intensity={1.0}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
