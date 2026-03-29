import { execSync } from "node:child_process";

const INTERVAL_MS = Number(process.env.AUTOSYNC_INTERVAL_MS || 20000);

function run(command) {
  return execSync(command, { stdio: "pipe", encoding: "utf8" }).trim();
}

function hasChanges() {
  const status = run("git status --porcelain");
  return status.length > 0;
}

function syncOnce() {
  try {
    if (!hasChanges()) {
      console.log(`[autosync] ${new Date().toISOString()} no changes`);
      return;
    }

    execSync("git add -A", { stdio: "inherit" });
    const message = `chore: autosync ${new Date().toISOString()}`;
    try {
      execSync(`git commit -m "${message}"`, { stdio: "inherit" });
    } catch {
      // Nothing to commit or commit blocked; keep going to push attempt.
    }
    execSync("git push origin main", { stdio: "inherit" });
    console.log(`[autosync] ${new Date().toISOString()} pushed`);
  } catch (error) {
    console.error(`[autosync] ${new Date().toISOString()} failed`);
    if (error?.message) {
      console.error(error.message);
    }
  }
}

console.log(`[autosync] started, interval=${INTERVAL_MS}ms`);
syncOnce();
setInterval(syncOnce, INTERVAL_MS);
