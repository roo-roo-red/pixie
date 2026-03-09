# Pixie - AI Agent Context

A fairy adventure game where players guide a fairy through four themed areas, collecting power petals, dodging autonomous minions, and clearing obstacles to reach Pixie Land.

**Live site:** https://roo-roo-red.github.io/pixie/
**Repo:** https://github.com/roo-roo-red/pixie

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, static export) |
| Rendering | React Three Fiber + drei + postprocessing (Bloom) |
| Styling | Tailwind CSS v4, custom CSS animations |
| Audio | Web Audio API (programmatic, no audio files) |
| Types | TypeScript (strict) |
| Deployment | GitHub Pages via GitHub Actions |
| Package manager | npm |

### Build & Deploy

- `npm run dev` — local dev server
- `npm run build` — static export to `out/`
- Deployed automatically on push to `main` via `.github/workflows/deploy.yml`
- **Important:** `next.config.ts` uses `output: "export"` and `basePath: "/pixie"` — all asset paths must work under `/pixie/`
- No server-side features (no API routes, no SSR, no ISR)

---

## Project Structure

```
app/
  page.tsx            # Main game controller — state machine, game tick loop, all game logic
  layout.tsx          # Root layout (minimal)
  globals.css         # Dark neon theme, glass-panel, all CSS animations

components/game/
  World3D.tsx         # 3D scene — tiles, walls, fairy, minions, portals, particles, camera
  GameplayScreen.tsx  # HUD overlay — hearts, petals, area name, power bar, dash, d-pad, toast
  PowerPanel.tsx      # Compact circular power icons with SVG cooldown rings
  LandingScreen.tsx   # 3D animated title screen with floating orbs
  FairySelection.tsx  # Fairy picker with 3D preview orbs
  WinScreen.tsx       # Victory screen with confetti particles
  LoseScreen.tsx      # Defeat screen with ember particles
  AreaMap.tsx          # (Legacy/unused — 2D map, superseded by World3D)

lib/
  game-data.ts        # Static game data: FAIRIES, POWERS, AREAS, MINIONS, POWER_CONFIG
  world-map.ts        # Grid layouts for all 4 areas (8×8 grids), wall positions, nodes
  sounds.ts           # Programmatic Web Audio API sound effects (no files needed)

types/
  game.ts             # All TypeScript types and interfaces
```

---

## Architecture Overview

### Game State Machine (`app/page.tsx`)

The game uses a screen-based state machine: `landing → select → playing → win/lose`

All game state lives in the root `Home` component via `useState`. A **150ms game tick loop** (`setInterval`) drives real-time updates (minion movement, collision checks, power timers). The tick uses `useRef` mirrors of state to avoid stale closures:

```
screenRef, areaIndexRef, playerPosRef, nextDamageAtRef,
playerHealthRef, minionStatesRef, powersRef, activePowerRef
```

**Key pattern:** When updating state inside the tick, always update both the React state (`setState`) AND the ref (`ref.current = value`) in the same place.

### Movement System

- Grid-based (8×8 per area), one tile per move
- Keyboard: Arrow keys or WASD + Space for dash
- Mobile: On-screen d-pad (visible below `sm` breakpoint)
- Dash: 2 tiles in last move direction, 5s cooldown
- Collision: walls block, obstacles block unless correct power active, minions damage unless stunned

### Power System

- 4 powers: Ice, Fire, Water, AnimalTalk
- Collected as petals in specific areas
- **1 charge**, **4s active window**, **30s recharge** (`POWER_CONFIG`)
- Activating a power starts a 4s timer; walk through matching obstacles/minions to clear/stun them
- After use, must manually start recharge (30s countdown)

### Minion System

Defined in `lib/game-data.ts` → `MINIONS` array. Each area has 1-3 minions.

**Patrol types:**
- `linear` — bounces between 2 waypoints
- `circular` — loops through waypoint ring
- `chase` — idle at home, greedy manhattan pathfinding toward player when in range

**States:** `position`, `waypointIndex`, `direction`, `isChasing`, `stunnedUntil`, `defeated`, `lastMoveAt`

**Collision rules:**
- Minion touches player → player takes 1 damage, respawns at area start
- Player has matching power active → minion is stunned instead
- Hit cooldown: 1.5s between damage instances

### 3D Rendering (`World3D.tsx`)

- Each area has a theme (colors, fog, sparkles, wall decoration style)
- `toWorld(point, width, height)` converts grid coords to 3D positions
- Player is a `FairyOrb` (sphere + wings + trail + sparkles)
- Minions: `MinionMesh` component with 3 visual types (imp=cone, wisp=sphere, stalker=capsule)
- Position lerping for smooth movement (0.15-0.2 lerp factor)
- `FollowCamera` with damage shake and dash zoom
- Bloom postprocessing on all emissive materials (`toneMapped={false}` required for glow)

### Environmental Hazards

Defined in `lib/world-map.ts` as `hazards: HazardTile[]` on each area. Types:
- **lava** — glowing orange pools (Crystal River)
- **poison** — green fog clouds (Shadow Path)
- **thorns** — brown spike clusters (Flower Forest)
- **spikes** — metal spike grids (Pixie Land)

Each hazard has an `immunePower` — if that power is active, the player passes safely. Hazards can optionally cycle on/off via `cycleSec` and `phaseOffset` (phase 0-0.5 = active, 0.5-1 = safe). Timed hazards are checked both in the 150ms tick loop and on player move.

### Area Progression

4 areas in order:
1. **Flower Forest** — 1 obstacle (ice), 1 imp minion, 2 thorn hazards
2. **Crystal River** — 2 obstacles (water, fire), 3 minions, 5 lava hazards (2 cycling)
3. **Shadow Path** — 1 obstacle (animalTalk), 2 minions, 5 poison hazards
4. **Pixie Land** — no obstacles, 3 minions (2 chase stalkers), 6 cycling spike hazards, reach the goal to win

Area transitions happen at portal tiles (`exit`/`backEntry`). All obstacles must be cleared before using exit. Pixie Land requires all 4 petals.

---

## Styling Conventions

- **Dark neon theme** — CSS variables: `--neon-pink`, `--neon-purple`, `--neon-blue`, `--neon-green`, `--neon-gold`
- **Glass panels** — `.glass-panel` class: blurred semi-transparent backgrounds for HUD elements
- **Animations** — defined as `@keyframes` in `globals.css`, applied via `.animate-*` utility classes
- **Fonts** — headings/buttons: "Marker Felt" / "Comic Sans MS" fallback (playful); body: "Trebuchet MS"
- **No images** — all visuals are 3D meshes, CSS, or programmatic

---

## Important Patterns

### Adding a new minion
1. Add `MinionDefinition` entry to `MINIONS` array in `lib/game-data.ts`
2. Choose `visualType`: `"imp"` | `"wisp"` | `"stalker"` | `"golem"` (golem mesh = same as imp currently)
3. Place waypoints on walkable tiles in the corresponding area's grid (`lib/world-map.ts`)
4. Minion rendering is automatic via `MinionMesh` in `World3D.tsx`

### Adding a new area
1. Add `Area` entry to `AREAS` in `lib/game-data.ts`
2. Add grid layout to `WORLD_MAP` in `lib/world-map.ts` (8×8 convention)
3. Add theme to `AREA_THEMES` in `World3D.tsx`
4. Add area-specific particles to `AreaParticles` component
5. Add minion definitions to `MINIONS` array

### Adding a new power
1. Add to `PowerId` union type in `types/game.ts`
2. Add `PowerDefinition` to `POWERS` in `lib/game-data.ts`
3. Add to `POWER_ORDER` array
4. Add initial state key in `createInitialPowers()`
5. Update `PetalCounter` in `GameplayScreen.tsx`

### Sound effects
All sounds are in `lib/sounds.ts` using the Web Audio API `OscillatorNode` pattern. No audio files — everything is synthesized at runtime.

---

## Common Gotchas

- **Stale closures in tick loop:** The 150ms `setInterval` captures closure variables. Always read from `useRef` inside the tick, not from state directly. After any `setState`, also update the corresponding `ref.current`.
- **Static export constraints:** No `getServerSideProps`, no API routes, no dynamic routes without `generateStaticParams`. All pages must be statically exportable.
- **basePath `/pixie`:** All internal links and asset references must account for this. Next.js handles it automatically for `<Link>` and `next/image`, but manual paths need the prefix.
- **Bloom glow:** Materials that should glow need `emissive`, `emissiveIntensity > 0`, and `toneMapped={false}`.
- **Three.js in Next.js:** All 3D components must be in `"use client"` files. The `<Canvas>` cannot be server-rendered.
- **Grid coordinate system:** `(0,0)` is top-left. `y` increases downward. `toWorld()` centers the grid at origin for 3D rendering.
- **Wall decorations bug:** `WallDecoration` receives world-space position but is already inside a positioned `<group>` — the position prop to the decoration components is additive. This is the current behavior and changing it would shift all decorations.

---

## Collaborators

- **roo-roo-red** — repo owner (daughter)
- **kehaugen** — collaborator (dad)
