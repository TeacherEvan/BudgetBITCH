import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  detectHomeBaseFromCurrentArea,
  getGeolocationPermissionState,
  requestCurrentPosition,
} from "./location-permission";

describe("location-permission", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    Object.defineProperty(window, "isSecureContext", {
      configurable: true,
      value: true,
    });
  });

  describe("getGeolocationPermissionState", () => {
    it("returns unsupported when permissions api is unavailable", async () => {
      vi.stubGlobal("navigator", { permissions: undefined });

      await expect(getGeolocationPermissionState()).resolves.toBe("unsupported");
    });

    it("returns the browser permission state when available", async () => {
      const query = vi.fn().mockResolvedValue({ state: "granted" });
      vi.stubGlobal("navigator", {
        permissions: { query },
      });

      await expect(getGeolocationPermissionState()).resolves.toBe("granted");
      expect(query).toHaveBeenCalledWith({ name: "geolocation" });
    });

    it("falls back to unsupported when the permission lookup throws", async () => {
      vi.stubGlobal("navigator", {
        permissions: { query: vi.fn().mockRejectedValue(new Error("boom")) },
      });

      await expect(getGeolocationPermissionState()).resolves.toBe("unsupported");
    });
  });

  describe("requestCurrentPosition", () => {
    it("returns unsupported when geolocation is unavailable", async () => {
      vi.stubGlobal("navigator", {});

      await expect(requestCurrentPosition()).resolves.toEqual({ status: "unsupported" });
    });

    it("returns coordinates from a one-shot geolocation request", async () => {
      const getCurrentPosition = vi.fn(
        (
          success: PositionCallback,
          _error: PositionErrorCallback | null | undefined,
          options?: PositionOptions,
        ) => {
          success({
            coords: {
              latitude: 53.3498,
              longitude: -6.2603,
              accuracy: 120,
              altitude: null,
              altitudeAccuracy: null,
              heading: null,
              speed: null,
              toJSON: () => ({}),
            },
            timestamp: Date.now(),
            toJSON: () => ({}),
          });

          expect(options).toMatchObject({
            enableHighAccuracy: false,
            timeout: 8000,
            maximumAge: 300000,
          });
        },
      );

      vi.stubGlobal("navigator", {
        geolocation: { getCurrentPosition },
      });

      await expect(requestCurrentPosition()).resolves.toEqual({
        status: "success",
        coordinates: {
          latitude: 53.3498,
          longitude: -6.2603,
          accuracy: 120,
        },
      });
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    });

    it("maps browser denial and availability failures to stable app states", async () => {
      const getCurrentPosition = vi.fn(
        (
          _success: PositionCallback,
          error: PositionErrorCallback | null | undefined,
        ) => {
          error?.({
            code: 1,
            message: "denied",
            PERMISSION_DENIED: 1,
            POSITION_UNAVAILABLE: 2,
            TIMEOUT: 3,
          });
        },
      );

      vi.stubGlobal("navigator", {
        geolocation: { getCurrentPosition },
      });

      await expect(requestCurrentPosition()).resolves.toEqual({ status: "denied" });
    });
  });

  describe("detectHomeBaseFromCurrentArea", () => {
    it("returns a normalized coarse label and state code from the one-shot location flow", async () => {
      vi.stubGlobal("navigator", {
        geolocation: {
          getCurrentPosition: (success: PositionCallback) => {
            success({
              coords: {
                latitude: 37.8044,
                longitude: -122.2712,
                accuracy: 120,
                altitude: null,
                altitudeAccuracy: null,
                heading: null,
                speed: null,
                toJSON: () => ({}),
              },
              timestamp: Date.now(),
              toJSON: () => ({}),
            });
          },
        },
      });
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

      await expect(detectHomeBaseFromCurrentArea(fetchImpl)).resolves.toEqual({
        status: "success",
        homeBase: {
          city: "Oakland",
          region: "California",
          countryCode: "US",
          source: "geolocation",
        },
        stateCode: "CA",
      });
    });
  });
});