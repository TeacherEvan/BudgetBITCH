export type MobileRouteConfigItem = {
  readonly href: string;
  readonly labelKey:
    | "dashboard"
    | "startSmart"
    | "calculator"
    | "notes"
    | "learn"
    | "integrations"
    | "jobs";
};

export const mobileRouteConfig: readonly MobileRouteConfigItem[] = [
  { href: "/dashboard", labelKey: "dashboard" },
  { href: "/start-smart", labelKey: "startSmart" },
  { href: "/calculator", labelKey: "calculator" },
  { href: "/notes", labelKey: "notes" },
  { href: "/learn", labelKey: "learn" },
  { href: "/settings/integrations", labelKey: "integrations" },
  { href: "/jobs", labelKey: "jobs" },
];