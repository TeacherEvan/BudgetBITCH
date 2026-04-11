export type LocationOption = {
  value: string;
  label: string;
};

export const countryOptions = [
  { value: "US", label: "United States" },
  { value: "CN", label: "China" },
] as const satisfies readonly LocationOption[];

const provinceOptionsByCountry: Record<string, readonly LocationOption[]> = {
  US: [
    { value: "CA", label: "California" },
    { value: "NY", label: "New York" },
    { value: "TX", label: "Texas" },
  ],
  CN: [
    { value: "BJ", label: "Beijing Municipality" },
    { value: "SH", label: "Shanghai Municipality" },
    { value: "GD", label: "Guangdong Province" },
  ],
};

const cityOptionsByCountryAndProvince: Record<
  string,
  Record<string, readonly LocationOption[]>
> = {
  US: {
    CA: [
      { value: "los-angeles", label: "Los Angeles" },
      { value: "san-francisco", label: "San Francisco" },
    ],
    NY: [{ value: "new-york-city", label: "New York City" }],
    TX: [
      { value: "houston", label: "Houston" },
      { value: "austin", label: "Austin" },
    ],
  },
  CN: {
    BJ: [{ value: "beijing", label: "Beijing" }],
    SH: [{ value: "shanghai", label: "Shanghai" }],
    GD: [
      { value: "guangzhou", label: "Guangzhou" },
      { value: "shenzhen", label: "Shenzhen" },
    ],
  },
};

function normalizeCountryCode(countryCode: string) {
  return countryCode.trim().toUpperCase();
}

function normalizeProvinceCode(provinceCode: string) {
  return provinceCode.trim().toUpperCase();
}

function normalizeCityCode(cityCode: string) {
  return cityCode.trim().toLowerCase();
}

export function getCountryOptions(): readonly LocationOption[] {
  return countryOptions;
}

export function getProvinceOptions(countryCode: string): readonly LocationOption[] {
  return provinceOptionsByCountry[normalizeCountryCode(countryCode)] ?? [];
}

export function getCityOptions(
  countryCode: string,
  provinceCode: string,
): readonly LocationOption[] {
  return (
    cityOptionsByCountryAndProvince[normalizeCountryCode(countryCode)]?.[
      normalizeProvinceCode(provinceCode)
    ] ?? []
  );
}

export function isSupportedCountryCode(countryCode: string) {
  return getCountryOptions().some((option) => option.value === normalizeCountryCode(countryCode));
}

export function isSupportedProvinceCode(countryCode: string, provinceCode: string) {
  return getProvinceOptions(countryCode).some(
    (option) => option.value === normalizeProvinceCode(provinceCode),
  );
}

export function isSupportedCityCode(countryCode: string, provinceCode: string, cityCode: string) {
  return getCityOptions(countryCode, provinceCode).some(
    (option) => option.value === normalizeCityCode(cityCode),
  );
}

export function hasCityOptions(countryCode: string, provinceCode: string) {
  return getCityOptions(countryCode, provinceCode).length > 0;
}

export function buildRegionKey(countryCode: string, provinceCode: string) {
  return normalizeCountryCode(countryCode).toLowerCase() + "-" + normalizeProvinceCode(provinceCode).toLowerCase();
}

export function buildLocationKey(countryCode: string, provinceCode: string, cityCode?: string | null) {
  const regionKey = buildRegionKey(countryCode, provinceCode);
  const normalizedCityCode = cityCode ? normalizeCityCode(cityCode) : "";

  return normalizedCityCode ? regionKey + "-" + normalizedCityCode : regionKey;
}
