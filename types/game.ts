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
  petalNodes: Record<PowerId, Point | null>;
  obstacleNodes: Record<string, Point | null>;
}

export interface GameEvent {
  id: number;
  type: "damage" | "collect" | "clear" | "area" | "power";
  text: string;
  color: string;
  timestamp: number;
}
