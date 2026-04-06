import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/jobs/search", () => {
  it("filters seeded jobs by workplace, salary, and fit goals", async () => {
    const request = new Request("http://localhost/api/v1/jobs/search", {
      method: "POST",
      body: JSON.stringify({
        workplace: "remote",
        salaryMin: 45000,
        fitGoals: ["raise_income_fast"],
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.jobs.length).toBeGreaterThan(0);
    expect(json.jobs[0].workplace).toBe("remote");
  });

  it("honors a zero salary upper bound explicitly", async () => {
    const request = new Request("http://localhost/api/v1/jobs/search", {
      method: "POST",
      body: JSON.stringify({
        salaryMax: 0,
      }),
      headers: { "content-type": "application/json" },
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.jobs).toHaveLength(0);
  });
});
