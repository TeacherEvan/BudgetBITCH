import { NextResponse } from "next/server";
import { getConvexAuthenticatedIdentity } from "@/lib/auth/convex-session";
import { getPrismaClient } from "@/lib/prisma";
import { normalizeUserJobPreference } from "@/modules/personalization/personalization-schema";

export async function POST(request: Request) {
  const identity = await getConvexAuthenticatedIdentity();

  if (!identity?.tokenIdentifier) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const body = await request.json();
  const input = normalizeUserJobPreference(body);
  const prisma = getPrismaClient();
  const user = await prisma.userProfile.findUnique({
    where: { clerkUserId: identity.tokenIdentifier },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "No local user profile exists for this account." }, { status: 404 });
  }

  const existingPreference = await prisma.userJobPreference.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  const preferenceData = {
    roleInterests: input.roleInterests,
    certifications: input.certifications,
    licenseTypes: input.licenseTypes,
    careWorkInterest: input.careWorkInterest,
    childCareInterest: input.childCareInterest,
    petCareInterest: input.petCareInterest,
    nursingInterest: input.nursingInterest,
    teachingInterest: input.teachingInterest,
    notificationEnabled: input.notificationEnabled,
  };

  const jobPreference = existingPreference
    ? await prisma.userJobPreference.update({
        where: { id: existingPreference.id },
        data: preferenceData,
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
      })
    : await prisma.userJobPreference.create({
        data: {
          userId: user.id,
          ...preferenceData,
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

  return NextResponse.json({ jobPreference });
}