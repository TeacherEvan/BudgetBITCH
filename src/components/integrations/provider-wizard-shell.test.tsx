import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProviderWizardShell } from "./provider-wizard-shell";

describe("ProviderWizardShell", () => {
    it("renders the shell copy, back link, and arbitrary children", () => {
        render(
            <ProviderWizardShell
                eyebrow="OpenAI Setup"
                title="Connect OpenAI"
                description="Only connect providers you explicitly trust."
            >
                <div>Child panel one</div>
                <div>Child panel two</div>
            </ProviderWizardShell>,
        );

        expect(screen.getByText("OpenAI Setup")).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Connect OpenAI" })).toBeInTheDocument();
        expect(
            screen.getByText("Only connect providers you explicitly trust."),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Back to connection hub" })).toHaveAttribute(
            "href",
            "/settings/integrations",
        );
        expect(screen.getByText("Child panel one")).toBeInTheDocument();
        expect(screen.getByText("Child panel two")).toBeInTheDocument();
    });
});