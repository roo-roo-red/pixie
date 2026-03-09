"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import * as THREE from "three";
import { Area, AreaWorld, Direction, Point, PowerId } from "@/types/game";

interface World3DProps {
  area: Area;
  areaWorld: AreaWorld;
  playerPosition: Point;
  resolvedObstacleNodes: Record<string, Point | null>;
  collectedPetals: Set<PowerId>;
  obstaclesCleared: Set<string>;
  onMove: (direction: Direction) => void;
}

const AREA_THEMES: Record<string, {
  bg: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientIntensity: number;
  groundColor: string;
  tileColor: string;
  wallColor: string;
  sparkleColor: string;
}> = {
  "flower-forest": {
    bg: "#1a0a2e",
    fogColor: "#1a0a2e",
    fogNear: 8,
    fogFar: 20,
    ambientIntensity: 0.5,
    groundColor: "#1a3a2a",
    tileColor: "#2a5a3a",
    wallColor: "#3a7a4a",
    sparkleColor: "#ff69b4",
  },
  "crystal-river": {
    bg: "#0a1a3e",
    fogColor: "#0a1a3e",
    fogNear: 7,
    fogFar: 18,
    ambientIntensity: 0.45,
    groundColor: "#0a2a3a",
    tileColor: "#1a3a5a",
    wallColor: "#2a5a7a",
    sparkleColor: "#00d4ff",
  },
  "shadow-path": {
    bg: "#12061e",
    fogColor: "#12061e",
    fogNear: 5,
    fogFar: 15,
    ambientIntensity: 0.3,
    groundColor: "#1a0a2a",
    tileColor: "#2a1a3a",
    wallColor: "#3a1a4a",
    sparkleColor: "#b845ff",
  },
  "pixie-land": {
    bg: "#1a0a3e",
    fogColor: "#1a0a3e",
    fogNear: 10,
    fogFar: 25,
    ambientIntensity: 0.7,
    groundColor: "#2a1a4a",
    tileColor: "#3a2a5a",
    wallColor: "#5a3a7a",
    sparkleColor: "#ffd700",
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

function FollowCamera({ target }: { target: { x: number; z: number } }) {
  const { camera } = useThree();

  useFrame(() => {
    const desired = new THREE.Vector3(target.x + 3.8, 6.2, target.z + 4.6);
    camera.position.lerp(desired, 0.08);
    camera.lookAt(target.x, 0.1, target.z);
  });

  return null;
}

function FairyOrb({ target }: { target: { x: number; z: number } }) {
  const ref = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame((state) => {
    if (!ref.current) return;

    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, target.x, 0.2);
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, target.z, 0.2);
    ref.current.position.y = 0.36 + Math.sin(state.clock.elapsedTime * 4) * 0.04;

    if (lightRef.current) {
      lightRef.current.position.copy(ref.current.position);
      lightRef.current.position.y += 0.3;
    }
  });

  return (
    <>
      <mesh ref={ref} castShadow>
        <sphereGeometry args={[0.24, 24, 24]} />
        <meshStandardMaterial
          color="#c084fc"
          emissive="#a855f7"
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={lightRef} color="#c084fc" intensity={2} distance={4} decay={2} />
    </>
  );
}

export function World3D({
  area,
  areaWorld,
  playerPosition,
  resolvedObstacleNodes,
  collectedPetals,
  obstaclesCleared,
  onMove,
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
          <mesh receiveShadow>
            <boxGeometry args={[0.95, 0.08 + (isWall ? 0.3 : 0), 0.95]} />
            <meshStandardMaterial color={tileColor} roughness={0.7} />
          </mesh>

          {hasPetal && (
            <Float speed={1.8} rotationIntensity={0.7} floatIntensity={0.7}>
              <mesh position={[0, 0.38, 0]} castShadow>
                <octahedronGeometry args={[0.18, 0]} />
                <meshStandardMaterial
                  color="#ffd700"
                  emissive="#ffd700"
                  emissiveIntensity={2}
                  toneMapped={false}
                />
              </mesh>
            </Float>
          )}

          {isObstacleActive && (
            <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.2}>
              <mesh position={[0, 0.38, 0]} castShadow>
                <coneGeometry args={[0.25, 0.58, 12]} />
                <meshStandardMaterial
                  color="#ef4444"
                  emissive="#ff0000"
                  emissiveIntensity={1.2}
                  toneMapped={false}
                />
              </mesh>
            </Float>
          )}

          {(isExit || isBack || isGoal) && (
            <>
              <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.24, 0.05, 12, 24]} />
                <meshStandardMaterial
                  color={isGoal ? "#d946ef" : isBack ? "#06b6d4" : "#0ea5e9"}
                  emissive={isGoal ? "#d946ef" : isBack ? "#06b6d4" : "#0ea5e9"}
                  emissiveIntensity={2}
                  toneMapped={false}
                />
              </mesh>
              <pointLight
                position={[0, 0.5, 0]}
                color={isGoal ? "#d946ef" : isBack ? "#06b6d4" : "#0ea5e9"}
                intensity={1}
                distance={2}
                decay={2}
              />
            </>
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
        <ambientLight intensity={theme.ambientIntensity} />
        <directionalLight
          position={[5, 10, 4]}
          intensity={0.8}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
        />

        <Stars radius={18} depth={22} count={2000} factor={3} saturation={0.4} fade speed={0.5} />
        <Sparkles count={40} size={3.5} scale={[11, 4, 11]} speed={0.3} color={theme.sparkleColor} />

        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]} receiveShadow>
          <planeGeometry args={[areaWorld.width + 3, areaWorld.height + 3]} />
          <meshStandardMaterial color={theme.groundColor} roughness={0.9} />
        </mesh>

        {tileMeshes}
        <FairyOrb target={playerTarget} />
        <FollowCamera target={playerTarget} />

        <EffectComposer>
          <Bloom
            luminanceThreshold={0.6}
            luminanceSmoothing={0.4}
            intensity={0.8}
            mipmapBlur
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
