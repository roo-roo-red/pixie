import { POWERS } from "@/lib/game-data";
import { Area, AreaWorld, Direction, Point, PowerId } from "@/types/game";

interface AreaMapProps {
  area: Area;
  areaIndex: number;
  areaWorld: AreaWorld;
  playerPosition: Point;
  obstaclesCleared: Set<string>;
  collectedPetals: Set<PowerId>;
  onMove: (direction: Direction) => void;
}

function pointKey(point: Point) {
  return `${point.x},${point.y}`;
}

export function AreaMap({
  area,
  areaIndex,
  areaWorld,
  playerPosition,
  obstaclesCleared,
  collectedPetals,
  onMove,
}: AreaMapProps) {
  const wallSet = new Set(areaWorld.walls.map(pointKey));
  const petalsByPoint = new Map<string, PowerId>();
  const obstaclesByPoint = new Map<string, string>();

  for (const power of area.petals) {
    const node = areaWorld.petalNodes[power];
    if (node) {
      petalsByPoint.set(pointKey(node), power);
    }
  }

  for (const obstacle of area.obstacles) {
    const node = areaWorld.obstacleNodes[obstacle.id];
    if (node) {
      obstaclesByPoint.set(pointKey(node), obstacle.id);
    }
  }

  const tiles = [];

  for (let y = 0; y < areaWorld.height; y += 1) {
    for (let x = 0; x < areaWorld.width; x += 1) {
      const key = `${x},${y}`;
      const isPlayer = playerPosition.x === x && playerPosition.y === y;
      const isWall = wallSet.has(key);
      const petalAtTile = petalsByPoint.get(key);
      const obstacleId = obstaclesByPoint.get(key);
      const obstacle = area.obstacles.find((entry) => entry.id === obstacleId);
      const isObstacleActive = Boolean(obstacle && !obstaclesCleared.has(obstacle.id));
      const isExit = areaWorld.exit?.x === x && areaWorld.exit?.y === y;
      const isBack = areaWorld.backEntry?.x === x && areaWorld.backEntry?.y === y;
      const isGoal = areaWorld.goal?.x === x && areaWorld.goal?.y === y;

      let baseClass = "bg-emerald-100 border-emerald-200";
      let icon = "";
      let label = "Path";

      if (isWall) {
        baseClass = "bg-emerald-200 border-emerald-300";
        icon = "F";
        label = "Flowers";
      } else if (isObstacleActive) {
        baseClass = "bg-rose-200 border-rose-300";
        icon = "M";
        label = obstacle?.name ?? "Obstacle";
      } else if (petalAtTile && !collectedPetals.has(petalAtTile)) {
        baseClass = "bg-amber-100 border-amber-300";
        icon = "P";
        label = `${POWERS.find((p) => p.id === petalAtTile)?.label} Petal`;
      } else if (isGoal) {
        baseClass = "bg-fuchsia-200 border-fuchsia-300";
        icon = "G";
        label = "Pixie Castle";
      } else if (isExit) {
        baseClass = "bg-sky-100 border-sky-300";
        icon = "E";
        label = "Next Area";
      } else if (isBack) {
        baseClass = "bg-cyan-100 border-cyan-300";
        icon = "B";
        label = "Previous Area";
      }

      if (isPlayer) {
        baseClass = "bg-violet-200 border-violet-400";
        icon = "@";
        label = "Your Fairy";
      }

      tiles.push(
        <div
          key={key}
          className={`flex aspect-square items-center justify-center rounded-md border text-xs ${baseClass}`}
          title={label}
          aria-label={label}
        >
          <span>{icon}</span>
        </div>,
      );
    }
  }

  return (
    <section className="rounded-3xl border border-pink-100 bg-white/85 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-rose-500">{area.subtitle}</p>
          <h3 className="text-2xl font-black text-rose-800">{area.name}</h3>
        </div>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">Zone {areaIndex + 1}</span>
      </div>

      <p className="mt-2 text-sm text-rose-900/80">{area.description}</p>

      <div className="mt-4 grid grid-cols-8 gap-1 rounded-2xl border border-rose-100 bg-white p-2">{tiles}</div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-semibold text-rose-700">
        <button type="button" onClick={() => onMove("up")} className="col-start-2 rounded-xl border border-rose-300 bg-rose-50 py-2">
          ↑ Up
        </button>
        <button type="button" onClick={() => onMove("left")} className="rounded-xl border border-rose-300 bg-rose-50 py-2">
          ← Left
        </button>
        <button type="button" onClick={() => onMove("right")} className="rounded-xl border border-rose-300 bg-rose-50 py-2">
          Right →
        </button>
        <button type="button" onClick={() => onMove("down")} className="col-start-2 rounded-xl border border-rose-300 bg-rose-50 py-2">
          ↓ Down
        </button>
      </div>

      <p className="mt-3 text-xs text-rose-700">Use arrow keys or these buttons to move through the world.</p>
    </section>
  );
}
