import { AreaId, AreaWorld } from "@/types/game";

const emptyObstacleNodes = {
  "thorn-gate": null,
  "steam-bridge": null,
  "night-lanterns": null,
  "crow-guard": null,
};

export const WORLD_MAP: Record<AreaId, AreaWorld> = {
  // ── Flower Forest 10×10 ──
  "flower-forest": {
    width: 10,
    height: 10,
    start: { x: 0, y: 5 },
    exit: { x: 9, y: 5 },
    walls: [
      { x: 2, y: 1 }, { x: 3, y: 1 }, { x: 6, y: 1 }, { x: 7, y: 1 },
      { x: 2, y: 2 }, { x: 5, y: 2 }, { x: 7, y: 2 },
      { x: 4, y: 3 }, { x: 5, y: 3 },
      { x: 2, y: 4 }, { x: 7, y: 4 }, { x: 8, y: 4 },
      { x: 4, y: 5 }, { x: 5, y: 5 },
      { x: 2, y: 6 }, { x: 3, y: 6 }, { x: 7, y: 6 },
      { x: 5, y: 7 }, { x: 6, y: 7 },
      { x: 2, y: 8 }, { x: 8, y: 8 },
    ],
    hazards: [
      { position: { x: 1, y: 1 }, type: "thorns", immunePower: "ice" },
      { position: { x: 4, y: 6 }, type: "thorns", immunePower: "ice" },
      { position: { x: 6, y: 4 }, type: "thorns", immunePower: "ice" },
    ],
    healthPickups: [
      { x: 8, y: 0 },
    ],
    petalNodes: {
      ice: { x: 1, y: 2 },
      fire: null,
      water: null,
      animalTalk: null,
    },
    obstacleNodes: {
      ...emptyObstacleNodes,
      "thorn-gate": { x: 6, y: 5 },
    },
  },

  // ── Crystal River 12×10 ──
  "crystal-river": {
    width: 12,
    height: 10,
    start: { x: 0, y: 4 },
    backEntry: { x: 0, y: 5 },
    exit: { x: 11, y: 5 },
    walls: [
      { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 3, y: 1 }, { x: 3, y: 2 },
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 },
      { x: 6, y: 4 }, { x: 6, y: 5 }, { x: 6, y: 6 }, { x: 7, y: 4 }, { x: 7, y: 6 },
      { x: 9, y: 1 }, { x: 9, y: 2 }, { x: 9, y: 7 }, { x: 9, y: 8 },
      { x: 3, y: 8 }, { x: 4, y: 8 },
    ],
    hazards: [
      // North lava path
      { position: { x: 6, y: 1 }, type: "lava", immunePower: "water" },
      { position: { x: 6, y: 2 }, type: "lava", immunePower: "water" },
      { position: { x: 7, y: 1 }, type: "lava", immunePower: "water" },
      // Bridge crossing
      { position: { x: 7, y: 5 }, type: "lava", immunePower: "water" },
      // Cycling steam vents
      { position: { x: 8, y: 3 }, type: "lava", immunePower: "fire", cycleSec: 3, phaseOffset: 0 },
      { position: { x: 8, y: 7 }, type: "lava", immunePower: "fire", cycleSec: 3, phaseOffset: 0.5 },
    ],
    healthPickups: [
      { x: 1, y: 1 },
      { x: 11, y: 9 },
    ],
    petalNodes: {
      ice: null,
      fire: { x: 1, y: 8 },
      water: { x: 8, y: 1 },
      animalTalk: null,
    },
    obstacleNodes: {
      ...emptyObstacleNodes,
      "steam-bridge": { x: 4, y: 5 },
      "night-lanterns": { x: 10, y: 5 },
    },
  },

  // ── Shadow Path 10×12 ──
  "shadow-path": {
    width: 10,
    height: 12,
    start: { x: 0, y: 1 },
    backEntry: { x: 0, y: 0 },
    exit: { x: 9, y: 11 },
    walls: [
      { x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 },
      { x: 4, y: 1 }, { x: 4, y: 2 },
      { x: 6, y: 0 }, { x: 6, y: 1 }, { x: 6, y: 2 },
      { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 },
      { x: 5, y: 4 }, { x: 6, y: 4 },
      { x: 8, y: 3 }, { x: 8, y: 4 },
      { x: 2, y: 6 }, { x: 3, y: 6 },
      { x: 5, y: 6 }, { x: 5, y: 7 },
      { x: 7, y: 6 }, { x: 7, y: 7 },
      { x: 1, y: 8 }, { x: 2, y: 8 },
      { x: 4, y: 8 }, { x: 4, y: 9 },
      { x: 6, y: 9 }, { x: 6, y: 10 }, { x: 6, y: 11 },
      { x: 9, y: 9 },
    ],
    hazards: [
      { position: { x: 3, y: 3 }, type: "poison", immunePower: "animalTalk" },
      { position: { x: 4, y: 5 }, type: "poison", immunePower: "animalTalk" },
      { position: { x: 5, y: 0 }, type: "poison", immunePower: "animalTalk" },
      { position: { x: 9, y: 5 }, type: "poison", immunePower: "animalTalk" },
      { position: { x: 3, y: 9 }, type: "poison", immunePower: "animalTalk" },
      { position: { x: 8, y: 7 }, type: "poison", immunePower: "animalTalk" },
    ],
    healthPickups: [
      { x: 8, y: 11 },
      { x: 0, y: 11 },
    ],
    petalNodes: {
      ice: null,
      fire: null,
      water: null,
      animalTalk: { x: 3, y: 2 },
    },
    obstacleNodes: {
      ...emptyObstacleNodes,
      "crow-guard": { x: 5, y: 8 },
    },
  },

  // ── Pixie Land 14×14 (Boss Arena) ──
  "pixie-land": {
    width: 14,
    height: 14,
    start: { x: 1, y: 7 },
    backEntry: { x: 0, y: 7 },
    // goal removed — win by defeating boss
    walls: [
      // Outer pillars
      { x: 3, y: 2 }, { x: 3, y: 3 },
      { x: 10, y: 2 }, { x: 10, y: 3 },
      { x: 3, y: 10 }, { x: 3, y: 11 },
      { x: 10, y: 10 }, { x: 10, y: 11 },
      // Inner ring pillars
      { x: 5, y: 5 }, { x: 5, y: 6 },
      { x: 5, y: 8 }, { x: 5, y: 9 },
      { x: 8, y: 5 }, { x: 8, y: 6 },
      { x: 8, y: 8 }, { x: 8, y: 9 },
      // Center barriers
      { x: 6, y: 3 }, { x: 7, y: 3 },
      { x: 6, y: 11 }, { x: 7, y: 11 },
      // Exit corridor gates
      { x: 11, y: 5 }, { x: 11, y: 6 },
      { x: 11, y: 8 }, { x: 11, y: 9 },
    ],
    hazards: [
      // Spike gauntlet
      { position: { x: 9, y: 6 }, type: "spikes", immunePower: "ice", cycleSec: 2, phaseOffset: 0 },
      { position: { x: 9, y: 7 }, type: "spikes", immunePower: "ice", cycleSec: 2, phaseOffset: 0.5 },
      { position: { x: 9, y: 8 }, type: "spikes", immunePower: "ice", cycleSec: 2, phaseOffset: 0 },
      { position: { x: 10, y: 6 }, type: "spikes", immunePower: "fire", cycleSec: 2.5, phaseOffset: 0.25 },
      { position: { x: 10, y: 7 }, type: "spikes", immunePower: "fire", cycleSec: 2.5, phaseOffset: 0.75 },
      { position: { x: 10, y: 8 }, type: "spikes", immunePower: "fire", cycleSec: 2.5, phaseOffset: 0.25 },
      // Center corridor traps
      { position: { x: 6, y: 7 }, type: "spikes", immunePower: "water", cycleSec: 3, phaseOffset: 0 },
      { position: { x: 7, y: 7 }, type: "spikes", immunePower: "water", cycleSec: 3, phaseOffset: 0.5 },
    ],
    healthPickups: [
      { x: 0, y: 0 },
      { x: 13, y: 0 },
      { x: 0, y: 13 },
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
