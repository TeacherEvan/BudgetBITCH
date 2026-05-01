import { NextResponse } from "next/server";
import { getConvexAuthenticatedIdentity } from "@/lib/auth/convex-session";
import { getPrismaClient } from "@/lib/prisma";
import { normalizePersonalizationProfile } from "@/modules/personalization/personalization-schema";

const privacyVersion = "v1";

export async function POST(request: Request) {
  const identity = await getConvexAuthenticatedIdentity();

  if (!identity?.tokenIdentifier) {
    return NextResponse.json({ error: "Authentication is required." }, { status: 401 });
  }

  const body = await request.json();
  const input = normalizePersonalizationProfile(body);
  const prisma = getPrismaClient();
  const user = await prisma.userProfile.findUnique({
    where: { clerkUserId: identity.tokenIdentifier },
    select: { id: true },
  });

  if (!user) {
    return NextResponse.json({ error: "No local user profile exists for this account." }, { status: 404 });
  }

  const personalizationValues = input.consented
    ? {
        genderIdentity: input.genderIdentity ?? null,
        genderSelfDescription: input.genderSelfDescription ?? null,
        pronouns: input.pronouns ?? null,
        pronounSelfDescription: input.pronounSelfDescription ?? null,
        communicationStyle: input.communicationStyle ?? null,
        coachingIntensity: input.coachingIntensity ?? null,
        consentedAt: new Date(),
      }
    : {
        genderIdentity: null,
        genderSelfDescription: null,
        pronouns: null,
        pronounSelfDescription: null,
        communicationStyle: null,
        coachingIntensity: null,
        consentedAt: null,
      };

  const personalizationProfile = await prisma.userPersonalizationProfile.upsert({
    where: { userId: user.id },
    update: {
      ...personalizationValues,
      privacyVersion,
    },
    create: {
      userId: user.id,
      ...personalizationValues,
      privacyVersion,
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

  return NextResponse.json({ personalizationProfile });
}