export type Screen = "landing" | "select" | "playing" | "win" | "lose";

export type PowerId = "ice" | "fire" | "water" | "animalTalk";

export type AreaId = "flower-forest" | "crystal-river" | "shadow-path" | "pixie-land";
export type Direction = "up" | "down" | "left" | "right";

export interface Point {
  x: number;
  y: number;
}

export interface Fairy {
  id: string;
  name: string;
  title: string;
  description: string;
  colorClass: string;
}

export interface PowerDefinition {
  id: PowerId;
  label: string;
  description: string;
  colorClass: string;
}

export interface Obstacle {
  id: string;
  name: string;
  minion: string;
  requiredPower: PowerId;
  description: string;
}

export interface Area {
  id: AreaId;
  name: string;
  subtitle: string;
  description: string;
  petals: PowerId[];
  obstacles: Obstacle[];
}

export interface PowerState {
  energy: number;
  maxEnergy: number;
  activeUntil: number | null;
  rechargeUntil: number | null;
}

export interface AreaWorld {
  width: number;
  height: number;
  start: Point;
  backEntry?: Point;
  exit?: Point;
  goal?: Point;
  walls: Point[];
  hazards: HazardTile[];
  healthPickups: Point[];
  petalNodes: Record<PowerId, Point | null>;
  obstacleNodes: Record<string, Point | null>;
}

export interface GameEvent {
  id: number;
  type: "damage" | "collect" | "clear" | "area" | "power" | "boss_hit" | "combo" | "boss_phase" | "heal";
  text: string;
  color: string;
  timestamp: number;
}

// ── Environmental hazards ──

export type HazardType = "lava" | "poison" | "thorns" | "spikes";

export interface HazardTile {
  position: Point;
  type: HazardType;
  immunePower: PowerId;
  cycleSec?: number;
  phaseOffset?: number;
}

// ── Minion system ──

export type PatrolType = "linear" | "circular" | "chase";

export interface MinionDefinition {
  id: string;
  name: string;
  areaId: AreaId;
  patrolType: PatrolType;
  speed: number;
  waypoints: Point[];
  chaseRange?: number;
  requiredPower?: PowerId;
  stunDurationMs?: number;
  visualType: "imp" | "golem" | "wisp" | "stalker";
}

export interface MinionState {
  id: string;
  position: Point;
  waypointIndex: number;
  direction: 1 | -1;
  isChasing: boolean;
  stunnedUntil: number;
  defeated: boolean;
  lastMoveAt: number;
  despawnAt?: number;
}

// ── Boss fight system ──

export type BossPhase = "intro" | "phase1" | "phase2" | "phase3" | "defeated";

export type BossAttackPattern = "orb_line" | "orb_cross" | "orb_spiral" | "summon" | "none";

export interface BossState {
  health: number;
  maxHealth: number;
  position: Point;
  phase: BossPhase;
  currentAttack: BossAttackPattern;
  attackTickCounter: number;
  attackCooldownUntil: number;
  vulnerableUntil: number;
  requiredPower: PowerId | null;
  lastDamagedAt: number;
  phaseTransitionUntil: number;
  introUntil: number;
}

export interface Projectile {
  id: number;
  position: Point;
  direction: Direction;
  speed: number;
  tickCounter: number;
  lifetime: number;
  immunePower: PowerId | null;
}

// ── Power combo system ──

export interface PowerCombo {
  id: string;
  powers: [PowerId, PowerId];
  name: string;
  effectType: "shield" | "burst" | "slow" | "heal";
  durationMs: number;
}

export interface ComboState {
  activeComboId: string | null;
  activeUntil: number;
  lastActivations: { powerId: PowerId; at: number }[];
}

// ── Score / star rating ──

export interface AreaScore {
  timeMs: number;
  damageTaken: number;
  stars: number;
}
