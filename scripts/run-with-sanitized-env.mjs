import { spawn } from "node:child_process";

const placeholderPattern = /replace_me|your-app/i;
const forceStripAuthEnv = process.env.BUDGETBITCH_STRIP_AUTH_ENV === "true";
const variablesToSanitize = [
  "NEXT_PUBLIC_CONVEX_URL",
  "NEXT_PUBLIC_CONVEX_SITE_URL",
];

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/run-with-sanitized-env.mjs <command> [...args]");
  process.exit(1);
}

const env = { ...process.env };

for (const name of variablesToSanitize) {
  const value = env[name]?.trim();

  if (forceStripAuthEnv) {
    env[name] = "";
    continue;
  }

  if (value && placeholderPattern.test(value)) {
    delete env[name];
  }
}

const child = spawn(command, args, {
  env,
  shell: false,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});