import { describe, expect, it } from "vitest";
import { GET } from "./route";

describe("GET /api/v1/learn/modules/[slug]", () => {
  it("returns lesson detail for a valid module slug", async () => {
    const response = await GET(
      new Request("http://localhost/api/v1/learn/modules/budgeting-basics"),
      { params: Promise.resolve({ slug: "budgeting-basics" }) },
    );

    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.slug).toBe("budgeting-basics");
    expect(json.scenes.length).toBeGreaterThan(0);
  });
});
