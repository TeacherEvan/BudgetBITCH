import { beforeEach, describe, expect, it, vi } from "vitest";

const convexHttpClientMock = vi.hoisted(() => vi.fn());

vi.mock("convex/browser", () => ({
  ConvexHttpClient: convexHttpClientMock,
}));

describe("getConvexHttpClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    convexHttpClientMock.mockReset();
    convexHttpClientMock.mockImplementation(function ConvexHttpClient(
      this: { url?: string; options?: unknown; instanceId?: symbol },
      url: string,
      options?: unknown,
    ) {
      this.url = url;
      this.options = options;
      this.instanceId = Symbol("convex-http-client");
    });
  });

  it("throws a clear error when NEXT_PUBLIC_CONVEX_URL is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "");

    const { getConvexHttpClient } = await import("./http-client");

    expect(() => getConvexHttpClient()).toThrow(
      "NEXT_PUBLIC_CONVEX_URL is not configured for server-side Convex HTTP calls.",
    );
    expect(convexHttpClientMock).not.toHaveBeenCalled();
  });

  it("creates a client with the trimmed Convex deployment URL", async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_CONVEX_URL",
      " https://happy-animal-123.convex.cloud ",
    );

    const { getConvexHttpClient } = await import("./http-client");

    const client = getConvexHttpClient();

    expect(convexHttpClientMock).toHaveBeenCalledWith(
      "https://happy-animal-123.convex.cloud",
      {},
    );
    expect(client).toMatchObject({
      options: {},
      url: "https://happy-animal-123.convex.cloud",
    });
  });

  it("creates a fresh client each time and forwards supported options", async () => {
    vi.stubEnv("NEXT_PUBLIC_CONVEX_URL", "https://happy-animal-123.convex.cloud");

    const { getConvexHttpClient } = await import("./http-client");
    const fetchMock = vi.fn() as unknown as typeof fetch;

    const firstClient = getConvexHttpClient({ auth: "token-123" });
    const secondClient = getConvexHttpClient({ fetch: fetchMock });

    expect(convexHttpClientMock).toHaveBeenNthCalledWith(
      1,
      "https://happy-animal-123.convex.cloud",
      { auth: "token-123" },
    );
    expect(convexHttpClientMock).toHaveBeenNthCalledWith(
      2,
      "https://happy-animal-123.convex.cloud",
      { fetch: fetchMock },
    );
    expect(firstClient).not.toBe(secondClient);
  });
});
