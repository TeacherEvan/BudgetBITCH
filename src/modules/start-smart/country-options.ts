export type CountryOption = {
  code: string;
  label: string;
  regionExample: string;
  supportedRegionKey: string;
  isAsiaMarket: boolean;
};

export const countryOptions: CountryOption[] = [
  { code: "US", label: "United States", regionExample: "CA", supportedRegionKey: "us-ca", isAsiaMarket: false },
  { code: "JP", label: "Japan", regionExample: "13", supportedRegionKey: "jp-13", isAsiaMarket: true },
  { code: "KR", label: "South Korea", regionExample: "11", supportedRegionKey: "kr-11", isAsiaMarket: true },
  { code: "SG", label: "Singapore", regionExample: "01", supportedRegionKey: "sg-01", isAsiaMarket: true },
  { code: "TH", label: "Thailand", regionExample: "10", supportedRegionKey: "th-10", isAsiaMarket: true },
  { code: "PH", label: "Philippines", regionExample: "00", supportedRegionKey: "ph-00", isAsiaMarket: true },
  { code: "ID", label: "Indonesia", regionExample: "JK", supportedRegionKey: "id-jk", isAsiaMarket: true },
  { code: "MY", label: "Malaysia", regionExample: "14", supportedRegionKey: "my-14", isAsiaMarket: true },
  { code: "VN", label: "Vietnam", regionExample: "SG", supportedRegionKey: "vn-sg", isAsiaMarket: true },
  { code: "IN", label: "India", regionExample: "MH", supportedRegionKey: "in-mh", isAsiaMarket: true },
  { code: "HK", label: "Hong Kong", regionExample: "HK", supportedRegionKey: "hk-hk", isAsiaMarket: true },
  { code: "TW", label: "Taiwan", regionExample: "TPE", supportedRegionKey: "tw-tpe", isAsiaMarket: true },
];

export const asiaCountryCodes = new Set([
  ...countryOptions
    .filter((option) => option.isAsiaMarket)
    .map((option) => option.code),
]);