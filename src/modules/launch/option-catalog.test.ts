import { describe, expect, it } from "vitest";
import { asiaCountryCodes } from "@/modules/start-smart/country-options";
import { listLaunchCityOptions, loadLaunchCityOptions } from "./option-catalog";

const firstWaveAsiaCities = [
  "Osaka",
  "Busan",
  "Bangkok",
  "Chiang Mai",
  "Manila",
  "Cebu",
  "Jakarta",
  "Bandung",
  "Kuala Lumpur",
  "Penang",
  "Ho Chi Minh City",
  "Hanoi",
  "Mumbai",
  "Bengaluru",
  "Delhi",
  "Hyderabad",
  "Hong Kong",
  "Taipei",
];

describe("launch option catalog", () => {
  it("includes at least 12 Asia-region city options", () => {
    const options = listLaunchCityOptions().filter((option) => asiaCountryCodes.has(option.countryCode));
    const labels = options.map((option) => option.label);

    expect(options.length).toBeGreaterThanOrEqual(firstWaveAsiaCities.length);
    expect(labels).toEqual(expect.arrayContaining(firstWaveAsiaCities));
  });

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