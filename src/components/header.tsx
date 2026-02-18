"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-black/40 backdrop-blur-xl">
      <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">TempoFlow</h1>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/" })}
        >
          Sign out
        </Button>
      </div>
    </header>
  );
}
