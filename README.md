# Pixie

Pixie is a cute fantasy 2D browser game prototype built with Next.js, TypeScript, and Tailwind CSS.

In version 1, the player:
- picks one of 3 fairies,
- explores 3 adventure areas,
- collects 4 magical petals (Ice, Fire, Water, Animal Talk),
- manages limited petal energy and recharge,
- clears witch minion obstacles,
- reaches Pixie Land to win.

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS v4
- React state + reusable components

## Project Structure

```text
app/
  globals.css
  layout.tsx
  page.tsx
components/
  game/
    AreaMap.tsx
    FairySelection.tsx
    GameplayScreen.tsx
    LandingScreen.tsx
    PowerPanel.tsx
    WinScreen.tsx
lib/
  game-data.ts
types/
  game.ts
```

## Run Locally

1. Install dependencies:

```bash
npm install
```

2. Start the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000).

## Production Commands

Build for production:

```bash
npm run build
```

Run production server locally:

```bash
npm run start
```

Lint:

```bash
npm run lint
```

## Push to GitHub

1. Create a new empty GitHub repo named `pixie`.
2. In this project directory, run:

```bash
git add .
git commit -m "feat: bootstrap pixie v1 playable adventure"
git branch -M main
git remote add origin https://github.com/<your-username>/pixie.git
git push -u origin main
```

If a remote already exists, update it instead:

```bash
git remote set-url origin https://github.com/<your-username>/pixie.git
```

## Deploy on Vercel

### Option A: Vercel Dashboard (recommended)

1. Push the repo to GitHub.
2. In Vercel, click **Add New Project**.
3. Import the `pixie` repository.
4. Keep default framework settings (Next.js).
5. Click **Deploy**.

### Option B: Vercel CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts to link or create a Vercel project.

## Expansion Notes

The game is intentionally organized for easy extension:
- add new areas in `lib/game-data.ts`,
- add new powers in `types/game.ts` + `lib/game-data.ts`,
- keep gameplay rules centralized in `app/page.tsx`.
