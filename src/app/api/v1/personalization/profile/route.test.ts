import { afterEach, describe, expect, it, vi } from "vitest";

const getConvexAuthenticatedIdentity = vi.hoisted(() => vi.fn());

const prismaMock = {
  userProfile: {
    findUnique: vi.fn(),
  },
  userPersonalizationProfile: {
    upsert: vi.fn(),
  },
};

vi.mock("@/lib/auth/convex-session", () => ({
  getConvexAuthenticatedIdentity,
}));

vi.mock("@/lib/prisma", () => ({
  getPrismaClient: () => prismaMock,
}));

import { POST } from "./route";

afterEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/personalization/profile", () => {
  it("stores an optional personalization profile for the authenticated local user", async () => {
    getConvexAuthenticatedIdentity.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
    });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.userPersonalizationProfile.upsert.mockResolvedValue({
      id: "personalization-1",
      userId: "profile-1",
      genderIdentity: "woman",
      pronouns: "she_her",
      communicationStyle: "direct",
      coachingIntensity: "focused",
      privacyVersion: "v1",
    });

    const response = await POST(
      new Request("http://localhost/api/v1/personalization/profile", {
        method: "POST",
        body: JSON.stringify({
          genderIdentity: "woman",
          pronouns: "she_her",
          communicationStyle: "direct",
          coachingIntensity: "focused",
          consented: true,
        }),
      }),
    );

    expect(prismaMock.userPersonalizationProfile.upsert).toHaveBeenCalledWith({
      where: { userId: "profile-1" },
      update: {
        genderIdentity: "woman",
        genderSelfDescription: null,
        pronouns: "she_her",
        pronounSelfDescription: null,
        communicationStyle: "direct",
        coachingIntensity: "focused",
        consentedAt: expect.any(Date),
        privacyVersion: "v1",
      },
      create: {
        userId: "profile-1",
        genderIdentity: "woman",
        genderSelfDescription: null,
        pronouns: "she_her",
        pronounSelfDescription: null,
        communicationStyle: "direct",
        coachingIntensity: "focused",
        consentedAt: expect.any(Date),
        privacyVersion: "v1",
      },
      select: {
        id: true,
        userId: true,
        genderIdentity: true,
        pronouns: true,
        communicationStyle: true,
        coachingIntensity: true,
        privacyVersion: true,
      },
    });
    expect(response.status).toBe(200);
  });

  it("returns 401 when the request is unauthenticated", async () => {
    getConvexAuthenticatedIdentity.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/v1/personalization/profile", {
        method: "POST",
        body: JSON.stringify({ consented: false }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is required.",
    });
  });

  it("returns a demo personalization profile for the non-production signed-in e2e override", async () => {
    getConvexAuthenticatedIdentity.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/v1/personalization/profile", {
        method: "POST",
        headers: {
          cookie: "budgetbitch:e2e-auth-state=signed-in",
        },
        body: JSON.stringify({
          genderIdentity: "woman",
          pronouns: "she_her",
          communicationStyle: "direct",
          coachingIntensity: "focused",
          consented: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      personalizationProfile: {
        id: "demo-personalization-profile",
        userId: "demo-user",
        genderIdentity: "woman",
        pronouns: "she_her",
        communicationStyle: "direct",
        coachingIntensity: "focused",
        privacyVersion: "v1",
      },
    });
    expect(prismaMock.userProfile.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.userPersonalizationProfile.upsert).not.toHaveBeenCalled();
  });

  it("clears stored personalization values when consent is not granted", async () => {
    getConvexAuthenticatedIdentity.mockResolvedValue({
      tokenIdentifier: "convex|user-1",
    });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.userPersonalizationProfile.upsert.mockResolvedValue({
      id: "personalization-1",
      userId: "profile-1",
      genderIdentity: null,
      pronouns: null,
      communicationStyle: null,
      coachingIntensity: null,
      privacyVersion: "v1",
    });

    const response = await POST(
      new Request("http://localhost/api/v1/personalization/profile", {
        method: "POST",
        body: JSON.stringify({
          genderIdentity: "woman",
          pronouns: "she_her",
          communicationStyle: "direct",
          coachingIntensity: "focused",
          consented: false,
        }),
      }),
    );

    expect(prismaMock.userPersonalizationProfile.upsert).toHaveBeenCalledWith({
      where: { userId: "profile-1" },
      update: {
        genderIdentity: null,
        genderSelfDescription: null,
        pronouns: null,
        pronounSelfDescription: null,
        communicationStyle: null,
        coachingIntensity: null,
        consentedAt: null,
        privacyVersion: "v1",
      },
      create: {
        userId: "profile-1",
        genderIdentity: null,
        genderSelfDescription: null,
        pronouns: null,
        pronounSelfDescription: null,
        communicationStyle: null,
        coachingIntensity: null,
        consentedAt: null,
        privacyVersion: "v1",
      },
      select: {
        id: true,
        userId: true,
        genderIdentity: true,
        pronouns: true,
        communicationStyle: true,
        coachingIntensity: true,
        privacyVersion: true,
      },
    });
    expect(response.status).toBe(200);
  });
});