import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearHomeBase,
  getHomeBaseSnapshot,
  loadHomeBase,
  saveHomeBase,
  subscribeToHomeBase,
} from "./home-base-store";

describe("home-base-store", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("drops corrupted payloads instead of throwing", () => {
    window.localStorage.setItem("budgetbitch:home-base", JSON.stringify({ nope: true }));

    expect(loadHomeBase()).toBeNull();
    expect(window.localStorage.getItem("budgetbitch:home-base")).toBeNull();
  });

  it("stores only the coarse label fields", () => {
    saveHomeBase({
      city: "Phoenix",
      region: "Arizona",
      countryCode: "US",
      source: "manual",
    });

    expect(loadHomeBase()).toMatchObject({
      city: "Phoenix",
      region: "Arizona",
      countryCode: "US",
      label: "Phoenix, Arizona, US",
      source: "manual",
    });

    clearHomeBase();
    expect(loadHomeBase()).toBeNull();
  });

  it("notifies subscribers when the stored home base changes", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToHomeBase(listener);

    saveHomeBase({
      city: "Tempe",
      region: "Arizona",
      countryCode: "US",
      source: "geolocation",
    });

    expect(getHomeBaseSnapshot()).toMatchObject({
      label: "Tempe, Arizona, US",
      source: "geolocation",
    });

    saveHomeBase({
      city: "Bangkok",
      region: "Bangkok Metropolitan Region",
      countryCode: "TH",
      source: "manual",
    });

    expect(getHomeBaseSnapshot()).toMatchObject({
      label: "Bangkok, Bangkok Metropolitan Region, TH",
      source: "manual",
    });

    clearHomeBase();

    expect(listener).toHaveBeenCalledTimes(3);
    expect(getHomeBaseSnapshot()).toBeNull();

    unsubscribe();
  });
});