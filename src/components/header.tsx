"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-2xl min-w-0 items-center justify-between px-3 py-3 sm:px-4">
        <span className="font-semibold text-white">TempoFlow</span>
        <Link href="/api/spotify/logout">
          <Button variant="ghost" size="sm">
            Log out
          </Button>
        </Link>
      </div>
    </header>
  );
}
