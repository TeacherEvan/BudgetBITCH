import { providerRegistry } from "@/modules/integrations/provider-registry";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderCard } from "./provider-card";

describe("ProviderCard", () => {
  it("renders setup wizard entry points for providers with an internal flow", () => {
    render(<ProviderCard provider={providerRegistry.openai} />);

    expect(screen.getByRole("heading", { level: 3, name: "OpenAI" })).toBeInTheDocument();
    expect(screen.getByText("Prompt-heavy tools and assistant access.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /setup wizard/i })).toHaveAttribute(
      "href",
      "/settings/integrations/openai",
    );
    expect(screen.getByRole("link", { name: "Official login" })).toHaveAttribute(
      "href",
      providerRegistry.openai.officialLoginUrl,
    );
  });

  it("renders guidance-only links for providers without an internal setup flow", () => {
    render(<ProviderCard provider={providerRegistry.plaid} />);

    expect(screen.getByRole("heading", { level: 3, name: "Plaid" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /^setup wizard$/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /guidance only/i })).toHaveAttribute(
      "href",
      providerRegistry.plaid.officialDocsUrl,
    );
    expect(screen.getByText("Medium risk")).toBeInTheDocument();
  });
});
