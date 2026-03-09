"use client";

import { useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Float, Sparkles, Stars } from "@react-three/drei";
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

  useFrame((state) => {
    if (!ref.current) {
      return;
    }

    ref.current.position.x = THREE.MathUtils.lerp(ref.current.position.x, target.x, 0.2);
    ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, target.z, 0.2);
    ref.current.position.y = 0.36 + Math.sin(state.clock.elapsedTime * 4) * 0.04;
  });

  return (
    <mesh ref={ref} castShadow>
      <sphereGeometry args={[0.24, 24, 24]} />
      <meshStandardMaterial color="#a78bfa" emissive="#ddd6fe" emissiveIntensity={0.32} />
    </mesh>
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
        ? "#f5d0fe"
        : isExit
          ? "#bae6fd"
          : isBack
            ? "#cffafe"
            : isWall
              ? "#86efac"
              : "#bbf7d0";

      tileMeshes.push(
        <group key={key} position={[world.x, 0, world.z]}>
          <mesh receiveShadow>
            <boxGeometry args={[0.95, 0.08 + (isWall ? 0.2 : 0), 0.95]} />
            <meshStandardMaterial color={tileColor} roughness={0.7} />
          </mesh>

          {hasPetal && (
            <Float speed={1.8} rotationIntensity={0.7} floatIntensity={0.7}>
              <mesh position={[0, 0.38, 0]} castShadow>
                <octahedronGeometry args={[0.18, 0]} />
                <meshStandardMaterial color="#f59e0b" emissive="#fcd34d" emissiveIntensity={0.5} />
              </mesh>
            </Float>
          )}

          {isObstacleActive && (
            <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.2}>
              <mesh position={[0, 0.38, 0]} castShadow>
                <coneGeometry args={[0.25, 0.58, 12]} />
                <meshStandardMaterial color="#ef4444" emissive="#f87171" emissiveIntensity={0.2} />
              </mesh>
            </Float>
          )}

          {(isExit || isBack || isGoal) && (
            <mesh position={[0, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.24, 0.05, 12, 24]} />
              <meshStandardMaterial
                color={isGoal ? "#d946ef" : isBack ? "#0891b2" : "#0ea5e9"}
                emissive={isGoal ? "#f0abfc" : isBack ? "#67e8f9" : "#7dd3fc"}
                emissiveIntensity={0.25}
              />
            </mesh>
          )}
        </group>,
      );
    }
  }

  const playerTarget = toWorld(playerPosition, areaWorld.width, areaWorld.height);

  return (
    <section className="rounded-3xl border border-pink-100 bg-white/85 p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-2xl font-black text-rose-800">3D World: {area.name}</h3>
        <p className="text-xs font-semibold text-rose-600">WASD / Arrows + touch controls</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-rose-100 bg-sky-50">
        <div className="h-[340px] w-full sm:h-[430px]">
          <Canvas camera={{ position: [4, 6, 5], fov: 52 }} shadows>
            <color attach="background" args={["#bfdbfe"]} />
            <fog attach="fog" args={["#dbeafe", 6, 16]} />
            <ambientLight intensity={0.65} />
            <directionalLight position={[5, 10, 4]} intensity={1.2} castShadow shadow-mapSize-width={1024} shadow-mapSize-height={1024} />

            <Stars radius={18} depth={22} count={1300} factor={2} saturation={0.2} fade speed={0.5} />
            <Sparkles count={24} size={2.8} scale={[11, 4, 11]} speed={0.2} color="#f9a8d4" />

            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.09, 0]} receiveShadow>
              <planeGeometry args={[areaWorld.width + 3, areaWorld.height + 3]} />
              <meshStandardMaterial color="#a7f3d0" roughness={0.9} />
            </mesh>

            {tileMeshes}
            <FairyOrb target={playerTarget} />
            <FollowCamera target={playerTarget} />
          </Canvas>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold text-rose-700">
        <button type="button" onClick={() => onMove("up")} className="col-start-2 rounded-xl border border-rose-300 bg-rose-50 py-2">
          Up
        </button>
        <button type="button" onClick={() => onMove("left")} className="rounded-xl border border-rose-300 bg-rose-50 py-2">
          Left
        </button>
        <button type="button" onClick={() => onMove("right")} className="rounded-xl border border-rose-300 bg-rose-50 py-2">
          Right
        </button>
        <button type="button" onClick={() => onMove("down")} className="col-start-2 rounded-xl border border-rose-300 bg-rose-50 py-2">
          Down
        </button>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-rose-700 sm:grid-cols-3">
        <p className="rounded-lg border border-rose-100 bg-white px-2 py-1">Amber crystal: petal</p>
        <p className="rounded-lg border border-rose-100 bg-white px-2 py-1">Red cone: minion</p>
        <p className="rounded-lg border border-rose-100 bg-white px-2 py-1">Blue ring: area gate</p>
      </div>
    </section>
  );
}
