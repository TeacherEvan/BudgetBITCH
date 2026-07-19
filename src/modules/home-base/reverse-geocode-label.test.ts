import { describe, expect, it, vi } from "vitest";
import {
  lookupReverseGeocodeCandidate,
  normalizeReverseGeocodeLabel,
  reverseGeocodeLabel,
} from "./reverse-geocode-label";

describe("reverse-geocode-label", () => {
  it("normalizes coarse city, region, and country labels", () => {
    expect(
      normalizeReverseGeocodeLabel({
        city: "  Dublin ",
        region: " Leinster ",
        countryCode: "ie",
      }),
    ).toEqual({
      city: "Dublin",
      region: "Leinster",
      countryCode: "IE",
      source: "geolocation",
    });
  });

  it("returns null when the coarse label is incomplete", () => {
    expect(
      normalizeReverseGeocodeLabel({
        city: "Dublin",
        region: "",
        countryCode: "IE",
      }),
    ).toBeNull();
  });

  it("returns null when reverse lookup fails", async () => {
    const lookup = vi.fn().mockRejectedValue(new Error("lookup failed"));

    await expect(
      reverseGeocodeLabel(
        {
          latitude: 53.3498,
          longitude: -6.2603,
        },
        lookup,
      ),
    ).resolves.toBeNull();
  });

  it("maps a reverse geocode response into the coarse candidate shape", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        address: {
          city: "Oakland",
          state: "California",
          state_code: "ca",
          country_code: "us",
        },
      }),
    });

    await expect(
      lookupReverseGeocodeCandidate(
        {
          latitude: 37.8044,
          longitude: -122.2712,
        },
        fetchImpl,
      ),
    ).resolves.toEqual({
      city: "Oakland",
      region: "California",
      countryCode: "us",
      stateCode: "CA",
    });
  });
});