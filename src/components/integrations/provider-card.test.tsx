import { providerRegistry } from "@/modules/integrations/provider-registry";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderCard } from "./provider-card";

describe("ProviderCard", () => {
    it("renders setup wizard entry points for providers with an internal flow", () => {
        render(<ProviderCard provider={providerRegistry.openai} />);

        expect(screen.getByRole("heading", { level: 3, name: "OpenAI" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Open setup wizard" })).toHaveAttribute(
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
        expect(screen.queryByRole("link", { name: "Open setup wizard" })).not.toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Guidance only" })).toHaveAttribute(
            "href",
            providerRegistry.plaid.officialDocsUrl,
        );
        expect(screen.getByText("Risk: medium")).toBeInTheDocument();
    });
});