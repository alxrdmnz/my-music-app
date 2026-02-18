import { cookies } from "next/headers";
import { Header } from "@/components/header";
import { TempoBuilder } from "@/components/tempo-builder";

async function getProfile() {
  const token = (await cookies()).get("spotify_token")?.value;
  if (!token) return null;
  const res = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{
    display_name: string;
    email?: string;
    images?: { url: string }[];
  }>;
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const profile = await getProfile();
  const params = await searchParams;
  const error = params?.error;

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0a]">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900/50 p-8">
          <h1 className="text-xl font-bold text-white mb-4">TempoFlow</h1>
          <p className="text-white/60 text-sm mb-4">
            Generate Spotify playlists that follow your workout’s BPM curve.
          </p>
          {error && (
            <p className="mb-4 text-sm text-amber-300">
              Error:{" "}
              {error === "no_code"
                ? "No code from Spotify"
                : error === "no_verifier"
                  ? process.env.VERCEL_URL
                    ? "Session expired. Sign in again."
                    : "Use http://127.0.0.1:3000 (not localhost) and sign in again."
                  : error}
            </p>
          )}
          <a
            href="/api/spotify/authorize"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#1db954] px-5 py-3 text-sm font-medium text-white hover:bg-[#1ed760] transition-colors"
          >
            Sign in with Spotify
          </a>
          {!process.env.VERCEL_URL && (
            <p className="mt-4 text-xs text-white/50">
              Open at <strong>http://127.0.0.1:3000</strong>. In Spotify Dashboard
              → your app → Redirect URIs, add:{" "}
              <code className="break-all text-white/70">
                http://127.0.0.1:3000/api/spotify/callback
              </code>
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <Header />
      <div className="mx-auto max-w-2xl px-4 py-6">
        <TempoBuilder />
      </div>
    </main>
  );
}
