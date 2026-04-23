import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { runInNewContext } from "node:vm";
import { describe, expect, it } from "vitest";

type ServiceWorkerSandbox = {
  isSafeShellRequest: (request: Request, url: URL) => boolean;
  isStaticAssetPath: (pathname: string) => boolean;
  shouldBypassCache: (request: Request, url: URL) => boolean;
};

function loadServiceWorkerSandbox() {
  const source = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
  const sandbox = {
    URL,
    Request,
    Response,
    Promise,
    fetch: async () => new Response(null, { status: 200 }),
    caches: {
      open: async () => ({
        add: async () => undefined,
        match: async () => null,
        put: async () => undefined,
      }),
      keys: async () => [],
      delete: async () => true,
    },
    self: {
      location: { origin: "https://budgetbitch.test" },
      addEventListener: () => undefined,
      skipWaiting: () => undefined,
      clients: { claim: async () => undefined },
    },
  } as ServiceWorkerSandbox & Record<string, unknown>;

  runInNewContext(source, sandbox);

  return sandbox;
}

describe("service worker cache policy", () => {
  it("treats notes and calculator shells as safe navigations", () => {
    const sandbox = loadServiceWorkerSandbox();
    const navigateRequest = { mode: "navigate" } as Request;

    expect(
      sandbox.isSafeShellRequest(
        navigateRequest,
        new URL("https://budgetbitch.test/notes"),
      ),
    ).toBe(true);
    expect(
      sandbox.isSafeShellRequest(
        navigateRequest,
        new URL("https://budgetbitch.test/jobs"),
      ),
    ).toBe(false);
  });

  it("allows only the intended static asset paths into the asset cache", () => {
    const sandbox = loadServiceWorkerSandbox();

    expect(sandbox.isStaticAssetPath("/_next/static/chunks/app.js")).toBe(true);
    expect(sandbox.isStaticAssetPath("/icons/app-icon.svg")).toBe(true);
    expect(sandbox.isStaticAssetPath("/user-content/avatar.png")).toBe(false);
    expect(sandbox.isStaticAssetPath("/api/v1/jobs/search")).toBe(false);
  });

  it("bypasses api and connect-style routes from the cache", () => {
    const sandbox = loadServiceWorkerSandbox();

    expect(
      sandbox.shouldBypassCache(
        new Request("https://budgetbitch.test/api/v1/jobs/search", { method: "GET" }),
        new URL("https://budgetbitch.test/api/v1/jobs/search"),
      ),
    ).toBe(true);
    expect(
      sandbox.shouldBypassCache(
        new Request("https://budgetbitch.test/settings/integrations/paypal/connect", {
          method: "GET",
        }),
        new URL("https://budgetbitch.test/settings/integrations/paypal/connect"),
      ),
    ).toBe(true);
    expect(
      sandbox.shouldBypassCache(
        new Request("https://budgetbitch.test/calculator", { method: "GET" }),
        new URL("https://budgetbitch.test/calculator"),
      ),
    ).toBe(false);
  });
});