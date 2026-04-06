import { describe, expect, it, vi } from "vitest";
import { POST } from "./route";

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => ({
    moneyBlueprintSnapshot: {
      findFirst: vi.fn().mockResolvedValue({
        blueprintJson: {
          priorityStack: ["cover_essentials", "stabilize_cash_flow"],
          riskWarnings: ["income_volatility_risk"],
          learnModuleKeys: ["income_variability"],
        },
      }),
    },
  }),
}));

describe("POST /api/v1/jobs/recommendations", () => {
  it("returns ranked jobs based on the latest blueprint", async () => {
    const request = new Request("http://localhost/api/v1/jobs/recommendations", {
      method: "POST",
      body: JSON.stringify({ workspaceId: "demo_workspace" }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.jobs.length).toBeGreaterThan(0);
    expect(json.jobs[0].fitSummary.length).toBeGreaterThan(0);
  });
});
