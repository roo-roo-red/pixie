import { Area, Fairy, PowerDefinition, PowerId } from "@/types/game";

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
  maxEnergy: 2,
  activeMs: 9000,
  rechargeMs: 75000,
};
