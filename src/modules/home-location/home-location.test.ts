import {
  HOME_LOCATION_STORAGE_KEY,
  clearHomeLocation,
  formatHomeLocationLabel,
  readStoredHomeLocation,
  saveHomeLocation,
} from "@/modules/home-location/home-location";
import { afterEach, describe, expect, it } from "vitest";

describe("homeLocation", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("reads back a validated saved location", () => {
    saveHomeLocation({ countryCode: "us", stateCode: "ca" });

    expect(readStoredHomeLocation()).toEqual({
      countryCode: "US",
      stateCode: "CA",
    });
  });

  it("ignores invalid stored payloads", () => {
    window.localStorage.setItem(
      HOME_LOCATION_STORAGE_KEY,
      JSON.stringify({ countryCode: "XX", stateCode: "LONG" }),
    );

    expect(readStoredHomeLocation()).toBeNull();
  });

  it("formats a human-readable home-location label", () => {
    const location = saveHomeLocation({
      countryCode: "th",
      stateCode: "10",
      city: "Bangkok",
    });

    expect(formatHomeLocationLabel(location)).toBe("Bangkok, 10, Thailand");
  });

  it("clears the saved location", () => {
    saveHomeLocation({ countryCode: "sg", stateCode: "01" });

    clearHomeLocation();

    expect(readStoredHomeLocation()).toBeNull();
  });
});