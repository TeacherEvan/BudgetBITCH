import { countryOptions } from "@/modules/start-smart/country-options";
import { z } from "zod";

export const HOME_LOCATION_STORAGE_KEY = "budgetbitch:home-location";

const supportedCountryCodes = new Set(countryOptions.map((option) => option.code));
const homeLocationListeners = new Set<() => void>();
let cachedHomeLocationRawValue: string | null | undefined;
let cachedHomeLocation: HomeLocation | null = null;

export const homeLocationSchema = z.object({
  countryCode: z
    .string()
    .trim()
    .length(2, "Choose a supported country.")
    .transform((value) => value.toUpperCase())
    .refine((value) => supportedCountryCodes.has(value), "Choose a supported country."),
  stateCode: z
    .string()
    .trim()
    .min(2, "Enter a valid 2- or 3-character state or region code.")
    .max(3, "Enter a valid 2- or 3-character state or region code.")
    .transform((value) => value.toUpperCase()),
  city: z.preprocess(
    (value) => {
      if (typeof value !== "string") {
        return value;
      }

      const trimmedValue = value.trim();
      return trimmedValue.length > 0 ? trimmedValue : undefined;
    },
    z.string().max(80, "City name is too long.").optional(),
  ),
});

export type HomeLocationInput = {
  countryCode: string;
  stateCode: string;
  city?: string;
};
export type HomeLocation = z.infer<typeof homeLocationSchema>;

function canUseStorage(storage?: Storage | null): storage is Storage {
  return Boolean(storage);
}

function resolveStorage(storage?: Storage | null) {
  if (storage) {
    return storage;
  }

  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage;
}

function notifyHomeLocationListeners() {
  homeLocationListeners.forEach((listener) => listener());
}

export function parseHomeLocation(value: unknown) {
  const result = homeLocationSchema.safeParse(value);
  return result.success ? result.data : null;
}

export function readStoredHomeLocation(storage?: Storage | null) {
  const resolvedStorage = resolveStorage(storage);

  if (!canUseStorage(resolvedStorage)) {
    return null;
  }

  const rawValue = resolvedStorage.getItem(HOME_LOCATION_STORAGE_KEY);

   if (rawValue === cachedHomeLocationRawValue) {
    return cachedHomeLocation;
  }

  cachedHomeLocationRawValue = rawValue;

  if (!rawValue) {
    cachedHomeLocation = null;
    return null;
  }

  try {
    cachedHomeLocation = parseHomeLocation(JSON.parse(rawValue));
    return cachedHomeLocation;
  } catch {
    cachedHomeLocation = null;
    return null;
  }
}

export function saveHomeLocation(input: HomeLocationInput, storage?: Storage | null) {
  const resolvedStorage = resolveStorage(storage);

  if (!canUseStorage(resolvedStorage)) {
    return homeLocationSchema.parse(input);
  }

  const parsedLocation = homeLocationSchema.parse(input);
  const serializedLocation = JSON.stringify(parsedLocation);
  cachedHomeLocationRawValue = serializedLocation;
  cachedHomeLocation = parsedLocation;
  resolvedStorage.setItem(HOME_LOCATION_STORAGE_KEY, serializedLocation);
  notifyHomeLocationListeners();
  return parsedLocation;
}

export function clearHomeLocation(storage?: Storage | null) {
  const resolvedStorage = resolveStorage(storage);

  if (!canUseStorage(resolvedStorage)) {
    return;
  }

  resolvedStorage.removeItem(HOME_LOCATION_STORAGE_KEY);
  cachedHomeLocationRawValue = null;
  cachedHomeLocation = null;
  notifyHomeLocationListeners();
}

export function subscribeHomeLocation(listener: () => void) {
  homeLocationListeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      homeLocationListeners.delete(listener);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === HOME_LOCATION_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    homeLocationListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function formatHomeLocationLabel(homeLocation: HomeLocation | null) {
  if (!homeLocation) {
    return "No home base set";
  }

  const countryLabel =
    countryOptions.find((option) => option.code === homeLocation.countryCode)?.label ??
    homeLocation.countryCode;

  return [homeLocation.city, homeLocation.stateCode, countryLabel].filter(Boolean).join(", ");
}