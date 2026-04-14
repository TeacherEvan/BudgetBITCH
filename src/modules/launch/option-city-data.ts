export type LaunchCityOption = {
  value: string;
  label: string;
  regionLabel: string;
  countryCode: string;
  keywords: string[];
};

export const launchCityOptions: LaunchCityOption[] = [
  {
    value: "dublin_ie",
    label: "Dublin",
    regionLabel: "Leinster, Ireland",
    countryCode: "IE",
    keywords: ["dublin", "ireland", "leinster"],
  },
  {
    value: "los_angeles_us",
    label: "Los Angeles",
    regionLabel: "California, United States",
    countryCode: "US",
    keywords: ["los angeles", "la", "california", "united states"],
  },
  {
    value: "toronto_ca",
    label: "Toronto",
    regionLabel: "Ontario, Canada",
    countryCode: "CA",
    keywords: ["toronto", "ontario", "canada"],
  },
];