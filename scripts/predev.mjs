#!/usr/bin/env node
/**
 * Runs before `pnpm dev`: frees port 3000 and removes Next.js dev lock
 * so the dev server can always start on the same port.
 */
import { unlinkSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// Remove Next.js dev lock so we don't get "Unable to acquire lock"
try {
  unlinkSync(join(root, ".next", "dev", "lock"));
} catch (_) {
  // ignore if missing
}

// Free port 3000 (ignore if nothing is listening)
try {
  const kill = (await import("kill-port")).default;
  await kill(3000, "tcp");
} catch (_) {
  // port was free or kill-port failed
}

process.exit(0);
