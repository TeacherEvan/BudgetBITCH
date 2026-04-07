import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/budgets/health", () => {
  it("returns category ratios and statuses for valid input", async () => {
    const request = new Request("http://localhost/api/v1/budgets/health", {
      method: "POST",
      body: JSON.stringify({
        categories: [
          { name: "Food", limit: 500, spent: 450 },
          { name: "Fun", limit: 100, spent: 140 },
        ],
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.categories).toEqual([
      {
        name: "Food",
        limit: 500,
        spent: 450,
        ratio: 0.9,
        status: "at_risk",
      },
      {
        name: "Fun",
        limit: 100,
        spent: 140,
        ratio: 1.4,
        status: "over",
      },
    ]);
  });

  it("rejects malformed payloads at the schema boundary", async () => {
    const request = new Request("http://localhost/api/v1/budgets/health", {
      method: "POST",
      body: JSON.stringify({
        categories: [{ name: "Food", limit: "500", spent: 450 }],
      }),
      headers: { "content-type": "application/json" },
    });

    await expect(POST(request)).rejects.toThrow();
  });
});
