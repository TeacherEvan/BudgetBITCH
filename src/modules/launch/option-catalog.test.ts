import { describe, expect, it } from "vitest";
import { listLaunchCityOptions, loadLaunchCityOptions } from "./option-catalog";

describe("launch option catalog", () => {
  it("returns a stable curated city option list", () => {
    const options = listLaunchCityOptions();

    expect(options[0]).toMatchObject({
      label: expect.any(String),
      value: expect.any(String),
      keywords: expect.any(Array),
    });
    expect(options.length).toBeGreaterThanOrEqual(24);
    expect(options.some((option) => option.value === "dublin_ie")).toBe(true);
    expect(options.some((option) => option.value === "singapore_sg")).toBe(true);
    expect(options.some((option) => option.value === "mexico_city_mx")).toBe(true);
  });

  it("loads deferred city options", async () => {
    const options = await loadLaunchCityOptions();

    expect(options).toEqual(listLaunchCityOptions());
  });
});