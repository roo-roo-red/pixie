import { Area, Fairy, MinionDefinition, PowerDefinition, PowerId } from "@/types/game";

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
    subtitle: "Final Goal",
    description:
      "The gates of home shimmer ahead. Break the witch's hold and restore the realm.",
    petals: [],
    obstacles: [],
  },
];

export const POWER_ORDER: PowerId[] = ["ice", "fire", "water", "animalTalk"];

export const POWER_CONFIG = {
  maxEnergy: 1,
  activeMs: 4000,
  rechargeMs: 30000,
};

// ── Minion definitions per area ──

export const MINIONS: MinionDefinition[] = [
  // Flower Forest — 1 slow linear patroller guarding the path
  {
    id: "ff-imp-1",
    name: "Bramble Imp",
    areaId: "flower-forest",
    patrolType: "linear",
    speed: 0.4,
    waypoints: [{ x: 3, y: 2 }, { x: 3, y: 6 }],
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
    waypoints: [{ x: 1, y: 3 }, { x: 1, y: 5 }],
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
    waypoints: [{ x: 4, y: 1 }, { x: 7, y: 1 }],
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
      { x: 4, y: 3 }, { x: 6, y: 3 },
      { x: 6, y: 5 }, { x: 4, y: 5 },
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
      { x: 3, y: 3 }, { x: 4, y: 3 },
      { x: 4, y: 5 }, { x: 3, y: 5 },
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
    waypoints: [{ x: 6, y: 2 }],
    chaseRange: 4,
    requiredPower: "animalTalk",
    stunDurationMs: 5000,
    visualType: "stalker",
  },

  // Pixie Land — 2 chase stalkers + 1 fast circular
  {
    id: "pl-stalker-1",
    name: "Witch's Shadow",
    areaId: "pixie-land",
    patrolType: "chase",
    speed: 0.8,
    waypoints: [{ x: 5, y: 2 }],
    chaseRange: 5,
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
    waypoints: [{ x: 5, y: 6 }],
    chaseRange: 4,
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
      { x: 4, y: 3 }, { x: 5, y: 3 },
      { x: 5, y: 5 }, { x: 4, y: 5 },
    ],
    requiredPower: "water",
    stunDurationMs: 3000,
    visualType: "wisp",
  },
];

export function getMinionsForArea(areaId: string): MinionDefinition[] {
  return MINIONS.filter((m) => m.areaId === areaId);
}
