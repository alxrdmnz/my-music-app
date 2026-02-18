# TempoFlow

**TempoFlow** is a Next.js app that builds Spotify playlists from your favorite artists and tracks. Sign in with Spotify (OAuth PKCE), add 1–5 artist or track seeds, get a generated track list, and save it as a private playlist to your account.

## Features

- **Spotify sign-in** — Authorization Code + PKCE (no NextAuth). Session stored in an httpOnly cookie.
- **Seed-based playlists** — Search for artists or tracks and add 1–5 as seeds. The app fetches related tracks via Spotify Search (by artist name) and Get Track (for track seeds).
- **Get playlist** — Build a list of tracks from your seeds; view title, artists, and duration.
- **Save to Spotify** — Create a private playlist with a custom name and add all generated tracks.

## Run locally

```bash
pnpm install
pnpm run dev
```

Open **http://127.0.0.1:3000** (use `127.0.0.1`, not `localhost`).

## Setup

1. Copy `.env.example` to `.env.local` and set:
   - `SPOTIFY_CLIENT_ID`
   - `SPOTIFY_CLIENT_SECRET`  

   Create an app and get these from the [Spotify Dashboard](https://developer.spotify.com/dashboard).

2. In Spotify Dashboard → your app → **Redirect URIs**, add exactly:
   ```text
   http://127.0.0.1:3000/api/spotify/callback
   ```

3. Restart the dev server after changing `.env.local`.

**Note:** If "Save to Spotify" fails with a permission error, sign out and sign in again so the app can request playlist permissions.

## Scripts

| Command           | Description                  |
|------------------|------------------------------|
| `pnpm run dev`   | Start dev server (port 3000) |
| `pnpm run build` | Production build             |
| `pnpm run start` | Start production server      |
| `pnpm run clean` | Delete `.next` cache         |
