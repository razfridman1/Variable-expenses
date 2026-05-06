#!/usr/bin/env node
/**
 * Build the static export used by Capacitor.
 *
 * Why this script exists:
 *   Next.js `output: "export"` cannot include dynamic Route Handlers.
 *   Our /api/** routes are all dynamic (they use auth + Prisma). When the
 *   APK runs, those routes are served by the deployed Vercel backend, not
 *   by the bundle inside the APK — so we exclude the api directory from
 *   the static build entirely by renaming it aside during the build.
 *
 * Usage: npm run build:static
 */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const API_DIR = path.join(ROOT, "src", "app", "api");
const API_DIR_STAGED = path.join(ROOT, "src", "app", "_api_excluded_for_static_build");
const MIDDLEWARE = path.join(ROOT, "src", "middleware.ts");
const MIDDLEWARE_STAGED = path.join(
  ROOT,
  "src",
  "_middleware_excluded_for_static_build.ts",
);

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Windows often holds file locks for a few hundred ms after a process
 * (dev server, editor file-watcher, antivirus) closes a directory.
 * Retry the rename with backoff before giving up.
 */
async function renameWithRetry(from, to, attempts = 8) {
  for (let i = 0; i < attempts; i++) {
    try {
      fs.renameSync(from, to);
      return;
    } catch (err) {
      if (err.code === "EPERM" || err.code === "EBUSY" || err.code === "ENOTEMPTY") {
        if (i === attempts - 1) throw err;
        await sleep(500 * (i + 1));
        continue;
      }
      throw err;
    }
  }
}

function moveBackIfExists(from, to) {
  if (!fs.existsSync(from)) return;
  try {
    fs.renameSync(from, to);
  } catch (err) {
    console.error(
      `\n⚠  Could not restore ${path.relative(ROOT, to)} from ${path.relative(ROOT, from)}.`,
      `\n   Restore it manually: rename "${path.relative(ROOT, from)}" → "${path.relative(ROOT, to)}".\n`,
      err,
    );
  }
}

async function main() {
  let movedApi = false;
  let movedMw = false;

  try {
    if (fs.existsSync(API_DIR)) {
      try {
        await renameWithRetry(API_DIR, API_DIR_STAGED);
        movedApi = true;
        console.log("→ moved src/app/api aside for static export");
      } catch (err) {
        console.error(
          `\n❌  Could not move src/app/api aside (${err.code}).`,
          `\n   Likely cause: 'npm run dev', VS Code, or another process is holding files in src/app/api open.`,
          `\n   Fix: close any running dev servers (Ctrl+C) and editors that have the project open, then retry.\n`,
        );
        process.exit(1);
      }
    }
    if (fs.existsSync(MIDDLEWARE)) {
      try {
        await renameWithRetry(MIDDLEWARE, MIDDLEWARE_STAGED);
        movedMw = true;
        console.log("→ moved src/middleware.ts aside for static export");
      } catch (err) {
        console.error(`\n❌  Could not move src/middleware.ts aside (${err.code}).\n`);
        throw err;
      }
    }

    process.env.BUILD_MODE = "export";
    execSync("npx next build", {
      cwd: ROOT,
      stdio: "inherit",
      env: { ...process.env, BUILD_MODE: "export" },
    });
  } finally {
    if (movedApi) moveBackIfExists(API_DIR_STAGED, API_DIR);
    if (movedMw)  moveBackIfExists(MIDDLEWARE_STAGED, MIDDLEWARE);
    console.log("→ restored api/ and middleware.ts");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
