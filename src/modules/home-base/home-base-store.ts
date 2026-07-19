import {
  homeBaseFieldsSchema,
  homeBaseSchema,
  type HomeBase,
  type HomeBaseFields,
} from "./home-base-schema";

export const HOME_BASE_STORAGE_KEY = "budgetbitch:home-base";

type HomeBaseListener = () => void;

const listeners = new Set<HomeBaseListener>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

export function loadHomeBase(): HomeBase | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(HOME_BASE_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = homeBaseSchema.safeParse(JSON.parse(raw));

    if (!parsed.success) {
      window.localStorage.removeItem(HOME_BASE_STORAGE_KEY);
      return null;
    }

    return parsed.data;
  } catch {
    try {
      window.localStorage.removeItem(HOME_BASE_STORAGE_KEY);
    } catch {
      // Keep reads defensive even when storage access is blocked.
    }

    return null;
  }
}

export function getHomeBaseSnapshot(): HomeBase | null {
  return loadHomeBase();
}

export function getHomeBaseServerSnapshot(): HomeBase | null {
  return null;
}

export function saveHomeBase(input: HomeBaseFields) {
  if (typeof window === "undefined") {
    return;
  }

  const parsed = homeBaseFieldsSchema.parse(input);

  try {
    window.localStorage.setItem(HOME_BASE_STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    return;
  }

  emitChange();
}

export function clearHomeBase() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(HOME_BASE_STORAGE_KEY);
  } catch {
    return;
  }

  emitChange();
}

export function subscribeToHomeBase(listener: HomeBaseListener) {
  listeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === null || event.key === HOME_BASE_STORAGE_KEY) {
      listener();
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}