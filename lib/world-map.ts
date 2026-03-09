import { AreaId, AreaWorld, HazardTile } from "@/types/game";

const emptyObstacleNodes = {
  "thorn-gate": null,
  "steam-bridge": null,
  "night-lanterns": null,
  "crow-guard": null,
};

export const WORLD_MAP: Record<AreaId, AreaWorld> = {
  "flower-forest": {
    width: 8,
    height: 8,
    start: { x: 0, y: 4 },
    exit: { x: 7, y: 4 },
    walls: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
      { x: 4, y: 5 },
      { x: 4, y: 6 },
      { x: 5, y: 1 },
    ],
    hazards: [
      // Thorny patches blocking the shortcut route
      { position: { x: 3, y: 3 }, type: "thorns", immunePower: "ice" },
      { position: { x: 3, y: 5 }, type: "thorns", immunePower: "ice" },
    ],
    petalNodes: {
      ice: { x: 1, y: 1 },
      fire: null,
      water: null,
      animalTalk: null,
    },
    obstacleNodes: {
      ...emptyObstacleNodes,
      "thorn-gate": { x: 4, y: 4 },
    },
  },
  "crystal-river": {
    width: 8,
    height: 8,
    start: { x: 0, y: 3 },
    backEntry: { x: 0, y: 4 },
    exit: { x: 7, y: 4 },
    walls: [
      { x: 3, y: 0 },
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 5, y: 6 },
      { x: 6, y: 6 },
    ],
    hazards: [
      // Lava vents along the river — need water power to cross safely
      { position: { x: 4, y: 3 }, type: "lava", immunePower: "water" },
      { position: { x: 4, y: 4 }, type: "lava", immunePower: "water" },
      { position: { x: 4, y: 5 }, type: "lava", immunePower: "water" },
      // Steam vent that cycles on/off
      { position: { x: 6, y: 3 }, type: "lava", immunePower: "fire", cycleSec: 3, phaseOffset: 0 },
      { position: { x: 6, y: 5 }, type: "lava", immunePower: "fire", cycleSec: 3, phaseOffset: 0.5 },
    ],
    petalNodes: {
      ice: null,
      fire: { x: 1, y: 6 },
      water: { x: 5, y: 1 },
      animalTalk: null,
    },
    obstacleNodes: {
      ...emptyObstacleNodes,
      "steam-bridge": { x: 2, y: 4 },
      "night-lanterns": { x: 5, y: 4 },
    },
  },
  "shadow-path": {
    width: 8,
    height: 8,
    start: { x: 0, y: 4 },
    backEntry: { x: 0, y: 3 },
    exit: { x: 7, y: 4 },
    walls: [
      { x: 2, y: 2 },
      { x: 2, y: 5 },
      { x: 5, y: 2 },
      { x: 5, y: 5 },
    ],
    hazards: [
      // Poison fog patches — need animalTalk to sense safe path
      { position: { x: 3, y: 3 }, type: "poison", immunePower: "animalTalk" },
      { position: { x: 3, y: 4 }, type: "poison", immunePower: "animalTalk" },
      { position: { x: 4, y: 3 }, type: "poison", immunePower: "animalTalk" },
      { position: { x: 6, y: 3 }, type: "poison", immunePower: "animalTalk" },
      { position: { x: 6, y: 5 }, type: "poison", immunePower: "animalTalk" },
    ],
    petalNodes: {
      ice: null,
      fire: null,
      water: null,
      animalTalk: { x: 3, y: 1 },
    },
    obstacleNodes: {
      ...emptyObstacleNodes,
      "crow-guard": { x: 4, y: 4 },
    },
  },
  "pixie-land": {
    width: 8,
    height: 8,
    start: { x: 1, y: 4 },
    backEntry: { x: 0, y: 4 },
    goal: { x: 6, y: 4 },
    walls: [
      { x: 3, y: 1 },
      { x: 3, y: 2 },
      { x: 3, y: 5 },
      { x: 3, y: 6 },
    ],
    hazards: [
      // Spike corridor — timed traps that cycle, must time your run
      { position: { x: 4, y: 3 }, type: "spikes", immunePower: "ice", cycleSec: 2, phaseOffset: 0 },
      { position: { x: 4, y: 4 }, type: "spikes", immunePower: "ice", cycleSec: 2, phaseOffset: 0.5 },
      { position: { x: 4, y: 5 }, type: "spikes", immunePower: "ice", cycleSec: 2, phaseOffset: 0 },
      { position: { x: 5, y: 3 }, type: "spikes", immunePower: "fire", cycleSec: 2.5, phaseOffset: 0.25 },
      { position: { x: 5, y: 4 }, type: "spikes", immunePower: "fire", cycleSec: 2.5, phaseOffset: 0.75 },
      { position: { x: 5, y: 5 }, type: "spikes", immunePower: "fire", cycleSec: 2.5, phaseOffset: 0.25 },
    ],
    petalNodes: {
      ice: null,
      fire: null,
      water: null,
      animalTalk: null,
    },
    obstacleNodes: {
      ...emptyObstacleNodes,
    },
  },
};
