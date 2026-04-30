import { spawn } from "node:child_process";

const placeholderPattern = /replace_me|your-app/i;
const forceStripClerkEnv = process.env.BUDGETBITCH_STRIP_CLERK_ENV === "true";
const forceStripAuthEnv = process.env.BUDGETBITCH_STRIP_AUTH_ENV === "true";
const variablesToSanitize = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_JWT_ISSUER_DOMAIN",
  "NEXT_PUBLIC_CLERK_IS_SATELLITE",
  "NEXT_PUBLIC_CLERK_DOMAIN",
  "NEXT_PUBLIC_CLERK_PROXY_URL",
];
const authVariablesToSanitize = [
  "AUTH_GOOGLE_ID",
  "AUTH_GOOGLE_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
];

const [command, ...args] = process.argv.slice(2);

if (!command) {
  console.error("Usage: node scripts/run-with-sanitized-env.mjs <command> [...args]");
  process.exit(1);
}

const env = { ...process.env };

for (const name of variablesToSanitize) {
  const value = env[name]?.trim();

  if (forceStripClerkEnv) {
    env[name] = "";
    continue;
  }

  if (value && placeholderPattern.test(value)) {
    delete env[name];
  }
}

if (forceStripAuthEnv) {
  for (const name of authVariablesToSanitize) {
    env[name] = "";
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