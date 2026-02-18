import { auth, signIn } from "@/auth";
import { TempoBuilder } from "@/components/tempo-builder";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/header";

export default async function Home() {
  const session = await auth();
  if (!session) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0a0a0a]">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-zinc-900/50 backdrop-blur-xl p-8 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-1">TempoFlow</h1>
          <p className="text-white/60 text-sm mb-6">
            Generate Spotify playlists that follow your workout’s BPM curve.
          </p>
          <form
            action={async () => {
              "use server";
              await signIn("spotify", { redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="primary" className="w-full">
              Sign in with Spotify
            </Button>
          </form>
          <p className="text-xs text-white/40 mt-4">
            Requires Spotify Premium for preview playback.
          </p>
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
