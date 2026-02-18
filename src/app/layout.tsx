import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "TempoFlow — BPM Workout Playlists",
  description: "Generate Spotify playlists mapped to your workout intensity curve.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#0a0a0a] text-zinc-100 font-sans">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
