import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TempoFlow — Playlists from Your Favorite Artists",
  description: "Build a custom Spotify playlist from the artists and tracks you love. Pick your seeds, get a playlist, save it to your account.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen min-w-0 w-full max-w-[100vw] bg-[#0a0a0a] text-zinc-100 font-sans overflow-x-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
