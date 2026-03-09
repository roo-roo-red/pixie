import { Area, Fairy, MinionDefinition, PowerCombo, PowerDefinition, PowerId } from "@/types/game";

export const POWERS: PowerDefinition[] = [
  {
    id: "ice",
    label: "Ice",
    description: "Freeze thorny traps and chill hostile paths.",
    colorClass: "from-cyan-200 to-sky-300",
  },
  {
    id: "fire",
    label: "Fire",
    description: "Light dark passages and scare away minions.",
    colorClass: "from-rose-200 to-orange-300",
  },
  {
    id: "water",
    label: "Water",
    description: "Calm wild rivers and clear misty barriers.",
    colorClass: "from-blue-200 to-indigo-300",
  },
  {
    id: "animalTalk",
    label: "Animal Talk",
    description: "Ask woodland friends for safe routes.",
    colorClass: "from-emerald-200 to-lime-300",
  },
];

export const FAIRIES: Fairy[] = [
  {
    id: "luna",
    name: "Luna Petal",
    title: "Moonlight Scout",
    description: "Quick and curious, Luna reads the stars for hidden trails.",
    colorClass: "from-pink-200 to-fuchsia-200",
  },
  {
    id: "miri",
    name: "Miri Bloom",
    title: "River Whisperer",
    description: "Miri brings calm magic and keeps spirits brave.",
    colorClass: "from-teal-200 to-cyan-200",
  },
  {
    id: "sola",
    name: "Sola Fern",
    title: "Sunbeam Guardian",
    description: "Sola shields friends with warm, glowing charm.",
    colorClass: "from-yellow-200 to-orange-200",
  },
];

export const AREAS: Area[] = [
  {
    id: "flower-forest",
    name: "Flower Forest",
    subtitle: "Area 1",
    description:
      "A cozy meadow maze where thorn-vines and giggling imps block the old bridge.",
    petals: ["ice"],
    obstacles: [
      {
        id: "thorn-gate",
        name: "Frozen Thorn Gate",
        minion: "Bramble Imp",
        requiredPower: "ice",
        description: "Freeze the thorn gate to make a safe opening.",
      },
    ],
  },
  {
    id: "crystal-river",
    name: "Crystal River",
    subtitle: "Area 2",
    description:
      "Shimmering water runs under crystal arches. Witch minions lurk on the banks.",
    petals: ["water", "fire"],
    obstacles: [
      {
        id: "steam-bridge",
        name: "Steam Bridge",
        minion: "Mist Gremlin",
        requiredPower: "water",
        description: "Use water magic to settle the scalding steam.",
      },
      {
        id: "night-lanterns",
        name: "Night Lanterns",
        minion: "Ash Sprite",
        requiredPower: "fire",
        description: "Light the lantern trail before the sprite swarm closes in.",
      },
    ],
  },
  {
    id: "shadow-path",
    name: "Shadow Path",
    subtitle: "Area 3",
    description:
      "A dusky trail where lost creatures can guide you if you earn their trust.",
    petals: ["animalTalk"],
    obstacles: [
      {
        id: "crow-guard",
        name: "Crow Guard",
        minion: "Hex Crow",
        requiredPower: "animalTalk",
        description: "Speak kindly with the crows to reveal a hidden passage.",
      },
    ],
  },
  {
    id: "pixie-land",
    name: "Pixie Land",
    subtitle: "Final Boss",
    description:
      "The witch's fortress. Defeat her to break the curse and restore the realm.",
    petals: [],
    obstacles: [],
  },
];

export const POWER_ORDER: PowerId[] = ["ice", "fire", "water", "animalTalk"];

export const POWER_CONFIG = {
  maxEnergy: 1,
  activeMs: 5000,
  rechargeMs: 10000,
};

// ── Boss config ──

export const BOSS_CONFIG = {
  maxHealth: 8,
  startPosition: { x: 12, y: 7 },
  phase2At: 6,
  phase3At: 3,
  attackDurationTicks: 8,
  vulnerabilityMs: 3000,
  attackCooldownMs: 2000,
  phaseTransitionMs: 2000,
  bossIframeMs: 800,
  introMs: 2500,
  orbLifetimeTicks: 14,
  orbSpeed: 2,
  phaseVulnerability: {
    phase1: "fire" as PowerId,
    phase2: "ice" as PowerId,
    phase3: null as PowerId | null,
  },
};

// ── Power combos ──

export const POWER_COMBOS: PowerCombo[] = [
  {
    id: "steam-burst",
    powers: ["fire", "water"],
    name: "Steam Burst",
    effectType: "burst",
    durationMs: 1500,
  },
  {
    id: "frost-shield",
    powers: ["ice", "water"],
    name: "Frost Shield",
    effectType: "shield",
    durationMs: 3000,
  },
  {
    id: "nature-slow",
    powers: ["animalTalk", "ice"],
    name: "Nature's Grasp",
    effectType: "slow",
    durationMs: 2000,
  },
  {
    id: "phoenix-heal",
    powers: ["fire", "animalTalk"],
    name: "Phoenix Song",
    effectType: "heal",
    durationMs: 1000,
  },
];

export const COMBO_WINDOW_MS = 1200;

// ── Star rating thresholds (per area) ──

export const STAR_THRESHOLDS: Record<string, { time3: number; time2: number; maxDamage3: number; maxDamage2: number }> = {
  "flower-forest": { time3: 30000, time2: 60000, maxDamage3: 0, maxDamage2: 1 },
  "crystal-river": { time3: 45000, time2: 90000, maxDamage3: 0, maxDamage2: 2 },
  "shadow-path":   { time3: 60000, time2: 120000, maxDamage3: 1, maxDamage2: 3 },
  "pixie-land":    { time3: 90000, time2: 180000, maxDamage3: 2, maxDamage2: 5 },
};

// ── Minion definitions per area ──

export const MINIONS: MinionDefinition[] = [
  // Flower Forest — 1 slow linear patroller
  {
    id: "ff-imp-1",
    name: "Bramble Imp",
    areaId: "flower-forest",
    patrolType: "linear",
    speed: 0.4,
    waypoints: [{ x: 3, y: 2 }, { x: 3, y: 8 }],
    requiredPower: "ice",
    stunDurationMs: 4000,
    visualType: "imp",
  },

  // Crystal River — 2 linear patrollers + 1 circular
  {
    id: "cr-imp-1",
    name: "Mist Imp",
    areaId: "crystal-river",
    patrolType: "linear",
    speed: 0.5,
    waypoints: [{ x: 1, y: 3 }, { x: 1, y: 7 }],
    requiredPower: "water",
    stunDurationMs: 3000,
    visualType: "imp",
  },
  {
    id: "cr-imp-2",
    name: "Ash Imp",
    areaId: "crystal-river",
    patrolType: "linear",
    speed: 0.6,
    waypoints: [{ x: 5, y: 0 }, { x: 11, y: 0 }],
    requiredPower: "fire",
    stunDurationMs: 3000,
    visualType: "imp",
  },
  {
    id: "cr-wisp-1",
    name: "River Wisp",
    areaId: "crystal-river",
    patrolType: "circular",
    speed: 0.4,
    waypoints: [
      { x: 8, y: 4 }, { x: 10, y: 4 },
      { x: 10, y: 6 }, { x: 8, y: 6 },
    ],
    requiredPower: "water",
    stunDurationMs: 3000,
    visualType: "wisp",
  },

  // Shadow Path — 1 circular + 1 chase stalker
  {
    id: "sp-wisp-1",
    name: "Shadow Wisp",
    areaId: "shadow-path",
    patrolType: "circular",
    speed: 0.5,
    waypoints: [
      { x: 3, y: 5 }, { x: 4, y: 5 },
      { x: 4, y: 7 }, { x: 3, y: 7 },
    ],
    requiredPower: "animalTalk",
    stunDurationMs: 4000,
    visualType: "wisp",
  },
  {
    id: "sp-stalker-1",
    name: "Hex Stalker",
    areaId: "shadow-path",
    patrolType: "chase",
    speed: 0.7,
    waypoints: [{ x: 7, y: 5 }],
    chaseRange: 5,
    requiredPower: "animalTalk",
    stunDurationMs: 5000,
    visualType: "stalker",
  },

  // Pixie Land — 2 chase stalkers + 1 circular (plus boss)
  {
    id: "pl-stalker-1",
    name: "Witch's Shadow",
    areaId: "pixie-land",
    patrolType: "chase",
    speed: 0.8,
    waypoints: [{ x: 6, y: 4 }],
    chaseRange: 7,
    requiredPower: "fire",
    stunDurationMs: 3000,
    visualType: "stalker",
  },
  {
    id: "pl-stalker-2",
    name: "Dark Shade",
    areaId: "pixie-land",
    patrolType: "chase",
    speed: 0.75,
    waypoints: [{ x: 6, y: 10 }],
    chaseRange: 7,
    requiredPower: "ice",
    stunDurationMs: 3000,
    visualType: "stalker",
  },
  {
    id: "pl-wisp-1",
    name: "Hex Wisp",
    areaId: "pixie-land",
    patrolType: "circular",
    speed: 0.6,
    waypoints: [
      { x: 6, y: 5 }, { x: 8, y: 5 },
      { x: 8, y: 9 }, { x: 6, y: 9 },
    ],
    requiredPower: "water",
    stunDurationMs: 3000,
    visualType: "wisp",
  },
];

export function getMinionsForArea(areaId: string): MinionDefinition[] {
  return MINIONS.filter((m) => m.areaId === areaId);
}
