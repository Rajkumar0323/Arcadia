# Arcadia — Frontend

The Arcadia web app: a gamified learning platform where students join clubs, play mini-games,
climb seasonal leaderboards and win course discounts.

Built with Next.js 14 (App Router), TypeScript and Tailwind CSS. It is an installable PWA that
talks to the Arcadia Express API over REST.

## What students can do

- **Clubs** – browse, search and join clubs, each with its own arcade, quests and leaderboard
- **Games** – six game types: Quiz, Swipe True/False, Memory Match, Word Scramble, Sequence and
  Fill the Blank, with timers, speed bonuses and an answer review
- **Quests** – complete bundles of games for bonus points
- **Leaderboards** – per-club seasonal and all-time rankings
- **Rewards** – scratch cards and season passes, redeemable for course discounts
- **Profile** – level, XP and play history

## Admin panel

Dashboard with activity charts, plus management of clubs, games (with a content editor for every
game type), quests, seasons and reward tiers, rewards, courses and users.

## Tech stack

| Area | Library |
|---|---|
| Framework | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS |
| Auth | Clerk |
| Data fetching | SWR |
| Animation | Framer Motion, canvas-confetti |
| Charts | Recharts |
| Icons / toasts | Lucide, Sonner |

## Running locally

```bash
cp .env.example .env   # add your Clerk keys and API URL
npm install
npm run dev            # http://localhost:3000
```

The API must be running too, by default on `http://localhost:4000` (set `NEXT_PUBLIC_API_URL`
to change it).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run typecheck` | Type-check without emitting |
