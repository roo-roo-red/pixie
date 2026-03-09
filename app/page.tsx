"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FairySelection } from "@/components/game/FairySelection";
import { GameplayScreen } from "@/components/game/GameplayScreen";
import { LandingScreen } from "@/components/game/LandingScreen";
import { LoseScreen } from "@/components/game/LoseScreen";
import { WinScreen } from "@/components/game/WinScreen";
import { AREAS, POWER_CONFIG, POWERS } from "@/lib/game-data";
import { WORLD_MAP } from "@/lib/world-map";
import {
  playButtonClick,
  playCollectSound,
  playDamageSound,
  playDashSound,
  playLoseSound,
  playMoveSound,
  playObstacleClearSound,
  playPowerActivateSound,
  playRechargeStartSound,
  playWinSound,
} from "@/lib/sounds";
import { AreaId, Direction, Fairy, GameEvent, Point, PowerId, PowerState, Screen } from "@/types/game";

const DASH_COOLDOWN_MS = 5000;
const MAX_HEALTH = 3;
const MINION_HIT_COOLDOWN_MS = 1500;

let eventIdCounter = 0;

function createInitialPowers(): Record<PowerId, PowerState> {
  return {
    ice: { energy: 0, maxEnergy: POWER_CONFIG.maxEnergy, activeUntil: null, rechargeUntil: null },
    fire: { energy: 0, maxEnergy: POWER_CONFIG.maxEnergy, activeUntil: null, rechargeUntil: null },
    water: { energy: 0, maxEnergy: POWER_CONFIG.maxEnergy, activeUntil: null, rechargeUntil: null },
    animalTalk: { energy: 0, maxEnergy: POWER_CONFIG.maxEnergy, activeUntil: null, rechargeUntil: null },
  };
}

function resolvePowerState(power: PowerState, now: number): PowerState {
  const rechargeFinished = power.rechargeUntil !== null && power.rechargeUntil <= now;
  const activeFinished = power.activeUntil !== null && power.activeUntil <= now;

  return {
    ...power,
    energy: rechargeFinished ? power.maxEnergy : power.energy,
    rechargeUntil: rechargeFinished ? null : power.rechargeUntil,
    activeUntil: activeFinished ? null : power.activeUntil,
  };
}

function secondsLeft(targetTime: number, now: number) {
  return Math.max(0, Math.ceil((targetTime - now) / 1000));
}

function isSamePoint(a: Point | undefined | null, b: Point) {
  return Boolean(a && a.x === b.x && a.y === b.y);
}

function getResolvedObstacleNodes(areaId: AreaId, now: number) {
  const base = { ...WORLD_MAP[areaId].obstacleNodes };

  if (areaId === "crystal-river") {
    const phase = Math.floor(now / 2000) % 2;
    base["night-lanterns"] = phase === 0 ? { x: 5, y: 4 } : { x: 5, y: 3 };
  }

  return base;
}

export default function Home() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [selectedFairy, setSelectedFairy] = useState<Fairy | null>(null);
  const [areaIndex, setAreaIndex] = useState(0);
  const [playerPosition, setPlayerPosition] = useState<Point>(WORLD_MAP["flower-forest"].start);
  const [collectedPetals, setCollectedPetals] = useState<Set<PowerId>>(new Set());
  const [obstaclesCleared, setObstaclesCleared] = useState<Set<string>>(new Set());
  const [powers, setPowers] = useState<Record<PowerId, PowerState>>(createInitialPowers);
  const [activePower, setActivePower] = useState<PowerId | null>(null);
  const [playerHealth, setPlayerHealth] = useState(MAX_HEALTH);
  const [nextDamageAt, setNextDamageAt] = useState(0);
  const [lastMoveDirection, setLastMoveDirection] = useState<Direction>("right");
  const [dashReadyAt, setDashReadyAt] = useState(0);
  const [statusMessage, setStatusMessage] = useState(
    "Welcome to Pixie. Gather petals and clear each area to get home.",
  );
  const [now, setNow] = useState(0);
  const [gameEvents, setGameEvents] = useState<GameEvent[]>([]);
  const [damageFlash, setDamageFlash] = useState(false);
  const damageFlashTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const pushEvent = useCallback((type: GameEvent["type"], text: string, color: string) => {
    const event: GameEvent = {
      id: ++eventIdCounter,
      type,
      text,
      color,
      timestamp: Date.now(),
    };
    setGameEvents((prev) => [...prev.slice(-4), event]);
  }, []);

  // Auto-clear old events
  useEffect(() => {
    if (gameEvents.length === 0) return;
    const timer = setTimeout(() => {
      setGameEvents((prev) => prev.filter((e) => Date.now() - e.timestamp < 2000));
    }, 2100);
    return () => clearTimeout(timer);
  }, [gameEvents]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const effectiveActivePower = useMemo(() => {
    if (!activePower) {
      return null;
    }

    const resolved = resolvePowerState(powers[activePower], now);
    if (!resolved.activeUntil || resolved.activeUntil <= now) {
      return null;
    }

    return activePower;
  }, [activePower, now, powers]);

  const dashSecondsLeft = useMemo(() => {
    if (dashReadyAt <= now) {
      return 0;
    }
    return secondsLeft(dashReadyAt, now);
  }, [dashReadyAt, now]);

  const triggerDamageFlash = useCallback(() => {
    setDamageFlash(true);
    if (damageFlashTimeout.current) clearTimeout(damageFlashTimeout.current);
    damageFlashTimeout.current = setTimeout(() => setDamageFlash(false), 400);
  }, []);

  const resetGame = () => {
    playButtonClick();
    setScreen("landing");
    setSelectedFairy(null);
    setAreaIndex(0);
    setPlayerPosition(WORLD_MAP["flower-forest"].start);
    setCollectedPetals(new Set());
    setObstaclesCleared(new Set());
    setPowers(createInitialPowers());
    setActivePower(null);
    setPlayerHealth(MAX_HEALTH);
    setNextDamageAt(0);
    setLastMoveDirection("right");
    setDashReadyAt(0);
    setDamageFlash(false);
    setGameEvents([]);
    setStatusMessage("Welcome to Pixie. Gather petals and clear each area to get home.");
  };

  const handleFairySelect = (fairy: Fairy) => {
    playButtonClick();
    setSelectedFairy(fairy);
    setScreen("playing");
    setAreaIndex(0);
    setPlayerPosition(WORLD_MAP["flower-forest"].start);
    setPlayerHealth(MAX_HEALTH);
    setNextDamageAt(0);
    setGameEvents([]);
    setStatusMessage(`${fairy.name} is ready. Move with arrows/WASD and press Space to dash.`);
  };

  const handleActivatePower = (powerId: PowerId) => {
    if (!collectedPetals.has(powerId)) {
      setStatusMessage("Collect this petal first before activating its magic.");
      return;
    }

    const resolved = resolvePowerState(powers[powerId], now);
    const powerName = POWERS.find((entry) => entry.id === powerId)?.label ?? "Power";

    if (resolved.rechargeUntil && resolved.rechargeUntil > now) {
      setStatusMessage(`${powerName} is recharging (${secondsLeft(resolved.rechargeUntil, now)}s left).`);
      return;
    }

    if (resolved.activeUntil && resolved.activeUntil > now) {
      setStatusMessage(`${powerName} is already active.`);
      return;
    }

    if (resolved.energy <= 0) {
      setStatusMessage(`${powerName} is empty. Start recharge to restore it.`);
      return;
    }

    playPowerActivateSound();
    pushEvent("power", `${powerName} Active`, "#b845ff");

    setPowers((previous) => {
      const current = resolvePowerState(previous[powerId], now);
      return {
        ...previous,
        [powerId]: {
          ...current,
          energy: Math.max(0, current.energy - 1),
          activeUntil: Date.now() + POWER_CONFIG.activeMs,
        },
      };
    });

    setActivePower(powerId);
    setStatusMessage(`${powerName} activated. Run through matching minions while it is active.`);
  };

  const handleStartRecharge = (powerId: PowerId) => {
    if (!collectedPetals.has(powerId)) {
      setStatusMessage("You can only recharge collected petals.");
      return;
    }

    const resolved = resolvePowerState(powers[powerId], now);
    const powerName = POWERS.find((entry) => entry.id === powerId)?.label ?? "Power";

    if (resolved.energy > 0) {
      setStatusMessage(`${powerName} still has energy and does not need recharging yet.`);
      return;
    }

    if (resolved.rechargeUntil && resolved.rechargeUntil > now) {
      setStatusMessage(`${powerName} is already recharging.`);
      return;
    }

    playRechargeStartSound();

    setPowers((previous) => {
      const current = resolvePowerState(previous[powerId], now);
      return {
        ...previous,
        [powerId]: {
          ...current,
          rechargeUntil: Date.now() + POWER_CONFIG.rechargeMs,
        },
      };
    });

    setStatusMessage(`${powerName} started recharging. It will refill in about a minute.`);
  };

  const handleMinionHit = useCallback(
    (messagePrefix: string, areaId: AreaId) => {
      const hitTime = Date.now();
      if (hitTime < nextDamageAt) {
        return false;
      }

      const respawnWorld = WORLD_MAP[areaId];
      const updatedHealth = Math.max(0, playerHealth - 1);
      setNextDamageAt(hitTime + MINION_HIT_COOLDOWN_MS);
      setPlayerPosition(respawnWorld.start);
      setPlayerHealth(updatedHealth);

      playDamageSound();
      triggerDamageFlash();
      pushEvent("damage", "-1", "#ff3333");

      if (updatedHealth <= 0) {
        setScreen("lose");
        playLoseSound();
        setStatusMessage("Your fairy fell in battle. The witch's minions won this round.");
      } else {
        setStatusMessage(`${messagePrefix} You lost 1 heart (${updatedHealth}/${MAX_HEALTH}).`);
      }

      return true;
    },
    [nextDamageAt, playerHealth, triggerDamageFlash, pushEvent],
  );

  const handleMove = useCallback(
    (direction: Direction, steps = 1, fromDash = false) => {
      if (screen !== "playing") {
        return;
      }

      setLastMoveDirection(direction);

      let workingAreaIndex = areaIndex;
      let workingPosition = { ...playerPosition };
      const workingCollected = new Set(collectedPetals);
      const workingCleared = new Set(obstaclesCleared);
      const newlyCollected: PowerId[] = [];
      const newlyCleared: string[] = [];
      let message = "";
      let reachedWin = false;
      let enteredNewArea = false;

      for (let step = 0; step < steps; step += 1) {
        const currentArea = AREAS[workingAreaIndex];
        const world = WORLD_MAP[currentArea.id];
        const obstacleNodes = getResolvedObstacleNodes(currentArea.id, now);

        const delta =
          direction === "up"
            ? { x: 0, y: -1 }
            : direction === "down"
              ? { x: 0, y: 1 }
              : direction === "left"
                ? { x: -1, y: 0 }
                : { x: 1, y: 0 };

        const target = {
          x: workingPosition.x + delta.x,
          y: workingPosition.y + delta.y,
        };

        if (target.x < 0 || target.x >= world.width || target.y < 0 || target.y >= world.height) {
          message = fromDash ? "Dash fizzled at the edge of the world." : "You cannot move past the map edge.";
          break;
        }

        const hitWall = world.walls.some((wall) => isSamePoint(wall, target));
        if (hitWall) {
          message = fromDash ? "Dash blocked by thick flowers." : "Dense flowers block that path.";
          break;
        }

        const blockingObstacle = currentArea.obstacles.find((obstacle) => {
          const node = obstacleNodes[obstacle.id];
          return isSamePoint(node, target) && !workingCleared.has(obstacle.id);
        });

        if (blockingObstacle) {
          if (!effectiveActivePower || effectiveActivePower !== blockingObstacle.requiredPower) {
            const requiredLabel = POWERS.find((entry) => entry.id === blockingObstacle.requiredPower)?.label;
            const gotHit = handleMinionHit(
              `${blockingObstacle.minion} struck first. Activate ${requiredLabel} before charging in.`,
              currentArea.id,
            );
            if (!gotHit) {
              setStatusMessage(`${blockingObstacle.minion} is attacking. Keep moving or wait a moment to re-engage.`);
            }
            return;
          }

          workingCleared.add(blockingObstacle.id);
          newlyCleared.push(blockingObstacle.name);
          message = `${blockingObstacle.name} shattered.`;
        }

        workingPosition = target;

        const petalAtTile = currentArea.petals.find((powerId) => {
          const node = world.petalNodes[powerId];
          return isSamePoint(node, target);
        });

        if (petalAtTile && !workingCollected.has(petalAtTile)) {
          workingCollected.add(petalAtTile);
          newlyCollected.push(petalAtTile);
          const label = POWERS.find((entry) => entry.id === petalAtTile)?.label;
          message = `${label} Petal collected.`;
        }

        if (isSamePoint(world.backEntry, target) && workingAreaIndex > 0) {
          const previousArea = AREAS[workingAreaIndex - 1];
          const previousWorld = WORLD_MAP[previousArea.id];
          workingAreaIndex -= 1;
          workingPosition = previousWorld.exit ?? previousWorld.start;
          message = `You returned to ${previousArea.name}.`;
          enteredNewArea = true;
          break;
        }

        if (isSamePoint(world.exit, target)) {
          const uncleared = currentArea.obstacles.some((obstacle) => !workingCleared.has(obstacle.id));
          if (uncleared) {
            message = "A minion still blocks this area. Clear all obstacles before using the gate.";
            break;
          }

          if (workingAreaIndex < AREAS.length - 1) {
            const nextArea = AREAS[workingAreaIndex + 1];
            if (nextArea.id === "pixie-land" && workingCollected.size < 4) {
              message = "You need all four petals before entering Pixie Land.";
              break;
            }

            const nextWorld = WORLD_MAP[nextArea.id];
            workingAreaIndex += 1;
            workingPosition = nextWorld.start;
            message = `You entered ${nextArea.name}.`;
            enteredNewArea = true;
            break;
          }
        }

        if (currentArea.id === "pixie-land" && isSamePoint(world.goal, target)) {
          reachedWin = true;
          message = "Pixie Land reached. Your adventure is complete.";
          break;
        }
      }

      // Play sounds for events
      if (!fromDash) {
        playMoveSound();
      }

      for (const name of newlyCleared) {
        playObstacleClearSound();
        pushEvent("clear", `${name} Cleared`, "#ff8800");
      }

      setAreaIndex(workingAreaIndex);
      setPlayerPosition(workingPosition);
      setCollectedPetals(workingCollected);
      setObstaclesCleared(workingCleared);

      if (newlyCollected.length > 0) {
        playCollectSound();
        for (const powerId of newlyCollected) {
          const label = POWERS.find((entry) => entry.id === powerId)?.label;
          pushEvent("collect", `+1 ${label} Petal`, "#ffd700");
        }

        setPowers((previous) => {
          const next = { ...previous };
          for (const powerId of newlyCollected) {
            const resolved = resolvePowerState(next[powerId], now);
            next[powerId] = {
              ...resolved,
              energy: resolved.maxEnergy,
              rechargeUntil: null,
            };
          }
          return next;
        });
      }

      if (enteredNewArea) {
        pushEvent("area", `${AREAS[workingAreaIndex].name}`, "#00d4ff");
      }

      if (reachedWin) {
        setScreen("win");
        playWinSound();
      }

      if (fromDash && !message) {
        setStatusMessage("Dash complete.");
      } else {
        setStatusMessage(message || `Exploring ${AREAS[workingAreaIndex].name}...`);
      }
    },
    [
      areaIndex,
      collectedPetals,
      effectiveActivePower,
      handleMinionHit,
      now,
      obstaclesCleared,
      playerPosition,
      pushEvent,
      screen,
    ],
  );

  const handleDash = useCallback(() => {
    if (screen !== "playing") {
      return;
    }

    const currentTime = Date.now();
    if (currentTime < dashReadyAt) {
      setStatusMessage(`Dash recharging (${secondsLeft(dashReadyAt, currentTime)}s left).`);
      return;
    }

    playDashSound();
    setDashReadyAt(currentTime + DASH_COOLDOWN_MS);
    handleMove(lastMoveDirection, 2, true);
  }, [dashReadyAt, handleMove, lastMoveDirection, screen]);

  useEffect(() => {
    if (screen !== "playing") {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();

      if (event.key === "ArrowUp" || key === "w") {
        event.preventDefault();
        handleMove("up");
      }
      if (event.key === "ArrowDown" || key === "s") {
        event.preventDefault();
        handleMove("down");
      }
      if (event.key === "ArrowLeft" || key === "a") {
        event.preventDefault();
        handleMove("left");
      }
      if (event.key === "ArrowRight" || key === "d") {
        event.preventDefault();
        handleMove("right");
      }
      if (event.code === "Space") {
        event.preventDefault();
        handleDash();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDash, handleMove, screen]);

  const currentArea = AREAS[areaIndex];
  const resolvedObstacleNodes = useMemo(
    () => getResolvedObstacleNodes(currentArea.id, now),
    [currentArea.id, now],
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {screen === "landing" && <LandingScreen onStart={() => { playButtonClick(); setScreen("select"); }} />}

      {screen === "select" && <FairySelection onBack={() => { playButtonClick(); setScreen("landing"); }} onSelect={handleFairySelect} />}

      {screen === "playing" && selectedFairy && (
        <GameplayScreen
          selectedFairy={selectedFairy}
          areaIndex={areaIndex}
          playerPosition={playerPosition}
          resolvedObstacleNodes={resolvedObstacleNodes}
          collectedPetals={collectedPetals}
          powers={powers}
          activePower={effectiveActivePower}
          obstaclesCleared={obstaclesCleared}
          now={now}
          playerHealth={playerHealth}
          maxHealth={MAX_HEALTH}
          dashSecondsLeft={dashSecondsLeft}
          lastMoveDirection={lastMoveDirection}
          statusMessage={statusMessage}
          onActivatePower={handleActivatePower}
          onStartRecharge={handleStartRecharge}
          onMove={handleMove}
          onDash={handleDash}
          onRestart={resetGame}
          gameEvents={gameEvents}
          damageFlash={damageFlash}
        />
      )}

      {screen === "win" && <WinScreen onPlayAgain={resetGame} />}
      {screen === "lose" && <LoseScreen onTryAgain={resetGame} />}
    </main>
  );
}
