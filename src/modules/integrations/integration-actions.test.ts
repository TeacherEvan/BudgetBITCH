import { describe, expect, it } from "vitest";
import { providerRegistry } from "./provider-registry";
import { buildProviderActionDeck } from "./integration-actions";

describe("buildProviderActionDeck", () => {
  it("prefers the setup wizard for providers that have an internal flow", () => {
    const deck = buildProviderActionDeck(providerRegistry.openai);

    expect(deck.primary).toEqual({
      kind: "primary",
      label: "Open setup wizard",
      href: "/settings/integrations/openai",
    });
    expect(deck.secondary).toEqual({
      kind: "secondary",
      label: "Open official login",
      href: providerRegistry.openai.officialLoginUrl,
    });
    expect(deck.tertiary).toEqual({
      kind: "tertiary",
      label: "Open official docs",
      href: providerRegistry.openai.officialDocsUrl,
    });
  });

  it("uses official docs as the primary action for guidance-only providers", () => {
    const deck = buildProviderActionDeck(providerRegistry.plaid);

    expect(deck.primary).toEqual({
      kind: "primary",
      label: "Open official docs",
      href: providerRegistry.plaid.officialDocsUrl,
    });
    expect(deck.secondary).toEqual({
      kind: "secondary",
      label: "Open official login",
      href: providerRegistry.plaid.officialLoginUrl,
    });
    expect(deck.tertiary).toBeUndefined();
  });
});
