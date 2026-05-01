import { afterEach, describe, expect, it, vi } from "vitest";

const resolveWorkspaceApiAccess = vi.hoisted(() => vi.fn());
const createWorkspaceApiAccessErrorResponse = vi.hoisted(() => vi.fn());

const prismaMock = {
  workspaceHomeLocation: {
    upsert: vi.fn(),
  },
};

vi.mock("@/lib/auth/workspace-api-access", () => ({
  resolveWorkspaceApiAccess,
  createWorkspaceApiAccessErrorResponse,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import { POST } from "./route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/accounting/home-location", () => {
  it("stores coarse home-area data for the authorized workspace", async () => {
    resolveWorkspaceApiAccess.mockResolvedValue({
      workspaceId: "workspace-1",
      accessMode: "authenticated",
      actorUserId: "profile-1",
      role: "owner",
    });
    prismaMock.workspaceHomeLocation.upsert.mockResolvedValue({
      id: "home-1",
      workspaceId: "workspace-1",
      city: "Austin",
      stateCode: "TX",
      countryCode: "US",
      source: "user_selected",
    });

    const response = await POST(
      new Request("http://localhost/api/v1/accounting/home-location", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          city: "Austin",
          stateCode: "tx",
          countryCode: "us",
          consented: true,
        }),
      }),
    );

    expect(prismaMock.workspaceHomeLocation.upsert).toHaveBeenCalledWith({
      where: {
        workspaceId_city_stateCode_countryCode: {
          workspaceId: "workspace-1",
          city: "Austin",
          stateCode: "TX",
          countryCode: "US",
        },
      },
      update: {
        consentedAt: expect.any(Date),
        source: "user_selected",
      },
      create: {
        workspaceId: "workspace-1",
        city: "Austin",
        stateCode: "TX",
        countryCode: "US",
        consentedAt: expect.any(Date),
        source: "user_selected",
      },
      select: {
        id: true,
        workspaceId: true,
        city: true,
        stateCode: true,
        countryCode: true,
        source: true,
      },
    });
    expect(response.status).toBe(200);
  });

  it("returns the workspace access error response when authorization fails", async () => {
    const deniedResponse = new Response(JSON.stringify({ error: { message: "Authentication is required." } }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
    resolveWorkspaceApiAccess.mockRejectedValue(new Error("Authentication is required."));
    createWorkspaceApiAccessErrorResponse.mockReturnValue(deniedResponse);

    const response = await POST(
      new Request("http://localhost/api/v1/accounting/home-location", {
        method: "POST",
        body: JSON.stringify({
          workspaceId: "workspace-1",
          city: "Austin",
          stateCode: "TX",
          countryCode: "US",
          consented: true,
        }),
      }),
    );

    expect(response.status).toBe(401);
  });
});