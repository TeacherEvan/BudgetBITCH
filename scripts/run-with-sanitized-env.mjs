import { spawn } from "node:child_process";

const placeholderPattern = /replace_me|your-app/i;
const variablesToSanitize = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_JWT_ISSUER_DOMAIN",
  "NEXT_PUBLIC_CLERK_DOMAIN",
  "NEXT_PUBLIC_CLERK_PROXY_URL",
];

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/run-with-sanitized-env.mjs <command> [...args]");
  process.exit(1);
}

const env = { ...process.env };

for (const name of variablesToSanitize) {
  const value = env[name]?.trim();

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