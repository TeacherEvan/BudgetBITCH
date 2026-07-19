import { homeBaseFieldsSchema, type HomeBaseFields } from "./home-base-schema";

export type ReverseGeocodeCoordinates = {
  latitude: number;
  longitude: number;
};

export type ReverseGeocodeCandidate = {
  city?: string | null;
  region?: string | null;
  countryCode?: string | null;
  stateCode?: string | null;
};

export type ReverseGeocodeLookup = (
  coordinates: ReverseGeocodeCoordinates,
) => Promise<ReverseGeocodeCandidate | null>;

type FetchLike = typeof fetch;

function cleanSegment(value?: string | null) {
  return value?.trim() || null;
}

export function normalizeReverseGeocodeLabel(
  candidate: ReverseGeocodeCandidate | null,
): HomeBaseFields | null {
  if (!candidate) {
    return null;
  }

  const city = cleanSegment(candidate.city);
  const region = cleanSegment(candidate.region);
  const countryCode = cleanSegment(candidate.countryCode)?.toUpperCase() ?? null;

  if (!city || !region || !countryCode) {
    return null;
  }

  const parsed = homeBaseFieldsSchema.safeParse({
    city,
    region,
    countryCode,
    source: "geolocation",
  });

  return parsed.success ? parsed.data : null;
}

export async function lookupReverseGeocodeCandidate(
  coordinates: ReverseGeocodeCoordinates,
  fetchImpl: FetchLike = fetch,
): Promise<ReverseGeocodeCandidate | null> {
  const response = await fetchImpl(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coordinates.latitude}&lon=${coordinates.longitude}`,
  );

  if (!response.ok) {
    return null;
  }

  const payload = (await response.json()) as {
    address?: {
      city?: string;
      town?: string;
      village?: string;
      county?: string;
      state?: string;
      state_code?: string;
      region?: string;
      country_code?: string;
    };
  };

  return {
    city: payload.address?.city ?? payload.address?.town ?? payload.address?.village ?? null,
    region: payload.address?.state ?? payload.address?.region ?? payload.address?.county ?? null,
    countryCode: payload.address?.country_code ?? null,
    stateCode: payload.address?.state_code?.toUpperCase() ?? null,
  };
}

export async function reverseGeocodeLabel(
  coordinates: ReverseGeocodeCoordinates,
  lookup: ReverseGeocodeLookup,
): Promise<HomeBaseFields | null> {
  try {
    const candidate = await lookup(coordinates);
    return normalizeReverseGeocodeLabel(candidate);
  } catch {
    return null;
  }
}