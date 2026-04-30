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

export type ProviderActionLabels = {
  openSetupWizard: string;
  openOfficialLogin: string;
  openOfficialDocs: string;
};

const defaultProviderActionLabels: ProviderActionLabels = {
  openSetupWizard: "Open setup wizard",
  openOfficialLogin: "Open official login",
  openOfficialDocs: "Open official docs",
};

export function buildProviderActionDeck(
  provider: ProviderDefinition,
  labels: ProviderActionLabels = defaultProviderActionLabels,
): ProviderActionDeck {
  if (provider.setupPath) {
    return {
      primary: {
        kind: "primary",
        label: labels.openSetupWizard,
        href: provider.setupPath,
      },
      secondary: {
        kind: "secondary",
        label: labels.openOfficialLogin,
        href: provider.officialLoginUrl,
      },
      tertiary: {
        kind: "tertiary",
        label: labels.openOfficialDocs,
        href: provider.officialDocsUrl,
      },
    };
  }

  return {
    primary: {
      kind: "primary",
      label: labels.openOfficialDocs,
      href: provider.officialDocsUrl,
    },
    secondary: {
      kind: "secondary",
      label: labels.openOfficialLogin,
      href: provider.officialLoginUrl,
    },
  };
}

export function buildProviderActionList(
  provider: ProviderDefinition,
  labels?: ProviderActionLabels,
): ProviderAction[] {
  const deck = buildProviderActionDeck(provider, labels);

  return [deck.primary, deck.secondary, deck.tertiary].filter(
    (action): action is ProviderAction => Boolean(action),
  );
}
