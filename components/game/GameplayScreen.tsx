"use client";

import { PowerPanel } from "@/components/game/PowerPanel";
import { World3D } from "@/components/game/World3D";
import { AREAS } from "@/lib/game-data";
import { WORLD_MAP } from "@/lib/world-map";
import { Direction, Fairy, GameEvent, MinionState, Point, PowerId, PowerState } from "@/types/game";

interface GameplayScreenProps {
  selectedFairy: Fairy;
  areaIndex: number;
  playerPosition: Point;
  resolvedObstacleNodes: Record<string, Point | null>;
  collectedPetals: Set<PowerId>;
  powers: Record<PowerId, PowerState>;
  activePower: PowerId | null;
  obstaclesCleared: Set<string>;
  now: number;
  playerHealth: number;
  maxHealth: number;
  dashSecondsLeft: number;
  lastMoveDirection: Direction;
  statusMessage: string;
  onActivatePower: (powerId: PowerId) => void;
  onStartRecharge: (powerId: PowerId) => void;
  onMove: (direction: Direction) => void;
  onDash: () => void;
  onRestart: () => void;
  gameEvents: GameEvent[];
  damageFlash: boolean;
  minionStates: MinionState[];
}

function HeartBar({ health, maxHealth }: { health: number; maxHealth: number }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: maxHealth }).map((_, i) => (
        <span
          key={i}
          className={`text-2xl transition-transform duration-200 ${
            i < health ? "drop-shadow-[0_0_6px_rgba(255,45,100,0.7)]" : "opacity-30 grayscale"
          } ${i === health ? "animate-shake" : ""}`}
        >
          {i < health ? "\u2764\uFE0F" : "\u{1F5A4}"}
        </span>
      ))}
    </div>
  );
}

function PetalCounter({ collected }: { collected: Set<PowerId> }) {
  const petals: { id: PowerId; color: string; label: string }[] = [
    { id: "ice", color: "#00d4ff", label: "Ice" },
    { id: "fire", color: "#ff6b35", label: "Fire" },
    { id: "water", color: "#4d7cff", label: "Water" },
    { id: "animalTalk", color: "#39ff14", label: "Animal" },
  ];

  return (
    <div className="flex gap-2">
      {petals.map((p) => (
        <div
          key={p.id}
          className="flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300"
          style={{
            borderColor: collected.has(p.id) ? p.color : "rgba(255,255,255,0.15)",
            background: collected.has(p.id) ? `${p.color}30` : "rgba(0,0,0,0.3)",
            boxShadow: collected.has(p.id) ? `0 0 10px ${p.color}50` : "none",
          }}
          title={p.label}
        >
          {collected.has(p.id) && (
            <div
              className="h-3 w-3 rounded-full animate-pulse-glow"
              style={{ background: p.color }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function StatusToast({ message }: { message: string }) {
  return (
    <div
      key={message}
      className="glass-panel animate-toast px-4 py-2 text-sm font-semibold text-white/90"
      style={{ maxWidth: "400px" }}
    >
      {message}
    </div>
  );
}

function FloatingEvents({ events }: { events: GameEvent[] }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      {events.map((event, index) => (
        <div
          key={event.id}
          className="absolute animate-float-up text-center font-black"
          style={{
            color: event.color,
            fontSize: event.type === "damage" ? "2.5rem" : "1.25rem",
            textShadow: `0 0 10px ${event.color}, 0 0 20px ${event.color}50`,
            bottom: `${55 + index * 8}%`,
            animationDelay: `${index * 50}ms`,
          }}
        >
          {event.text}
        </div>
      ))}
    </div>
  );
}

function DamageFlash({ active }: { active: boolean }) {
  if (!active) return null;
  return (
    <div
      className="pointer-events-none absolute inset-0 z-30 animate-damage-flash"
      style={{
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(255,0,0,0.35) 100%)",
      }}
    />
  );
}

export function GameplayScreen({
  selectedFairy,
  areaIndex,
  playerPosition,
  resolvedObstacleNodes,
  collectedPetals,
  powers,
  activePower,
  obstaclesCleared,
  now,
  playerHealth,
  maxHealth,
  dashSecondsLeft,
  lastMoveDirection,
  statusMessage,
  onActivatePower,
  onStartRecharge,
  onMove,
  onDash,
  onRestart,
  gameEvents,
  damageFlash,
  minionStates,
}: GameplayScreenProps) {
  const currentArea = AREAS[areaIndex];

  return (
    <div className="relative h-dvh w-full">
      {/* 3D Canvas — fills entire viewport */}
      <div className="absolute inset-0">
        <World3D
          area={currentArea}
          areaWorld={WORLD_MAP[currentArea.id]}
          playerPosition={playerPosition}
          resolvedObstacleNodes={resolvedObstacleNodes}
          obstaclesCleared={obstaclesCleared}
          collectedPetals={collectedPetals}
          onMove={onMove}
          playerHealth={playerHealth}
          isDashing={dashSecondsLeft > 0}
          lastMoveDirection={lastMoveDirection}
          minionStates={minionStates}
        />
      </div>

      {/* Damage flash overlay */}
      <DamageFlash active={damageFlash} />

      {/* Floating event text */}
      <FloatingEvents events={gameEvents} />

      {/* ── HUD Overlay ── */}

      {/* Top-left: Hearts + Fairy badge */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-3">
        <div className="glass-panel flex items-center gap-3 px-3 py-2">
          <HeartBar health={playerHealth} maxHealth={maxHealth} />
          <div className="h-6 w-px bg-white/20" />
          <div>
            <p className="text-xs font-bold text-white/60">{selectedFairy.title}</p>
            <p className="text-sm font-black text-white">{selectedFairy.name}</p>
          </div>
        </div>
      </div>

      {/* Top-right: Petal counter */}
      <div className="absolute top-4 right-4 z-10">
        <div className="glass-panel px-3 py-2">
          <p className="mb-1 text-center text-[10px] font-bold uppercase tracking-widest text-white/50">Petals</p>
          <PetalCounter collected={collectedPetals} />
        </div>
      </div>

      {/* Top-center: Area name */}
      <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
        <div className="glass-panel px-5 py-2 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">{currentArea.subtitle}</p>
          <h2 className="text-lg font-black text-white">{currentArea.name}</h2>
        </div>
      </div>

      {/* Bottom-center: Power bar */}
      <div className="absolute bottom-4 left-1/2 z-10 -translate-x-1/2">
        <PowerPanel
          collectedPetals={collectedPetals}
          powers={powers}
          now={now}
          activePower={activePower}
          onActivate={onActivatePower}
          onStartRecharge={onStartRecharge}
        />
      </div>

      {/* Bottom-right: Dash button */}
      <div className="absolute bottom-4 right-4 z-10">
        <button
          type="button"
          onClick={onDash}
          disabled={dashSecondsLeft > 0}
          className="relative flex h-16 w-16 items-center justify-center rounded-full border-2 font-black text-white transition-all duration-200 enabled:hover:scale-110 enabled:active:scale-95 disabled:opacity-40"
          style={{
            borderColor: dashSecondsLeft > 0 ? "rgba(255,255,255,0.15)" : "var(--neon-blue)",
            background: dashSecondsLeft > 0 ? "rgba(0,0,0,0.4)" : "rgba(0,212,255,0.2)",
            boxShadow: dashSecondsLeft > 0 ? "none" : "0 0 20px rgba(0,212,255,0.3)",
          }}
        >
          {dashSecondsLeft > 0 ? (
            <span className="text-lg">{dashSecondsLeft}</span>
          ) : (
            <span className="text-xs">DASH</span>
          )}
          {/* Cooldown ring */}
          {dashSecondsLeft > 0 && (
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="29"
                fill="none"
                stroke="rgba(0,212,255,0.3)"
                strokeWidth="3"
                strokeDasharray={`${(1 - dashSecondsLeft / 5) * 182} 182`}
              />
            </svg>
          )}
        </button>
      </div>

      {/* Bottom-left: D-pad for mobile */}
      <div className="absolute bottom-4 left-4 z-10 sm:hidden">
        <div className="grid grid-cols-3 gap-1">
          <div />
          <button type="button" onClick={() => onMove("up")} className="glass-panel flex h-11 w-11 items-center justify-center text-lg text-white/80 active:scale-90">
            &#9650;
          </button>
          <div />
          <button type="button" onClick={() => onMove("left")} className="glass-panel flex h-11 w-11 items-center justify-center text-lg text-white/80 active:scale-90">
            &#9664;
          </button>
          <div />
          <button type="button" onClick={() => onMove("right")} className="glass-panel flex h-11 w-11 items-center justify-center text-lg text-white/80 active:scale-90">
            &#9654;
          </button>
          <div />
          <button type="button" onClick={() => onMove("down")} className="glass-panel flex h-11 w-11 items-center justify-center text-lg text-white/80 active:scale-90">
            &#9660;
          </button>
          <div />
        </div>
      </div>

      {/* Bottom status toast */}
      <div className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2">
        <StatusToast message={statusMessage} />
      </div>

      {/* Top-right corner: Restart */}
      <div className="absolute top-16 right-4 z-10">
        <button
          type="button"
          onClick={onRestart}
          className="glass-panel px-3 py-1.5 text-xs font-bold text-white/60 transition hover:text-white"
        >
          Restart
        </button>
      </div>
    </div>
  );
}
