import type { ProviderDefinition } from "./provider-types";

export type ProviderAction = {
  kind: "primary" | "secondary" | "tertiary";
  label: string;
  href: string;
};

export type ProviderActionDeck = {
  primary: ProviderAction;
  secondary: ProviderAction;
  tertiary?: ProviderAction;
};

export function buildProviderActionDeck(
  provider: ProviderDefinition,
): ProviderActionDeck {
  if (provider.setupPath) {
    return {
      primary: {
        kind: "primary",
        label: "Open setup wizard",
        href: provider.setupPath,
      },
      secondary: {
        kind: "secondary",
        label: "Open official login",
        href: provider.officialLoginUrl,
      },
      tertiary: {
        kind: "tertiary",
        label: "Open official docs",
        href: provider.officialDocsUrl,
      },
    };
  }

  return {
    primary: {
      kind: "primary",
      label: "Open official docs",
      href: provider.officialDocsUrl,
    },
    secondary: {
      kind: "secondary",
      label: "Open official login",
      href: provider.officialLoginUrl,
    },
  };
}
