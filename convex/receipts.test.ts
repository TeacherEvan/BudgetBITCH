/// <reference types="vite/client" />
/* eslint-disable @typescript-eslint/no-explicit-any */
import { convexTest } from "convex-test";
import { expect, test, beforeEach, vi } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

function seedUser(t: ReturnType<typeof convexTest>, label: string) {
  return t.run(async (ctx: any) =>
    ctx.db.insert("users", { email: `${label}@example.com` }),
  ) as Promise<any>;
}

let t: ReturnType<typeof convexTest>;
const asUser = (userId: any) => t.withIdentity({ subject: userId });

beforeEach(() => {
  t = convexTest(schema, modules);
  vi.stubEnv("GEMINI_API_KEY", "mock-gemini-key");
});

test("parseReceipt rejects unauthenticated calls", async () => {
  await expect(
    t.action(api.receipts.parseReceipt, {
      base64Image: "data:image/png;base64,abcdef"
    })
  ).rejects.toThrow(/Authentication required to parse receipts/);
});

test("parseReceipt handles successful response from Gemini for authenticated user", async () => {
  const userId = await seedUser(t, "receipt-user");
  const mockFetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  amount: 150.50,
                  merchant: "Test Coffee Shop",
                  category: "food",
                  date: "2026-07-21"
                })
              }
            ]
          }
        }
      ]
    })
  });
  vi.stubGlobal("fetch", mockFetch);

  const res = await asUser(userId).action(api.receipts.parseReceipt, {
    base64Image: "data:image/png;base64,abcdef"
  });

  expect(res).toEqual({
    amount: 150.50,
    merchant: "Test Coffee Shop",
    category: "food",
    date: "2026-07-21"
  });

  expect(mockFetch).toHaveBeenCalledTimes(1);
  const fetchUrl = mockFetch.mock.calls[0][0];
  expect(fetchUrl).toContain("mock-gemini-key");
  
  vi.unstubAllGlobals();
});

test("parseReceipt throws error when GEMINI_API_KEY is missing", async () => {
  const userId = await seedUser(t, "receipt-user");
  vi.stubEnv("GEMINI_API_KEY", "");

  await expect(
    asUser(userId).action(api.receipts.parseReceipt, {
      base64Image: "data:image/png;base64,abcdef"
    })
  ).rejects.toThrow(/Gemini API key is not configured/);
});

test("parseReceipt handles API error responses", async () => {
  const userId = await seedUser(t, "receipt-user");
  const mockFetch = vi.fn().mockResolvedValue({
    ok: false,
    status: 500,
    text: async () => "Internal Server Error"
  });
  vi.stubGlobal("fetch", mockFetch);

  await expect(
    asUser(userId).action(api.receipts.parseReceipt, {
      base64Image: "data:image/png;base64,abcdef"
    })
  ).rejects.toThrow(/Gemini API returned error status 500/);

  vi.unstubAllGlobals();
});

