import { PowerPanel } from "@/components/game/PowerPanel";
import { World3D } from "@/components/game/World3D";
import { AREAS } from "@/lib/game-data";
import { WORLD_MAP } from "@/lib/world-map";
import { Direction, Fairy, Point, PowerId, PowerState } from "@/types/game";

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
}: GameplayScreenProps) {
  const currentArea = AREAS[areaIndex];

  return (
    <section className="w-full space-y-4 rounded-3xl border border-rose-100/80 bg-white/70 p-4 shadow-xl shadow-rose-100/40 backdrop-blur sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-rose-50/90 p-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-rose-500">Current Fairy</p>
          <h2 className="text-2xl font-black text-rose-800">{selectedFairy.name}</h2>
          <p className="text-xs font-semibold text-rose-600">{selectedFairy.title}</p>
        </div>
        <p className="max-w-xs text-right text-xs text-rose-900/70">
          Explore the 3D world, collect petals, activate powers, and reach Pixie Land.
        </p>
      </header>

      <div className="flex items-center justify-between rounded-2xl border border-rose-100 bg-white/80 px-3 py-2">
        <p className="text-xs font-semibold text-rose-700">Dash direction: {lastMoveDirection.toUpperCase()}</p>
        <p className="text-xs font-bold text-rose-700">
          Hearts: {playerHealth}/{maxHealth}
        </p>
        <button
          type="button"
          onClick={onDash}
          disabled={dashSecondsLeft > 0}
          className="rounded-full bg-rose-500 px-4 py-1.5 text-xs font-bold text-white transition enabled:hover:bg-rose-600 disabled:cursor-not-allowed disabled:bg-rose-200"
        >
          {dashSecondsLeft > 0 ? `Dash ${dashSecondsLeft}s` : "Dash"}
        </button>
      </div>

      <PowerPanel
        collectedPetals={collectedPetals}
        powers={powers}
        now={now}
        activePower={activePower}
        onActivate={onActivatePower}
        onStartRecharge={onStartRecharge}
      />

      <World3D
        area={currentArea}
        areaWorld={WORLD_MAP[currentArea.id]}
        playerPosition={playerPosition}
        resolvedObstacleNodes={resolvedObstacleNodes}
        obstaclesCleared={obstaclesCleared}
        collectedPetals={collectedPetals}
        onMove={onMove}
      />

      <p className="rounded-2xl border border-rose-100 bg-rose-50/80 p-3 text-sm font-medium text-rose-800">
        {statusMessage}
      </p>
    </section>
  );
}
