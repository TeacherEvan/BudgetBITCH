import {
  lookupReverseGeocodeCandidate,
  normalizeReverseGeocodeLabel,
} from "./reverse-geocode-label";

export type GeolocationPermissionState = "granted" | "prompt" | "denied" | "unsupported";

export type CurrentPositionResult =
  | {
      status: "success";
      coordinates: {
        latitude: number;
        longitude: number;
        accuracy: number | null;
      };
    }
  | {
      status: "unsupported" | "denied" | "unavailable" | "timeout" | "error";
    };

export type DetectHomeBaseResult =
  | {
      status: "success";
      homeBase: ReturnType<typeof normalizeReverseGeocodeLabel> extends infer Result
        ? Exclude<Result, null>
        : never;
      stateCode: string | null;
    }
  | {
      status: "unsupported" | "denied" | "unavailable" | "timeout" | "error";
    };

export const GEOLOCATION_NOTICE =
  "We do not store GPS or coordinates. Only your area label is saved.";

const DEFAULT_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  timeout: 8000,
  maximumAge: 300000,
};

function isSecureGeolocationContext() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.isSecureContext;
}

export async function getGeolocationPermissionState(): Promise<GeolocationPermissionState> {
  if (
    typeof navigator === "undefined" ||
    !isSecureGeolocationContext() ||
    !navigator.permissions?.query
  ) {
    return "unsupported";
  }

  try {
    const status = await navigator.permissions.query({ name: "geolocation" });
    return status.state;
  } catch {
    return "unsupported";
  }
}

export async function requestCurrentPosition(
  options?: PositionOptions,
): Promise<CurrentPositionResult> {
  if (
    typeof navigator === "undefined" ||
    !isSecureGeolocationContext() ||
    !navigator.geolocation?.getCurrentPosition
  ) {
    return { status: "unsupported" };
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          status: "success",
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: Number.isFinite(position.coords.accuracy)
              ? position.coords.accuracy
              : null,
          },
        });
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            resolve({ status: "denied" });
            return;
          case error.POSITION_UNAVAILABLE:
            resolve({ status: "unavailable" });
            return;
          case error.TIMEOUT:
            resolve({ status: "timeout" });
            return;
          default:
            resolve({ status: "error" });
        }
      },
      {
        ...DEFAULT_POSITION_OPTIONS,
        ...options,
      },
    );
  });
}

export async function detectHomeBaseFromCurrentArea(
  fetchImpl: typeof fetch = fetch,
): Promise<DetectHomeBaseResult> {
  const position = await requestCurrentPosition();

  if (position.status !== "success") {
    return { status: position.status };
  }

  try {
    const candidate = await lookupReverseGeocodeCandidate(position.coordinates, fetchImpl);
    const homeBase = normalizeReverseGeocodeLabel(candidate);

    if (!homeBase) {
      return { status: "unavailable" };
    }

    return {
      status: "success",
      homeBase,
      stateCode: candidate?.stateCode ?? null,
    };
  } catch {
    return { status: "unavailable" };
  }
}