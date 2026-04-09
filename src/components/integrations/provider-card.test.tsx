import { providerRegistry } from "@/modules/integrations/provider-registry";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderCard } from "./provider-card";

describe("ProviderCard", () => {
  it("renders explicit setup and official action labels for internal flows", () => {
    render(<ProviderCard provider={providerRegistry.openai} />);

    expect(screen.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
      "href",
      "/settings/integrations/openai",
    );
    expect(screen.getByRole("link", { name: "Open official login" })).toHaveAttribute(
      "href",
      providerRegistry.openai.officialLoginUrl,
    );
    expect(screen.getByRole("link", { name: "Open official docs" })).toHaveAttribute(
      "href",
      providerRegistry.openai.officialDocsUrl,
    );
  });

  it("renders explicit docs and login labels for guidance-only providers", () => {
    render(<ProviderCard provider={providerRegistry.plaid} />);

    expect(screen.getByRole("link", { name: "Open official docs" })).toHaveAttribute(
      "href",
      providerRegistry.plaid.officialDocsUrl,
    );
    expect(screen.getByRole("link", { name: "Open official login" })).toHaveAttribute(
      "href",
      providerRegistry.plaid.officialLoginUrl,
    );
  });
});
