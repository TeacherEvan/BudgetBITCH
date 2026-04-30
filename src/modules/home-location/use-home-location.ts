"use client";

import { useSyncExternalStore } from "react";
import {
  clearHomeLocation,
  formatHomeLocationLabel,
  readStoredHomeLocation,
  saveHomeLocation,
  subscribeHomeLocation,
} from "./home-location";

export function useHomeLocation() {
  const homeLocation = useSyncExternalStore(
    subscribeHomeLocation,
    readStoredHomeLocation,
    () => null,
  );

  return {
    homeLocation,
    homeLocationLabel: formatHomeLocationLabel(homeLocation),
    saveHomeLocation,
    clearHomeLocation,
  };
}