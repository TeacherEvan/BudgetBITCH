import { afterEach, describe, expect, it, vi } from "vitest";

const getConvexAuthenticatedIdentity = vi.hoisted(() => vi.fn());

const prismaMock = {
  userProfile: {
    findUnique: vi.fn(),
  },
  userJobPreference: {
    findFirst: vi.fn(),
    update: vi.fn(),
    create: vi.fn(),
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

describe("POST /api/v1/personalization/job-preferences", () => {
  it("creates job preferences for the authenticated local user when none exist", async () => {
    getConvexAuthenticatedIdentity.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.userJobPreference.findFirst.mockResolvedValue(null);
    prismaMock.userJobPreference.create.mockResolvedValue({
      id: "job-pref-1",
      userId: "profile-1",
      roleInterests: ["bookkeeping", "dog walker"],
      certifications: ["RN"],
      licenseTypes: ["registered_nurse"],
      careWorkInterest: true,
      childCareInterest: false,
      petCareInterest: true,
      nursingInterest: true,
      teachingInterest: false,
      notificationEnabled: true,
    });

    const response = await POST(
      new Request("http://localhost/api/v1/personalization/job-preferences", {
        method: "POST",
        body: JSON.stringify({
          roleInterests: [" Bookkeeping ", "dog walker"],
          certifications: ["RN"],
          licenseTypes: ["registered_nurse"],
          careWorkInterest: true,
          childCareInterest: false,
          petCareInterest: true,
          nursingInterest: true,
          teachingInterest: false,
          notificationEnabled: true,
        }),
      }),
    );

    expect(prismaMock.userJobPreference.findFirst).toHaveBeenCalledWith({
      where: { userId: "profile-1" },
      orderBy: { updatedAt: "desc" },
      select: { id: true },
    });
    expect(prismaMock.userJobPreference.create).toHaveBeenCalledWith({
      data: {
        userId: "profile-1",
        roleInterests: ["bookkeeping", "dog walker"],
        certifications: ["RN"],
        licenseTypes: ["registered_nurse"],
        careWorkInterest: true,
        childCareInterest: false,
        petCareInterest: true,
        nursingInterest: true,
        teachingInterest: false,
        notificationEnabled: true,
      },
      select: {
        id: true,
        userId: true,
        roleInterests: true,
        certifications: true,
        licenseTypes: true,
        careWorkInterest: true,
        childCareInterest: true,
        petCareInterest: true,
        nursingInterest: true,
        teachingInterest: true,
        notificationEnabled: true,
      },
    });
    expect(response.status).toBe(200);
  });

  it("updates the latest saved job preferences when a record already exists", async () => {
    getConvexAuthenticatedIdentity.mockResolvedValue({ tokenIdentifier: "convex|user-1" });
    prismaMock.userProfile.findUnique.mockResolvedValue({ id: "profile-1" });
    prismaMock.userJobPreference.findFirst.mockResolvedValue({ id: "job-pref-1" });
    prismaMock.userJobPreference.update.mockResolvedValue({
      id: "job-pref-1",
      userId: "profile-1",
      roleInterests: ["teacher"],
      certifications: [],
      licenseTypes: ["state_teaching_license"],
      careWorkInterest: false,
      childCareInterest: true,
      petCareInterest: false,
      nursingInterest: false,
      teachingInterest: true,
      notificationEnabled: false,
    });

    const response = await POST(
      new Request("http://localhost/api/v1/personalization/job-preferences", {
        method: "POST",
        body: JSON.stringify({
          roleInterests: ["Teacher"],
          certifications: [],
          licenseTypes: ["state_teaching_license"],
          careWorkInterest: false,
          childCareInterest: true,
          petCareInterest: false,
          nursingInterest: false,
          teachingInterest: true,
          notificationEnabled: false,
        }),
      }),
    );

    expect(prismaMock.userJobPreference.update).toHaveBeenCalledWith({
      where: { id: "job-pref-1" },
      data: {
        roleInterests: ["teacher"],
        certifications: [],
        licenseTypes: ["state_teaching_license"],
        careWorkInterest: false,
        childCareInterest: true,
        petCareInterest: false,
        nursingInterest: false,
        teachingInterest: true,
        notificationEnabled: false,
      },
      select: {
        id: true,
        userId: true,
        roleInterests: true,
        certifications: true,
        licenseTypes: true,
        careWorkInterest: true,
        childCareInterest: true,
        petCareInterest: true,
        nursingInterest: true,
        teachingInterest: true,
        notificationEnabled: true,
      },
    });
    expect(response.status).toBe(200);
  });

  it("returns 401 when the request is unauthenticated", async () => {
    getConvexAuthenticatedIdentity.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/v1/personalization/job-preferences", {
        method: "POST",
        body: JSON.stringify({ notificationEnabled: true }),
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Authentication is required.",
    });
  });

  it("returns demo job preferences for the non-production signed-in e2e override", async () => {
    getConvexAuthenticatedIdentity.mockResolvedValue(null);

    const response = await POST(
      new Request("http://localhost/api/v1/personalization/job-preferences", {
        method: "POST",
        headers: {
          cookie: "budgetbitch:e2e-auth-state=signed-in",
        },
        body: JSON.stringify({
          roleInterests: [" Bookkeeping ", "dog walker"],
          certifications: ["RN"],
          licenseTypes: ["registered_nurse"],
          careWorkInterest: true,
          childCareInterest: false,
          petCareInterest: true,
          nursingInterest: true,
          teachingInterest: false,
          notificationEnabled: true,
        }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      jobPreference: {
        id: "demo-job-preference",
        userId: "demo-user",
        roleInterests: ["bookkeeping", "dog walker"],
        certifications: ["RN"],
        licenseTypes: ["registered_nurse"],
        careWorkInterest: true,
        childCareInterest: false,
        petCareInterest: true,
        nursingInterest: true,
        teachingInterest: false,
        notificationEnabled: true,
      },
    });
    expect(prismaMock.userProfile.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.userJobPreference.findFirst).not.toHaveBeenCalled();
    expect(prismaMock.userJobPreference.create).not.toHaveBeenCalled();
    expect(prismaMock.userJobPreference.update).not.toHaveBeenCalled();
  });
});