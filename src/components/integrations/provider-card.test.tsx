import { providerRegistry } from "@/modules/integrations/provider-registry";
import { render, screen, within } from "@testing-library/react";
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

  it("keeps quick actions out of the card heading outline", () => {
    render(<ProviderCard provider={providerRegistry.openai} />);

    const card = screen.getByRole("heading", { level: 3, name: "OpenAI" }).closest("article");

    expect(card).not.toBeNull();
    expect(within(card as HTMLElement).getByText("Quick actions")).toBeInTheDocument();
    expect(
      within(card as HTMLElement).queryByRole("heading", { name: "Quick actions" }),
    ).not.toBeInTheDocument();
  });
});
