# TempoFlow

**TempoFlow** is a responsive Next.js app that generates Spotify playlists based on BPM-mapped workout curves. You choose duration, activity type, and progression; the app builds a playlist where each track’s tempo follows your chosen intensity curve.

## Overview

- **Spotify integration** — Sign in with Spotify (NextAuth), then generate playlists using Spotify’s recommendation API with `target_tempo`, `min_tempo`, and `max_tempo` so each slot matches the curve.
- **Activity types** — Yoga (60–90 BPM), Low intensity (100–120 BPM), High intensity (130–170 BPM).
- **Progressions** — **Linear ramp** (BPM increases steadily over the session) or **HIIT intervals** (alternating high and rest BPM).
- **Seeds** — Pick 1–3 artists or tracks; recommendations stay in that style while following the BPM curve.
- **Curve visualizer** — Framer Motion SVG that updates as you change duration, activity, and progression (linear vs intervals).
- **Crossfade preview** — Use the Spotify Web Playback SDK to preview transitions between two tracks (last 10 seconds of one, crossfade into the next).
- **Save to Spotify** — Create a private playlist and add the generated tracks with one click.
- **Failed matches** — If a slot has no strict BPM match, the app widens the tempo range and prioritizes genre/artist so you still get a full playlist.

Built with Next.js 15 (App Router), dark glassmorphism UI, mobile-first layout, and Shadcn-style drawers. Requires a Spotify Premium account for playback preview.

---

## Run locally

**With npm** (Node.js built-in):

```bash
npm install
npm run dev
```

Open [http://127.0.0.1:3000](http://127.0.0.1:3000).

**With pnpm** (if installed):

```bash
pnpm install
pnpm dev
```

## Setup

1. Copy `.env.example` to `.env.local` and fill in:
   - `SPOTIFY_CLIENT_ID` / `SPOTIFY_CLIENT_SECRET` from [Spotify Dashboard](https://developer.spotify.com/dashboard)
   - `AUTH_SECRET` or `NEXTAUTH_SECRET` (run `openssl rand -base64 32`)
   - `NEXTAUTH_URL=http://127.0.0.1:3000`
2. In Spotify Dashboard → your app → Redirect URIs, add:  
   `http://127.0.0.1:3000/api/auth/callback/spotify`

## Scripts

| Command         | Description                  |
|-----------------|------------------------------|
| `npm run dev`   | Start dev server (port 3000) |
| `npm run build` | Production build             |
| `npm run start` | Start production server     |
| `npm run clean` | Delete `.next` cache         |
