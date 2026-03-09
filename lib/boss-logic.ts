import { BOSS_CONFIG, COMBO_WINDOW_MS, POWER_COMBOS } from "@/lib/game-data";
import {
  BossAttackPattern, BossPhase, BossState, ComboState,
  Direction, Point, PowerCombo, PowerId, Projectile,
} from "@/types/game";

let projectileIdCounter = 0;

function manhattan(a: Point, b: Point) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function isWalkable(p: Point, world: { width: number; height: number; walls: Point[] }) {
  if (p.x < 0 || p.x >= world.width || p.y < 0 || p.y >= world.height) return false;
  return !world.walls.some((w) => w.x === p.x && w.y === p.y);
}

function directionDelta(dir: Direction): Point {
  switch (dir) {
    case "up": return { x: 0, y: -1 };
    case "down": return { x: 0, y: 1 };
    case "left": return { x: -1, y: 0 };
    case "right": return { x: 1, y: 0 };
  }
}

function directionToward(from: Point, to: Point): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx > 0 ? "right" : "left";
  }
  return dy > 0 ? "down" : "up";
}

function directionAway(from: Point, to: Point): Direction {
  const d = directionToward(from, to);
  switch (d) {
    case "up": return "down";
    case "down": return "up";
    case "left": return "right";
    case "right": return "left";
  }
}

const DIRS: Direction[] = ["up", "down", "left", "right"];
const SPIRAL_ORDER: Direction[] = ["right", "down", "left", "up"];

export function createInitialBossState(now: number): BossState {
  return {
    health: BOSS_CONFIG.maxHealth,
    maxHealth: BOSS_CONFIG.maxHealth,
    position: { ...BOSS_CONFIG.startPosition },
    phase: "intro",
    currentAttack: "none",
    attackTickCounter: 0,
    attackCooldownUntil: 0,
    vulnerableUntil: 0,
    requiredPower: null,
    lastDamagedAt: 0,
    phaseTransitionUntil: 0,
    introUntil: now + BOSS_CONFIG.introMs,
  };
}

function selectAttack(phase: BossPhase): BossAttackPattern {
  const r = Math.random();
  switch (phase) {
    case "phase1":
      return r < 0.7 ? "orb_line" : "orb_cross";
    case "phase2":
      if (r < 0.35) return "orb_cross";
      if (r < 0.65) return "orb_line";
      return "summon";
    case "phase3":
      if (r < 0.3) return "orb_spiral";
      if (r < 0.55) return "orb_cross";
      if (r < 0.8) return "orb_line";
      return "summon";
    default:
      return "none";
  }
}

function getPhaseVulnerability(phase: BossPhase): PowerId | null {
  switch (phase) {
    case "phase1": return BOSS_CONFIG.phaseVulnerability.phase1;
    case "phase2": return BOSS_CONFIG.phaseVulnerability.phase2;
    case "phase3": return BOSS_CONFIG.phaseVulnerability.phase3;
    default: return null;
  }
}

export function tickBoss(
  boss: BossState,
  now: number,
  playerPos: Point,
  world: { width: number; height: number; walls: Point[] },
): { boss: BossState; newProjectiles: Projectile[] } {
  if (boss.phase === "defeated") return { boss, newProjectiles: [] };

  const next = { ...boss };
  const newProjectiles: Projectile[] = [];

  // Intro phase
  if (next.phase === "intro") {
    if (now >= next.introUntil) {
      next.phase = "phase1";
      next.attackCooldownUntil = now + BOSS_CONFIG.attackCooldownMs;
    }
    return { boss: next, newProjectiles };
  }

  // Phase transition invulnerability
  if (now < next.phaseTransitionUntil) {
    return { boss: next, newProjectiles };
  }

  // Check phase transitions
  if (next.phase === "phase1" && next.health <= BOSS_CONFIG.phase2At) {
    next.phase = "phase2";
    next.phaseTransitionUntil = now + BOSS_CONFIG.phaseTransitionMs;
    next.currentAttack = "none";
    next.attackTickCounter = 0;
    next.vulnerableUntil = 0;
    return { boss: next, newProjectiles };
  }
  if (next.phase === "phase2" && next.health <= BOSS_CONFIG.phase3At) {
    next.phase = "phase3";
    next.phaseTransitionUntil = now + BOSS_CONFIG.phaseTransitionMs;
    next.currentAttack = "none";
    next.attackTickCounter = 0;
    next.vulnerableUntil = 0;
    return { boss: next, newProjectiles };
  }

  // During vulnerability window: stay still, don't attack
  if (next.vulnerableUntil > now) {
    return { boss: next, newProjectiles };
  }

  // Start new attack if idle and cooldown expired
  if (next.currentAttack === "none" && now >= next.attackCooldownUntil) {
    next.currentAttack = selectAttack(next.phase);
    next.attackTickCounter = 0;
  }

  // Execute attack
  if (next.currentAttack !== "none") {
    if (next.attackTickCounter === 0) {
      // Fire projectiles on first tick of attack
      const bPos = next.position;

      if (next.currentAttack === "orb_line") {
        const dir = directionToward(bPos, playerPos);
        newProjectiles.push(createProjectile(bPos, dir, next.phase));
        // Phase 2+ fires an extra orb offset
        if (next.phase !== "phase1") {
          const perp = dir === "up" || dir === "down" ? "right" : "down";
          newProjectiles.push(createProjectile(bPos, perp, next.phase));
        }
      } else if (next.currentAttack === "orb_cross") {
        for (const dir of DIRS) {
          newProjectiles.push(createProjectile(bPos, dir, next.phase));
        }
      } else if (next.currentAttack === "orb_spiral") {
        // First orb; more spawn on later ticks
        newProjectiles.push(createProjectile(bPos, SPIRAL_ORDER[0], next.phase));
      }
    }

    // Spiral fires additional orbs on ticks 2, 4, 6
    if (next.currentAttack === "orb_spiral" && next.attackTickCounter > 0 && next.attackTickCounter % 2 === 0) {
      const idx = Math.floor(next.attackTickCounter / 2) % SPIRAL_ORDER.length;
      newProjectiles.push(createProjectile(next.position, SPIRAL_ORDER[idx], next.phase));
    }

    next.attackTickCounter += 1;

    // End attack
    if (next.attackTickCounter >= BOSS_CONFIG.attackDurationTicks) {
      next.currentAttack = "none";
      next.attackTickCounter = 0;
      next.vulnerableUntil = now + BOSS_CONFIG.vulnerabilityMs;
      next.requiredPower = getPhaseVulnerability(next.phase);
      const cooldownMul = next.phase === "phase3" ? 0.6 : 1;
      next.attackCooldownUntil = now + BOSS_CONFIG.vulnerabilityMs + BOSS_CONFIG.attackCooldownMs * cooldownMul;
    }
  }

  // Boss movement: maintain distance from player (only when not attacking/vulnerable)
  if (next.currentAttack === "none" && next.vulnerableUntil <= now) {
    const dist = manhattan(next.position, playerPos);
    let moveDir: Direction | null = null;
    if (dist < 3) {
      moveDir = directionAway(next.position, playerPos);
    } else if (dist > 6) {
      moveDir = directionToward(next.position, playerPos);
    }
    if (moveDir) {
      const delta = directionDelta(moveDir);
      const target = { x: next.position.x + delta.x, y: next.position.y + delta.y };
      if (isWalkable(target, world)) {
        next.position = target;
      }
    }
  }

  return { boss: next, newProjectiles };
}

function createProjectile(origin: Point, dir: Direction, phase: BossPhase): Projectile {
  const delta = directionDelta(dir);
  return {
    id: ++projectileIdCounter,
    position: { x: origin.x + delta.x, y: origin.y + delta.y },
    direction: dir,
    speed: BOSS_CONFIG.orbSpeed,
    tickCounter: 0,
    lifetime: BOSS_CONFIG.orbLifetimeTicks,
    immunePower: phase === "phase3" ? null : (phase === "phase1" ? "fire" : "ice"),
  };
}

export function tickProjectiles(
  projectiles: Projectile[],
  world: { width: number; height: number; walls: Point[] },
  slowActive: boolean,
): Projectile[] {
  const result: Projectile[] = [];
  for (const p of projectiles) {
    const next = { ...p, tickCounter: p.tickCounter + 1 };
    if (next.tickCounter >= next.lifetime) continue;

    const effectiveSpeed = slowActive ? next.speed * 2 : next.speed;
    if (next.tickCounter % effectiveSpeed === 0) {
      const delta = directionDelta(next.direction);
      next.position = { x: next.position.x + delta.x, y: next.position.y + delta.y };
    }

    // Remove if out of bounds or hit wall
    if (
      next.position.x < 0 || next.position.x >= world.width ||
      next.position.y < 0 || next.position.y >= world.height
    ) continue;
    if (world.walls.some((w) => w.x === next.position.x && w.y === next.position.y)) continue;

    result.push(next);
  }
  return result;
}

export function checkBossDamage(
  boss: BossState,
  playerPos: Point,
  activePower: PowerId | null,
  now: number,
): { damaged: boolean; boss: BossState } {
  if (boss.phase === "defeated" || boss.phase === "intro") return { damaged: false, boss };
  if (now < boss.lastDamagedAt + BOSS_CONFIG.bossIframeMs) return { damaged: false, boss };
  if (boss.vulnerableUntil <= now) return { damaged: false, boss };

  const dist = manhattan(boss.position, playerPos);
  if (dist > 1) return { damaged: false, boss };

  // Check required power
  if (boss.requiredPower && activePower !== boss.requiredPower) return { damaged: false, boss };
  if (!activePower) return { damaged: false, boss };

  const next = { ...boss };
  next.health = Math.max(0, next.health - 1);
  next.lastDamagedAt = now;
  next.vulnerableUntil = 0; // End vulnerability after hit

  if (next.health <= 0) {
    next.phase = "defeated";
  }

  return { damaged: true, boss: next };
}

export function detectCombo(
  comboState: ComboState,
  powerId: PowerId,
  now: number,
): { combo: PowerCombo | null; state: ComboState } {
  const activations = [
    ...comboState.lastActivations.filter((a) => now - a.at < COMBO_WINDOW_MS),
    { powerId, at: now },
  ].slice(-2);

  const newState: ComboState = { ...comboState, lastActivations: activations };

  if (activations.length === 2 && activations[0].powerId !== activations[1].powerId) {
    const p1 = activations[0].powerId;
    const p2 = activations[1].powerId;
    const match = POWER_COMBOS.find(
      (c) => (c.powers[0] === p1 && c.powers[1] === p2) || (c.powers[0] === p2 && c.powers[1] === p1),
    );
    if (match) {
      newState.activeComboId = match.id;
      newState.activeUntil = now + match.durationMs;
      newState.lastActivations = [];
      return { combo: match, state: newState };
    }
  }

  return { combo: null, state: newState };
}

export function calculateStars(timeMs: number, damageTaken: number, thresholds: { time3: number; time2: number; maxDamage3: number; maxDamage2: number }): number {
  if (timeMs <= thresholds.time3 && damageTaken <= thresholds.maxDamage3) return 3;
  if (timeMs <= thresholds.time2 && damageTaken <= thresholds.maxDamage2) return 2;
  return 1;
}
