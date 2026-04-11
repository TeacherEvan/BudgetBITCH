import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/v1/start-smart/regional-data", () => {
  it("returns a normalized regional snapshot", async () => {
    const request = new Request(
      "http://localhost/api/v1/start-smart/regional-data",
      {
        method: "POST",
        body: JSON.stringify({ countryCode: "US", stateCode: "CA", cityCode: "los-angeles" }),
        headers: { "content-type": "application/json" },
      },
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.regionKey).toBe("us-ca");
    expect(json.locationKey).toBe("us-ca-los-angeles");
    expect(json.housing.monthly).toBe(2550);
  });
});
