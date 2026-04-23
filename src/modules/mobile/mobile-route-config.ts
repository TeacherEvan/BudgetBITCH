export type MobileRouteConfigItem = {
  readonly href: string;
  readonly label: string;
};

export const mobileRouteConfig: readonly MobileRouteConfigItem[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/start-smart", label: "Start Smart" },
  { href: "/calculator", label: "Calculator" },
  { href: "/notes", label: "Notes" },
  { href: "/learn", label: "Learn" },
  { href: "/settings/integrations", label: "Integrations" },
  { href: "/jobs", label: "Jobs" },
];