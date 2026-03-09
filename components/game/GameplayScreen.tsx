"use client";

import { PowerPanel } from "@/components/game/PowerPanel";
import { World3D } from "@/components/game/World3D";
import { AREAS } from "@/lib/game-data";
import { WORLD_MAP } from "@/lib/world-map";
import { BossState, ComboState, Direction, Fairy, GameEvent, MinionState, Point, PowerId, PowerState, Projectile } from "@/types/game";

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
  bossState: BossState | null;
  projectiles: Projectile[];
  comboState: ComboState;
}

const AREA_ACCENT: Record<string, { color: string; glow: string; gradient: string }> = {
  "flower-forest": { color: "#ff69b4", glow: "rgba(255,105,180,0.3)", gradient: "from-pink-500/20 to-fuchsia-500/20" },
  "crystal-river": { color: "#00d4ff", glow: "rgba(0,212,255,0.3)", gradient: "from-cyan-500/20 to-blue-500/20" },
  "shadow-path": { color: "#b845ff", glow: "rgba(184,69,255,0.3)", gradient: "from-purple-500/20 to-indigo-500/20" },
  "pixie-land": { color: "#ffd700", glow: "rgba(255,215,0,0.3)", gradient: "from-yellow-500/20 to-orange-500/20" },
};

function HealthBar({ health, maxHealth, accentColor }: { health: number; maxHealth: number; accentColor: string }) {
  const pct = (health / maxHealth) * 100;
  const barColor = health === 1 ? "#ff3333" : health === 2 ? "#ffaa00" : accentColor;

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-4 w-28 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${barColor}cc, ${barColor})`,
            boxShadow: `0 0 12px ${barColor}80, inset 0 1px 0 rgba(255,255,255,0.3)`,
          }}
        />
        {/* Shine effect */}
        <div className="absolute inset-0 rounded-full animate-shimmer" />
      </div>
      <span className="text-xs font-black tabular-nums" style={{ color: barColor, textShadow: `0 0 8px ${barColor}60` }}>
        {health}/{maxHealth}
      </span>
    </div>
  );
}

function PetalCounter({ collected }: { collected: Set<PowerId> }) {
  const petals: { id: PowerId; color: string; icon: string }[] = [
    { id: "ice", color: "#00d4ff", icon: "\u2744\uFE0F" },
    { id: "fire", color: "#ff6b35", icon: "\uD83D\uDD25" },
    { id: "water", color: "#4d7cff", icon: "\uD83D\uDCA7" },
    { id: "animalTalk", color: "#39ff14", icon: "\uD83D\uDC3E" },
  ];

  return (
    <div className="flex gap-1.5">
      {petals.map((p) => {
        const has = collected.has(p.id);
        return (
          <div
            key={p.id}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-300"
            style={{
              background: has ? `${p.color}20` : "rgba(0,0,0,0.4)",
              border: `2px solid ${has ? p.color : "rgba(255,255,255,0.08)"}`,
              boxShadow: has ? `0 0 12px ${p.color}40, inset 0 0 8px ${p.color}15` : "none",
            }}
          >
            <span className={`text-sm ${has ? "" : "opacity-20 grayscale"}`}>{p.icon}</span>
            {has && (
              <div
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full animate-pulse-glow"
                style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StatusToast({ message, accentColor }: { message: string; accentColor: string }) {
  if (!message) return null;
  return (
    <div
      key={message}
      className="animate-toast rounded-xl px-5 py-2.5 text-sm font-bold text-white/95"
      style={{
        background: "rgba(10, 10, 30, 0.75)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${accentColor}40`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 20px ${accentColor}15`,
        maxWidth: "420px",
      }}
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
            fontSize: event.type === "damage" ? "3rem" : "1.4rem",
            textShadow: `0 0 15px ${event.color}, 0 0 30px ${event.color}60, 0 2px 4px rgba(0,0,0,0.5)`,
            bottom: `${55 + index * 8}%`,
            animationDelay: `${index * 50}ms`,
            letterSpacing: "0.05em",
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
        background: "radial-gradient(ellipse at center, transparent 30%, rgba(255,0,0,0.4) 100%)",
      }}
    />
  );
}

function AreaBanner({ name, subtitle, accent }: { name: string; subtitle: string; accent: { color: string; glow: string } }) {
  return (
    <div
      className="rounded-xl px-6 py-2 text-center"
      style={{
        background: "rgba(10, 10, 30, 0.65)",
        backdropFilter: "blur(16px)",
        border: `1px solid ${accent.color}30`,
        boxShadow: `0 4px 20px rgba(0,0,0,0.4), 0 0 30px ${accent.glow}`,
      }}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: `${accent.color}99` }}>
        {subtitle}
      </p>
      <h2 className="text-lg font-black" style={{ color: accent.color, textShadow: `0 0 20px ${accent.glow}` }}>
        {name}
      </h2>
    </div>
  );
}

const COMBO_NAMES: Record<string, string> = {
  "steam-burst": "Steam Burst",
  "frost-shield": "Frost Shield",
  "nature-slow": "Nature's Grasp",
  "phoenix-heal": "Phoenix Song",
};

function BossHealthBar({ bossState, now }: { bossState: BossState; now: number }) {
  const pct = (bossState.health / bossState.maxHealth) * 100;
  const isVulnerable = bossState.vulnerableUntil > now;
  const phaseText =
    bossState.phase === "intro" ? "Awakening..."
    : bossState.phase === "phase1" ? "Phase I"
    : bossState.phase === "phase2" ? "Phase II"
    : bossState.phase === "phase3" ? "Phase III"
    : "Defeated";

  return (
    <div
      className="flex flex-col items-center gap-1.5 rounded-xl px-6 py-3"
      style={{
        background: "rgba(10, 10, 30, 0.75)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(184,69,255,0.3)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5), 0 0 30px rgba(184,69,255,0.15)",
        minWidth: "280px",
      }}
    >
      <div className="flex w-full items-center justify-between">
        <span
          className="text-xs font-black uppercase tracking-wider"
          style={{ color: "#b845ff", textShadow: "0 0 10px rgba(184,69,255,0.5)" }}
        >
          The Witch
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "rgba(184,69,255,0.6)" }}>
          {phaseText}
        </span>
      </div>
      <div className="relative h-4 w-full overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${pct}%`,
            background: "linear-gradient(90deg, #b845ffcc, #ff3366)",
            boxShadow: "0 0 12px rgba(184,69,255,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
          }}
        />
        <div className="absolute inset-0 rounded-full animate-shimmer" />
      </div>
      <div className="flex w-full items-center justify-between">
        <span className="text-xs font-black tabular-nums" style={{ color: "#ff3366", textShadow: "0 0 8px rgba(255,51,102,0.4)" }}>
          {bossState.health}/{bossState.maxHealth}
        </span>
        {isVulnerable && (
          <span
            className="animate-pulse text-[10px] font-black uppercase tracking-wider"
            style={{ color: "#ffd700", textShadow: "0 0 10px rgba(255,215,0,0.6)" }}
          >
            VULNERABLE
          </span>
        )}
      </div>
    </div>
  );
}

function ComboIndicator({ comboState, now }: { comboState: ComboState; now: number }) {
  if (!comboState.activeComboId || comboState.activeUntil <= now) return null;

  const comboName = COMBO_NAMES[comboState.activeComboId] ?? comboState.activeComboId;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
      <div
        className="animate-float-up text-center font-black"
        style={{
          fontSize: "2rem",
          color: "#ffd700",
          textShadow: "0 0 20px rgba(255,215,0,0.8), 0 0 40px rgba(255,215,0,0.4), 0 2px 4px rgba(0,0,0,0.5)",
          letterSpacing: "0.08em",
        }}
      >
        {comboName}
      </div>
    </div>
  );
}

function DashButton({ dashSecondsLeft, onDash }: { dashSecondsLeft: number; onDash: () => void }) {
  const ready = dashSecondsLeft <= 0;
  return (
    <button
      type="button"
      onClick={onDash}
      disabled={!ready}
      className="group relative flex h-[68px] w-[68px] items-center justify-center rounded-2xl font-black text-white transition-all duration-200 enabled:hover:scale-110 enabled:active:scale-95"
      style={{
        background: ready
          ? "linear-gradient(135deg, rgba(0,212,255,0.25), rgba(0,100,200,0.25))"
          : "rgba(0,0,0,0.4)",
        border: `2px solid ${ready ? "rgba(0,212,255,0.7)" : "rgba(255,255,255,0.1)"}`,
        boxShadow: ready
          ? "0 0 25px rgba(0,212,255,0.35), inset 0 0 15px rgba(0,212,255,0.1)"
          : "none",
      }}
    >
      {ready ? (
        <div className="flex flex-col items-center">
          <span className="text-lg leading-none" style={{ color: "#00d4ff" }}>&#9889;</span>
          <span className="text-[9px] uppercase tracking-wider" style={{ color: "#00d4ff" }}>Dash</span>
        </div>
      ) : (
        <span className="text-xl tabular-nums text-white/50">{dashSecondsLeft}</span>
      )}
      {/* Cooldown ring */}
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 68 68">
        <circle cx="34" cy="34" r="30" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2.5" />
        <circle
          cx="34"
          cy="34"
          r="30"
          fill="none"
          stroke={ready ? "rgba(0,212,255,0.6)" : "rgba(0,212,255,0.2)"}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={`${(ready ? 1 : 1 - dashSecondsLeft / 5) * 188.5} 188.5`}
          style={{ transition: "stroke-dasharray 1s linear" }}
        />
      </svg>
    </button>
  );
}

function DPad({ onMove }: { onMove: (dir: Direction) => void }) {
  const btnClass = "flex h-12 w-12 items-center justify-center rounded-xl text-lg text-white/80 active:scale-90 transition-transform";
  const btnStyle = {
    background: "rgba(10, 10, 30, 0.7)",
    backdropFilter: "blur(8px)",
    border: "1px solid rgba(255,255,255,0.12)",
  };

  return (
    <div className="grid grid-cols-3 gap-1.5">
      <div />
      <button type="button" onClick={() => onMove("up")} className={btnClass} style={btnStyle}>&#9650;</button>
      <div />
      <button type="button" onClick={() => onMove("left")} className={btnClass} style={btnStyle}>&#9664;</button>
      <div />
      <button type="button" onClick={() => onMove("right")} className={btnClass} style={btnStyle}>&#9654;</button>
      <div />
      <button type="button" onClick={() => onMove("down")} className={btnClass} style={btnStyle}>&#9660;</button>
      <div />
    </div>
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
  bossState,
  projectiles,
  comboState,
}: GameplayScreenProps) {
  const currentArea = AREAS[areaIndex];
  const accent = AREA_ACCENT[currentArea.id] ?? AREA_ACCENT["flower-forest"];

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
          now={now}
          bossState={bossState}
          projectiles={projectiles}
          comboState={comboState}
        />
      </div>

      {/* Damage flash overlay */}
      <DamageFlash active={damageFlash} />

      {/* Floating event text */}
      <FloatingEvents events={gameEvents} />

      {/* ── HUD Overlay ── */}

      {/* Top-left: Health + Fairy badge */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className="flex items-center gap-3 rounded-xl px-4 py-2.5"
          style={{
            background: "rgba(10, 10, 30, 0.65)",
            backdropFilter: "blur(16px)",
            border: `1px solid ${accent.color}25`,
            boxShadow: `0 4px 20px rgba(0,0,0,0.4)`,
          }}
        >
          <HealthBar health={playerHealth} maxHealth={maxHealth} accentColor={accent.color} />
          <div className="h-7 w-px" style={{ background: `${accent.color}30` }} />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: `${accent.color}80` }}>
              {selectedFairy.title}
            </p>
            <p className="text-sm font-black text-white">{selectedFairy.name}</p>
          </div>
        </div>
      </div>

      {/* Top-right: Petal counter */}
      <div className="absolute top-4 right-4 z-10">
        <div
          className="rounded-xl px-3 py-2.5"
          style={{
            background: "rgba(10, 10, 30, 0.65)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
          }}
        >
          <p className="mb-1.5 text-center text-[9px] font-bold uppercase tracking-[0.2em] text-white/40">Petals</p>
          <PetalCounter collected={collectedPetals} />
        </div>
      </div>

      {/* Top-center: Area name */}
      <div className="absolute top-4 left-1/2 z-10 -translate-x-1/2">
        <AreaBanner name={currentArea.name} subtitle={currentArea.subtitle} accent={accent} />
      </div>

      {/* Boss health bar — below the area banner */}
      {bossState && bossState.phase !== "defeated" && (
        <div className="absolute top-20 left-1/2 z-10 -translate-x-1/2">
          <BossHealthBar bossState={bossState} now={now} />
        </div>
      )}

      {/* Combo indicator — center screen */}
      <ComboIndicator comboState={comboState} now={now} />

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
        <DashButton dashSecondsLeft={dashSecondsLeft} onDash={onDash} />
      </div>

      {/* Bottom-left: D-pad for mobile */}
      <div className="absolute bottom-4 left-4 z-10 sm:hidden">
        <DPad onMove={onMove} />
      </div>

      {/* Bottom status toast */}
      <div className="absolute bottom-24 left-1/2 z-10 -translate-x-1/2">
        <StatusToast message={statusMessage} accentColor={accent.color} />
      </div>

      {/* Top-right corner: Restart */}
      <div className="absolute top-16 right-4 z-10">
        <button
          type="button"
          onClick={onRestart}
          className="rounded-lg px-3 py-1.5 text-xs font-bold text-white/50 transition-all hover:text-white/90"
          style={{
            background: "rgba(10, 10, 30, 0.5)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          Restart
        </button>
      </div>
    </div>
  );
}
