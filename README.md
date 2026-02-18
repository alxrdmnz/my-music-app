# TempoFlow

BPM-mapped workout playlists for Spotify.

## Push to your GitHub

1. **Create a new repo** at [github.com/new](https://github.com/new):
   - Owner: **alxrdmnz**
   - Repository name: **tempoflow** (or `my-music-app`)
   - Public, no README/license (this project has them).

2. **In your project folder**, set Git user (once per machine if not set):
   ```bash
   git config user.name "alxrdmnz"
   git config user.email "alxrdmnz@users.noreply.github.com"
   ```

3. **Commit and push:**
   ```bash
   cd /Users/alex/my-music-app
   git add -A
   git commit -m "TempoFlow: BPM workout playlists with Spotify"
   git remote add origin https://github.com/alxrdmnz/tempoflow.git
   git branch -M main
   git push -u origin main
   ```
   (If you named the repo something else, use that instead of `tempoflow` in the `git remote add` and URL.)

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

| Command        | Description                    |
|----------------|--------------------------------|
| `npm run dev`  | Start dev server (port 3000)   |
| `npm run build`| Production build               |
| `npm run start`| Start production server        |
| `npm run clean`| Delete `.next` cache           |
