import { AreaId, AreaWorld } from "@/types/game";

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
