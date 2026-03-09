"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FairySelection } from "@/components/game/FairySelection";
import { GameplayScreen } from "@/components/game/GameplayScreen";
import { LandingScreen } from "@/components/game/LandingScreen";
import { LoseScreen } from "@/components/game/LoseScreen";
import { WinScreen } from "@/components/game/WinScreen";
import { AREAS, POWER_CONFIG, POWERS, STAR_THRESHOLDS, getMinionsForArea } from "@/lib/game-data";
import { WORLD_MAP } from "@/lib/world-map";
import {
  createInitialBossState, tickBoss, tickProjectiles, checkBossDamage,
  detectCombo, calculateStars,
} from "@/lib/boss-logic";
import {
  playButtonClick, playCollectSound, playDamageSound, playDashSound,
  playLoseSound, playMoveSound, playObstacleClearSound, playPowerActivateSound,
  playRechargeStartSound, playWinSound, playBossAttackSound, playBossHitSound,
  playBossPhaseSound, playComboSound, playHealSound, playBossDefeatedSound,
} from "@/lib/sounds";
import {
  AreaId, AreaScore, BossState, ComboState, Direction, Fairy, GameEvent,
  HazardTile, MinionDefinition, MinionState, Point, PowerId, PowerState,
  Projectile, Screen,
} from "@/types/game";

const DASH_COOLDOWN_MS = 5000;
const MAX_HEALTH = 5;
const MINION_HIT_COOLDOWN_MS = 1500;
const GAME_TICK_MS = 150;

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

function manhattan(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isWalkable(p: Point, world: { width: number; height: number; walls: Point[] }) {
  if (p.x < 0 || p.x >= world.width || p.y < 0 || p.y >= world.height) return false;
  return !world.walls.some((w) => w.x === p.x && w.y === p.y);
}

function isHazardActive(hazard: HazardTile, now: number): boolean {
  if (!hazard.cycleSec) return true;
  const cycleMs = hazard.cycleSec * 1000;
  const offset = (hazard.phaseOffset ?? 0) * cycleMs;
  const phase = ((now + offset) % cycleMs) / cycleMs;
  return phase < 0.5;
}

function getHazardAt(hazards: HazardTile[], pos: Point, now: number): HazardTile | null {
  for (const h of hazards) {
    if (h.position.x === pos.x && h.position.y === pos.y && isHazardActive(h, now)) {
      return h;
    }
  }
  return null;
}

function createMinionStates(defs: MinionDefinition[]): MinionState[] {
  return defs.map((d) => ({
    id: d.id,
    position: { ...d.waypoints[0] },
    waypointIndex: 0,
    direction: 1,
    isChasing: false,
    stunnedUntil: 0,
    defeated: false,
    lastMoveAt: 0,
  }));
}

function tickMinion(
  state: MinionState,
  def: MinionDefinition,
  now: number,
  playerPos: Point,
  world: { width: number; height: number; walls: Point[] },
): MinionState {
  if (state.defeated) return state;
  if (state.despawnAt && now >= state.despawnAt) return { ...state, defeated: true };
  if (now < state.stunnedUntil) return state;

  const interval = 1000 / def.speed;
  if (now - state.lastMoveAt < interval) return state;

  const next = { ...state, lastMoveAt: now };

  if (def.patrolType === "chase") {
    const dist = manhattan(state.position, playerPos);
    const inRange = dist <= (def.chaseRange ?? 3);
    next.isChasing = inRange;

    if (inRange) {
      const dx = playerPos.x - state.position.x;
      const dy = playerPos.y - state.position.y;
      let target: Point;
      if (Math.abs(dx) >= Math.abs(dy)) {
        target = { x: state.position.x + Math.sign(dx), y: state.position.y };
      } else {
        target = { x: state.position.x, y: state.position.y + Math.sign(dy) };
      }
      if (isWalkable(target, world)) {
        next.position = target;
      } else {
        const alt = Math.abs(dx) >= Math.abs(dy)
          ? { x: state.position.x, y: state.position.y + Math.sign(dy || 1) }
          : { x: state.position.x + Math.sign(dx || 1), y: state.position.y };
        if (isWalkable(alt, world)) {
          next.position = alt;
        }
      }
      return next;
    }

    const home = def.waypoints[0];
    if (state.position.x !== home.x || state.position.y !== home.y) {
      const dx = home.x - state.position.x;
      const dy = home.y - state.position.y;
      const target = Math.abs(dx) >= Math.abs(dy)
        ? { x: state.position.x + Math.sign(dx), y: state.position.y }
        : { x: state.position.x, y: state.position.y + Math.sign(dy) };
      if (isWalkable(target, world)) {
        next.position = target;
      }
    }
    return next;
  }

  if (def.patrolType === "linear") {
    const wps = def.waypoints;
    if (wps.length < 2) return next;

    let idx = state.waypointIndex;
    let dir = state.direction;
    const targetWp = wps[idx + dir] ?? wps[idx];

    if (!targetWp || (targetWp.x === state.position.x && targetWp.y === state.position.y)) {
      dir = (dir * -1) as 1 | -1;
      next.direction = dir;
      const newTarget = wps[idx + dir];
      if (!newTarget) return next;
      idx = idx + dir;
    } else {
      idx = idx + dir;
    }

    const dest = wps[Math.max(0, Math.min(idx, wps.length - 1))];
    const dx = dest.x - state.position.x;
    const dy = dest.y - state.position.y;
    if (dx !== 0 || dy !== 0) {
      const step = Math.abs(dx) >= Math.abs(dy)
        ? { x: state.position.x + Math.sign(dx), y: state.position.y }
        : { x: state.position.x, y: state.position.y + Math.sign(dy) };
      if (isWalkable(step, world)) {
        next.position = step;
      }
    }
    next.waypointIndex = Math.max(0, Math.min(idx, wps.length - 1));
    return next;
  }

  if (def.patrolType === "circular") {
    const wps = def.waypoints;
    if (wps.length < 2) return next;

    const targetWp = wps[state.waypointIndex];
    if (state.position.x === targetWp.x && state.position.y === targetWp.y) {
      next.waypointIndex = (state.waypointIndex + 1) % wps.length;
      return next;
    }

    const dx = targetWp.x - state.position.x;
    const dy = targetWp.y - state.position.y;
    const step = Math.abs(dx) >= Math.abs(dy)
      ? { x: state.position.x + Math.sign(dx), y: state.position.y }
      : { x: state.position.x, y: state.position.y + Math.sign(dy) };
    if (isWalkable(step, world)) {
      next.position = step;
    }
    return next;
  }

  return next;
}

function getResolvedObstacleNodes(areaId: AreaId) {
  return { ...WORLD_MAP[areaId].obstacleNodes };
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
  const [minionStates, setMinionStates] = useState<MinionState[]>([]);
  const [collectedHealthPickups, setCollectedHealthPickups] = useState<Set<string>>(new Set());

  // Boss fight state
  const [bossState, setBossState] = useState<BossState | null>(null);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [comboState, setComboState] = useState<ComboState>({
    activeComboId: null, activeUntil: 0, lastActivations: [],
  });

  // Score tracking
  const [areaStartTime, setAreaStartTime] = useState(0);
  const [areaDamageTaken, setAreaDamageTaken] = useState(0);
  const [areaScores, setAreaScores] = useState<Record<string, AreaScore>>({});

  const damageFlashTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Refs for game tick
  const screenRef = useRef(screen);
  const areaIndexRef = useRef(areaIndex);
  const playerPosRef = useRef(playerPosition);
  const nextDamageAtRef = useRef(nextDamageAt);
  const playerHealthRef = useRef(playerHealth);
  const minionStatesRef = useRef(minionStates);
  const powersRef = useRef(powers);
  const activePowerRef = useRef(activePower);
  const bossRef = useRef(bossState);
  const projectilesRef = useRef(projectiles);
  const comboRef = useRef(comboState);

  screenRef.current = screen;
  areaIndexRef.current = areaIndex;
  playerPosRef.current = playerPosition;
  nextDamageAtRef.current = nextDamageAt;
  playerHealthRef.current = playerHealth;
  minionStatesRef.current = minionStates;
  powersRef.current = powers;
  activePowerRef.current = activePower;
  bossRef.current = bossState;
  projectilesRef.current = projectiles;
  comboRef.current = comboState;

  const pushEvent = useCallback((type: GameEvent["type"], text: string, color: string) => {
    const event: GameEvent = {
      id: ++eventIdCounter, type, text, color, timestamp: Date.now(),
    };
    setGameEvents((prev) => [...prev.slice(-4), event]);
  }, []);

  useEffect(() => {
    if (gameEvents.length === 0) return;
    const timer = setTimeout(() => {
      setGameEvents((prev) => prev.filter((e) => Date.now() - e.timestamp < 2000));
    }, 2100);
    return () => clearTimeout(timer);
  }, [gameEvents]);

  const triggerDamageFlash = useCallback(() => {
    setDamageFlash(true);
    if (damageFlashTimeout.current) clearTimeout(damageFlashTimeout.current);
    damageFlashTimeout.current = setTimeout(() => setDamageFlash(false), 400);
  }, []);

  const applyDamageInTick = useCallback((tickNow: number, world: { start: Point }, source: string, eventColor: string) => {
    const updatedHealth = Math.max(0, playerHealthRef.current - 1);
    nextDamageAtRef.current = tickNow + MINION_HIT_COOLDOWN_MS;
    setNextDamageAt(tickNow + MINION_HIT_COOLDOWN_MS);
    setPlayerPosition(world.start);
    playerPosRef.current = world.start;
    setPlayerHealth(updatedHealth);
    playerHealthRef.current = updatedHealth;
    setAreaDamageTaken((d) => d + 1);

    playDamageSound();
    setDamageFlash(true);
    setTimeout(() => setDamageFlash(false), 400);
    setGameEvents((prev) => [...prev.slice(-4), {
      id: ++eventIdCounter, type: "damage" as const, text: "-1", color: eventColor, timestamp: tickNow,
    }]);

    if (updatedHealth <= 0) {
      setScreen("lose");
      screenRef.current = "lose";
      playLoseSound();
      setStatusMessage("Your fairy fell in battle. The witch's minions won this round.");
    } else {
      setStatusMessage(`${source} (${updatedHealth}/${MAX_HEALTH})`);
    }
    return updatedHealth;
  }, []);

  // ── Game tick loop (150ms) ──
  useEffect(() => {
    const tick = window.setInterval(() => {
      const tickNow = Date.now();
      setNow(tickNow);

      if (screenRef.current !== "playing") return;

      const currentArea = AREAS[areaIndexRef.current];
      const world = WORLD_MAP[currentArea.id];
      const defs = getMinionsForArea(currentArea.id);

      // Tick all minions
      const updatedMinions = minionStatesRef.current.map((ms) => {
        const def = defs.find((d) => d.id === ms.id);
        if (!def) return ms;
        return tickMinion(ms, def, tickNow, playerPosRef.current, world);
      });

      // Check minion-player collisions
      let hit = false;
      for (const ms of updatedMinions) {
        if (ms.defeated || tickNow < ms.stunnedUntil) continue;
        if (ms.position.x === playerPosRef.current.x && ms.position.y === playerPosRef.current.y) {
          const def = defs.find((d) => d.id === ms.id);
          const ap = activePowerRef.current;
          if (ap && def?.requiredPower === ap) {
            const resolved = resolvePowerState(powersRef.current[ap], tickNow);
            if (resolved.activeUntil && resolved.activeUntil > tickNow) {
              ms.stunnedUntil = tickNow + (def.stunDurationMs ?? 3000);
              continue;
            }
          }
          // Check combo shield
          const cs = comboRef.current;
          if (cs.activeComboId === "frost-shield" && cs.activeUntil > tickNow) continue;

          if (tickNow >= nextDamageAtRef.current && !hit) {
            hit = true;
            applyDamageInTick(tickNow, world, `${def?.name ?? "Minion"} caught you!`, "#ff3333");
          }
        }
      }

      // Hazard damage
      if (!hit && tickNow >= nextDamageAtRef.current) {
        const hazard = getHazardAt(world.hazards, playerPosRef.current, tickNow);
        if (hazard) {
          const ap = activePowerRef.current;
          let immune = false;
          if (ap === hazard.immunePower) {
            const resolved = resolvePowerState(powersRef.current[ap], tickNow);
            if (resolved.activeUntil && resolved.activeUntil > tickNow) immune = true;
          }
          if (!immune) {
            hit = true;
            const names: Record<string, string> = { lava: "Lava", poison: "Poison", thorns: "Thorns", spikes: "Spikes" };
            applyDamageInTick(tickNow, world, `${names[hazard.type]} burned you!`,
              hazard.type === "lava" ? "#ff6b35" : hazard.type === "poison" ? "#39ff14" : "#ff3333");
          }
        }
      }

      setMinionStates(updatedMinions);
      minionStatesRef.current = updatedMinions;

      // ── Boss tick (Pixie Land only) ──
      if (currentArea.id === "pixie-land" && bossRef.current && bossRef.current.phase !== "defeated") {
        const prevPhase = bossRef.current.phase;
        const bossResult = tickBoss(bossRef.current, tickNow, playerPosRef.current, world);

        // Play sounds for attacks
        if (bossResult.newProjectiles.length > 0) {
          playBossAttackSound();
        }

        // Phase transition sound
        if (bossResult.boss.phase !== prevPhase && bossResult.boss.phase !== "defeated") {
          playBossPhaseSound();
          setGameEvents((prev) => [...prev.slice(-4), {
            id: ++eventIdCounter, type: "boss_phase" as const,
            text: `Phase ${bossResult.boss.phase === "phase2" ? "2" : "3"}!`,
            color: "#ff2d95", timestamp: tickNow,
          }]);
        }

        // Tick projectiles
        const slowActive = comboRef.current.activeComboId === "nature-slow" && comboRef.current.activeUntil > tickNow;
        const allProjectiles = [...projectilesRef.current, ...bossResult.newProjectiles];
        let updatedProjectiles = tickProjectiles(allProjectiles, world, slowActive);

        // Projectile-player collisions
        if (!hit && tickNow >= nextDamageAtRef.current) {
          const shielded = comboRef.current.activeComboId === "frost-shield" && comboRef.current.activeUntil > tickNow;
          const surviving: Projectile[] = [];
          for (const proj of updatedProjectiles) {
            if (proj.position.x === playerPosRef.current.x && proj.position.y === playerPosRef.current.y) {
              if (shielded) continue; // absorb
              const ap = activePowerRef.current;
              if (proj.immunePower && ap === proj.immunePower) {
                const resolved = resolvePowerState(powersRef.current[ap!], tickNow);
                if (resolved.activeUntil && resolved.activeUntil > tickNow) continue; // immune
              }
              if (!hit) {
                hit = true;
                applyDamageInTick(tickNow, world, "Dark orb struck you!", "#9933ff");
              }
            } else {
              surviving.push(proj);
            }
          }
          updatedProjectiles = surviving;
        }

        setBossState(bossResult.boss);
        bossRef.current = bossResult.boss;
        setProjectiles(updatedProjectiles);
        projectilesRef.current = updatedProjectiles;

        // Boss defeated
        if (bossResult.boss.phase === "defeated") {
          playBossDefeatedSound();
          const elapsed = tickNow - (areaStartTime || tickNow);
          setAreaScores((prev) => ({
            ...prev,
            "pixie-land": {
              timeMs: elapsed,
              damageTaken: areaDamageTaken,
              stars: calculateStars(elapsed, areaDamageTaken, STAR_THRESHOLDS["pixie-land"]),
            },
          }));
          setTimeout(() => {
            setScreen("win");
            playWinSound();
          }, 1500);
        }
      }

      // Expire combo
      const cs = comboRef.current;
      if (cs.activeComboId && cs.activeUntil <= tickNow) {
        const newCs = { ...cs, activeComboId: null, activeUntil: 0 };
        setComboState(newCs);
        comboRef.current = newCs;
      }
    }, GAME_TICK_MS);

    return () => window.clearInterval(tick);
  }, [applyDamageInTick, areaStartTime, areaDamageTaken]);

  const effectiveActivePower = useMemo(() => {
    if (!activePower) return null;
    const resolved = resolvePowerState(powers[activePower], now);
    if (!resolved.activeUntil || resolved.activeUntil <= now) return null;
    return activePower;
  }, [activePower, now, powers]);

  const dashSecondsLeft = useMemo(() => {
    if (dashReadyAt <= now) return 0;
    return secondsLeft(dashReadyAt, now);
  }, [dashReadyAt, now]);

  const initMinionsForArea = useCallback((areaId: string) => {
    const defs = getMinionsForArea(areaId);
    const states = createMinionStates(defs);
    setMinionStates(states);
    minionStatesRef.current = states;
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
    setMinionStates([]);
    minionStatesRef.current = [];
    setCollectedHealthPickups(new Set());
    setBossState(null);
    bossRef.current = null;
    setProjectiles([]);
    projectilesRef.current = [];
    setComboState({ activeComboId: null, activeUntil: 0, lastActivations: [] });
    comboRef.current = { activeComboId: null, activeUntil: 0, lastActivations: [] };
    setAreaScores({});
    setAreaStartTime(0);
    setAreaDamageTaken(0);
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
    initMinionsForArea("flower-forest");
    setAreaStartTime(Date.now());
    setAreaDamageTaken(0);
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
      setStatusMessage(`${powerName} is empty. Tap to recharge.`);
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

    // Combo detection
    const comboResult = detectCombo(comboState, powerId, Date.now());
    setComboState(comboResult.state);
    comboRef.current = comboResult.state;

    if (comboResult.combo) {
      playComboSound();
      pushEvent("combo", comboResult.combo.name, "#ffd700");

      // Apply combo effects
      if (comboResult.combo.effectType === "heal") {
        playHealSound();
        setPlayerHealth((h) => {
          const newH = Math.min(MAX_HEALTH, h + 1);
          playerHealthRef.current = newH;
          return newH;
        });
        pushEvent("heal", "+1 HP", "#39ff14");
        setStatusMessage(`${comboResult.combo.name}! Healed 1 HP.`);
      } else if (comboResult.combo.effectType === "burst" && bossRef.current && bossRef.current.phase !== "defeated") {
        // Steam Burst damages boss from range if close
        if (manhattan(playerPosition, bossRef.current.position) <= 4) {
          const dmgResult = { ...bossRef.current, health: Math.max(0, bossRef.current.health - 1), lastDamagedAt: Date.now() };
          if (dmgResult.health <= 0) dmgResult.phase = "defeated";
          setBossState(dmgResult);
          bossRef.current = dmgResult;
          playBossHitSound();
          pushEvent("boss_hit", "Burst -1", "#ffd700");
          setStatusMessage(`${comboResult.combo.name}! The witch takes damage!`);
        } else {
          setStatusMessage(`${comboResult.combo.name}! But the witch is too far.`);
        }
      } else {
        setStatusMessage(`${comboResult.combo.name} activated!`);
      }
    } else {
      setStatusMessage(`${powerName} activated for ${POWER_CONFIG.activeMs / 1000}s!`);
    }
  };

  const handleStartRecharge = (powerId: PowerId) => {
    if (!collectedPetals.has(powerId)) {
      setStatusMessage("You can only recharge collected petals.");
      return;
    }
    const resolved = resolvePowerState(powers[powerId], now);
    const powerName = POWERS.find((entry) => entry.id === powerId)?.label ?? "Power";

    if (resolved.energy > 0) { setStatusMessage(`${powerName} still has energy.`); return; }
    if (resolved.rechargeUntil && resolved.rechargeUntil > now) { setStatusMessage(`${powerName} is already recharging.`); return; }

    playRechargeStartSound();
    setPowers((previous) => {
      const current = resolvePowerState(previous[powerId], now);
      return {
        ...previous,
        [powerId]: { ...current, rechargeUntil: Date.now() + POWER_CONFIG.rechargeMs },
      };
    });
    setStatusMessage(`${powerName} recharging (${POWER_CONFIG.rechargeMs / 1000}s).`);
  };

  const handleMinionHit = useCallback(
    (messagePrefix: string, areaId: AreaId) => {
      const hitTime = Date.now();
      if (hitTime < nextDamageAt) return false;
      // Check combo shield
      if (comboRef.current.activeComboId === "frost-shield" && comboRef.current.activeUntil > hitTime) return false;

      const respawnWorld = WORLD_MAP[areaId];
      const updatedHealth = Math.max(0, playerHealth - 1);
      setNextDamageAt(hitTime + MINION_HIT_COOLDOWN_MS);
      setPlayerPosition(respawnWorld.start);
      setPlayerHealth(updatedHealth);
      playerHealthRef.current = updatedHealth;
      setAreaDamageTaken((d) => d + 1);

      playDamageSound();
      triggerDamageFlash();
      pushEvent("damage", "-1", "#ff3333");

      if (updatedHealth <= 0) {
        setScreen("lose");
        playLoseSound();
        setStatusMessage("Your fairy fell in battle. The witch's minions won this round.");
      } else {
        setStatusMessage(`${messagePrefix} (${updatedHealth}/${MAX_HEALTH})`);
      }
      return true;
    },
    [nextDamageAt, playerHealth, triggerDamageFlash, pushEvent],
  );

  const handleMove = useCallback(
    (direction: Direction, steps = 1, fromDash = false) => {
      if (screen !== "playing") return;
      setLastMoveDirection(direction);

      let workingAreaIndex = areaIndex;
      let workingPosition = { ...playerPosition };
      const workingCollected = new Set(collectedPetals);
      const workingCleared = new Set(obstaclesCleared);
      const workingHealthPickups = new Set(collectedHealthPickups);
      const newlyCollected: PowerId[] = [];
      const newlyCleared: string[] = [];
      let message = "";
      let reachedWin = false;
      let enteredNewArea = false;

      for (let step = 0; step < steps; step += 1) {
        const currentArea = AREAS[workingAreaIndex];
        const world = WORLD_MAP[currentArea.id];
        const obstacleNodes = getResolvedObstacleNodes(currentArea.id);

        const delta =
          direction === "up" ? { x: 0, y: -1 }
            : direction === "down" ? { x: 0, y: 1 }
              : direction === "left" ? { x: -1, y: 0 }
                : { x: 1, y: 0 };

        const target = { x: workingPosition.x + delta.x, y: workingPosition.y + delta.y };

        if (target.x < 0 || target.x >= world.width || target.y < 0 || target.y >= world.height) {
          message = fromDash ? "Dash fizzled at the edge." : "Edge of the map.";
          break;
        }
        if (world.walls.some((wall) => isSamePoint(wall, target))) {
          message = fromDash ? "Dash blocked." : "Blocked.";
          break;
        }

        const blockingObstacle = currentArea.obstacles.find((obstacle) => {
          const node = obstacleNodes[obstacle.id];
          return isSamePoint(node, target) && !workingCleared.has(obstacle.id);
        });

        if (blockingObstacle) {
          if (!effectiveActivePower || effectiveActivePower !== blockingObstacle.requiredPower) {
            const requiredLabel = POWERS.find((entry) => entry.id === blockingObstacle.requiredPower)?.label;
            handleMinionHit(`${blockingObstacle.minion} struck! Need ${requiredLabel}.`, currentArea.id);
            return;
          }
          workingCleared.add(blockingObstacle.id);
          newlyCleared.push(blockingObstacle.name);
          message = `${blockingObstacle.name} shattered!`;
        }

        workingPosition = target;

        // Minion collision
        const currentMinions = minionStatesRef.current;
        const mDefs = getMinionsForArea(currentArea.id);
        for (const ms of currentMinions) {
          if (ms.defeated || Date.now() < ms.stunnedUntil) continue;
          if (ms.position.x === target.x && ms.position.y === target.y) {
            const def = mDefs.find((d) => d.id === ms.id);
            if (effectiveActivePower && def?.requiredPower === effectiveActivePower) {
              ms.stunnedUntil = Date.now() + (def.stunDurationMs ?? 3000);
              message = `${def.name} stunned!`;
              pushEvent("clear", `${def.name} Stunned`, "#00d4ff");
            } else {
              handleMinionHit(`${def?.name ?? "Minion"} caught you!`, currentArea.id);
              return;
            }
          }
        }

        // Hazard collision
        const hazard = getHazardAt(world.hazards, target, Date.now());
        if (hazard) {
          if (effectiveActivePower !== hazard.immunePower) {
            const names: Record<string, string> = { lava: "Lava", poison: "Poison", thorns: "Thorns", spikes: "Spikes" };
            handleMinionHit(`${names[hazard.type]} hurt you!`, currentArea.id);
            return;
          }
        }

        // Health pickup
        const hpKey = `${currentArea.id}-${target.x},${target.y}`;
        if (!workingHealthPickups.has(hpKey)) {
          const pickup = world.healthPickups.find((p) => p.x === target.x && p.y === target.y);
          if (pickup && playerHealth < MAX_HEALTH) {
            workingHealthPickups.add(hpKey);
            playHealSound();
            setPlayerHealth((h) => { const n = Math.min(MAX_HEALTH, h + 1); playerHealthRef.current = n; return n; });
            pushEvent("heal", "+1 HP", "#39ff14");
            message = "Found a health pickup!";
          }
        }

        // Boss damage check (adjacent to boss during vulnerability)
        if (currentArea.id === "pixie-land" && bossRef.current) {
          const dmgResult = checkBossDamage(bossRef.current, target, effectiveActivePower, Date.now());
          if (dmgResult.damaged) {
            setBossState(dmgResult.boss);
            bossRef.current = dmgResult.boss;
            playBossHitSound();
            pushEvent("boss_hit", `-1 Witch (${dmgResult.boss.health}/${dmgResult.boss.maxHealth})`, "#ffd700");
            message = `Hit the witch! (${dmgResult.boss.health} HP left)`;
          }
        }

        // Petal collection
        const petalAtTile = currentArea.petals.find((powerId) => {
          const node = world.petalNodes[powerId];
          return isSamePoint(node, target);
        });
        if (petalAtTile && !workingCollected.has(petalAtTile)) {
          workingCollected.add(petalAtTile);
          newlyCollected.push(petalAtTile);
          const label = POWERS.find((entry) => entry.id === petalAtTile)?.label;
          message = `${label} Petal collected!`;
        }

        // Back entry
        if (isSamePoint(world.backEntry, target) && workingAreaIndex > 0) {
          const previousArea = AREAS[workingAreaIndex - 1];
          const previousWorld = WORLD_MAP[previousArea.id];
          workingAreaIndex -= 1;
          workingPosition = previousWorld.exit ?? previousWorld.start;
          message = `Returned to ${previousArea.name}.`;
          enteredNewArea = true;
          break;
        }

        // Exit
        if (isSamePoint(world.exit, target)) {
          const uncleared = currentArea.obstacles.some((o) => !workingCleared.has(o.id));
          if (uncleared) { message = "Clear all obstacles first!"; break; }

          if (workingAreaIndex < AREAS.length - 1) {
            const nextArea = AREAS[workingAreaIndex + 1];
            if (nextArea.id === "pixie-land" && workingCollected.size < 4) {
              message = "Need all four petals!";
              break;
            }
            // Record score for current area
            const elapsed = Date.now() - (areaStartTime || Date.now());
            const thresholds = STAR_THRESHOLDS[currentArea.id];
            if (thresholds) {
              setAreaScores((prev) => ({
                ...prev,
                [currentArea.id]: {
                  timeMs: elapsed,
                  damageTaken: areaDamageTaken,
                  stars: calculateStars(elapsed, areaDamageTaken, thresholds),
                },
              }));
            }

            workingAreaIndex += 1;
            workingPosition = WORLD_MAP[AREAS[workingAreaIndex].id].start;
            message = `Entered ${AREAS[workingAreaIndex].name}.`;
            enteredNewArea = true;
            break;
          }
        }
      }

      if (!fromDash) playMoveSound();

      for (const name of newlyCleared) {
        playObstacleClearSound();
        pushEvent("clear", `${name} Cleared`, "#ff8800");
      }

      setAreaIndex(workingAreaIndex);
      setPlayerPosition(workingPosition);
      playerPosRef.current = workingPosition;
      setCollectedPetals(workingCollected);
      setObstaclesCleared(workingCleared);
      setCollectedHealthPickups(workingHealthPickups);

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
            next[powerId] = { ...resolved, energy: resolved.maxEnergy, rechargeUntil: null };
          }
          return next;
        });
      }

      if (enteredNewArea) {
        pushEvent("area", `${AREAS[workingAreaIndex].name}`, "#00d4ff");
        initMinionsForArea(AREAS[workingAreaIndex].id);
        setAreaStartTime(Date.now());
        setAreaDamageTaken(0);

        // Initialize boss for Pixie Land
        if (AREAS[workingAreaIndex].id === "pixie-land") {
          const bs = createInitialBossState(Date.now());
          setBossState(bs);
          bossRef.current = bs;
          setProjectiles([]);
          projectilesRef.current = [];
        } else {
          setBossState(null);
          bossRef.current = null;
          setProjectiles([]);
          projectilesRef.current = [];
        }
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
      areaIndex, areaStartTime, areaDamageTaken, collectedHealthPickups,
      collectedPetals, effectiveActivePower, handleMinionHit,
      initMinionsForArea, now, obstaclesCleared, playerHealth,
      playerPosition, pushEvent, screen,
    ],
  );

  const handleDash = useCallback(() => {
    if (screen !== "playing") return;
    const currentTime = Date.now();
    if (currentTime < dashReadyAt) {
      setStatusMessage(`Dash recharging (${secondsLeft(dashReadyAt, currentTime)}s).`);
      return;
    }
    playDashSound();
    setDashReadyAt(currentTime + DASH_COOLDOWN_MS);
    handleMove(lastMoveDirection, 2, true);
  }, [dashReadyAt, handleMove, lastMoveDirection, screen]);

  useEffect(() => {
    if (screen !== "playing") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (event.key === "ArrowUp" || key === "w") { event.preventDefault(); handleMove("up"); }
      if (event.key === "ArrowDown" || key === "s") { event.preventDefault(); handleMove("down"); }
      if (event.key === "ArrowLeft" || key === "a") { event.preventDefault(); handleMove("left"); }
      if (event.key === "ArrowRight" || key === "d") { event.preventDefault(); handleMove("right"); }
      if (event.code === "Space") { event.preventDefault(); handleDash(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDash, handleMove, screen]);

  const currentArea = AREAS[areaIndex];
  const resolvedObstacleNodes = useMemo(
    () => getResolvedObstacleNodes(currentArea.id),
    [currentArea.id],
  );

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      {screen === "landing" && (
        <div key="landing" className="animate-screen-enter">
          <LandingScreen onStart={() => { playButtonClick(); setScreen("select"); }} />
        </div>
      )}

      {screen === "select" && (
        <div key="select" className="animate-screen-enter">
          <FairySelection onBack={() => { playButtonClick(); setScreen("landing"); }} onSelect={handleFairySelect} />
        </div>
      )}

      {screen === "playing" && selectedFairy && (
        <div key="playing" className="animate-screen-enter">
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
            minionStates={minionStates}
            bossState={bossState}
            projectiles={projectiles}
            comboState={comboState}
          />
        </div>
      )}

      {screen === "win" && (
        <div key="win" className="animate-screen-enter">
          <WinScreen onPlayAgain={resetGame} areaScores={areaScores} />
        </div>
      )}

      {screen === "lose" && (
        <div key="lose" className="animate-screen-enter">
          <LoseScreen onTryAgain={resetGame} />
        </div>
      )}
    </main>
  );
}
