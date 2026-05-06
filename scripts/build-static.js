#!/usr/bin/env node
/**
 * Build the static export used by Capacitor.
 *
 * Why this script exists:
 *   Next.js `output: "export"` cannot include dynamic Route Handlers.
 *   Our /api/** routes are all dynamic (they use auth + Prisma). When the
 *   APK runs, those routes are served by the deployed Vercel backend, not
 *   by the bundle inside the APK — so we exclude the api directory from
 *   the static build entirely.
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

function moveIfExists(from, to) {
  if (fs.existsSync(from)) fs.renameSync(from, to);
}

let movedApi = false;
let movedMw = false;

try {
  if (fs.existsSync(API_DIR)) {
    fs.renameSync(API_DIR, API_DIR_STAGED);
    movedApi = true;
    console.log("→ moved src/app/api aside for static export");
  }
  if (fs.existsSync(MIDDLEWARE)) {
    fs.renameSync(MIDDLEWARE, MIDDLEWARE_STAGED);
    movedMw = true;
    console.log("→ moved src/middleware.ts aside for static export");
  }

  process.env.BUILD_MODE = "export";
  execSync("npx next build", {
    cwd: ROOT,
    stdio: "inherit",
    env: { ...process.env, BUILD_MODE: "export" },
  });
} finally {
  if (movedApi) moveIfExists(API_DIR_STAGED, API_DIR);
  if (movedMw)  moveIfExists(MIDDLEWARE_STAGED, MIDDLEWARE);
  console.log("→ restored api/ and middleware.ts");
}
