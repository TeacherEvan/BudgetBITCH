import { describe, expect, it } from "vitest";
import {
  buildLocationKey,
  getCityOptions,
  getCountryOptions,
  getProvinceOptions,
} from "./location-catalog";

describe("location catalog", () => {
  it("exposes country and province options for the supported locations", () => {
    expect(getCountryOptions()).toEqual([
      { value: "US", label: "United States" },
      { value: "CN", label: "China" },
    ]);
    expect(getProvinceOptions("US").map((option) => option.value)).toEqual(["CA", "NY", "TX"]);
    expect(getProvinceOptions("CN").map((option) => option.value)).toEqual(["BJ", "SH", "GD"]);
  });

  it("exposes city options only for US and China big-city paths", () => {
    expect(getCityOptions("US", "CA").map((option) => option.value)).toEqual([
      "los-angeles",
      "san-francisco",
    ]);
    expect(getCityOptions("CN", "GD").map((option) => option.value)).toEqual([
      "guangzhou",
      "shenzhen",
    ]);
    expect(getCityOptions("US", "ZZ")).toEqual([]);
  });

  it("builds stable location keys", () => {
    expect(buildLocationKey("US", "CA")).toBe("us-ca");
    expect(buildLocationKey("US", "CA", "los-angeles")).toBe("us-ca-los-angeles");
    expect(buildLocationKey("CN", "GD", "Shenzhen")).toBe("cn-gd-shenzhen");
  });
});
