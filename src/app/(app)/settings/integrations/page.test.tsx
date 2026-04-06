import { render, screen } from "@testing-library/react";
import IntegrationsPage from "./page";

describe("IntegrationsPage", () => {
    it("renders provider cards for the supported integrations", () => {
        render(<IntegrationsPage />);

        expect(screen.getByText("Claude")).toBeInTheDocument();
        expect(screen.getByText("OpenAI")).toBeInTheDocument();
        expect(screen.getByText("GitHub Copilot")).toBeInTheDocument();
        expect(screen.getByText("OpenClaw")).toBeInTheDocument();
        expect(screen.getByText("Plaid")).toBeInTheDocument();
        expect(screen.getByText("Vanguard")).toBeInTheDocument();
        expect(screen.getByText("Stripe")).toBeInTheDocument();
        expect(screen.getByText("Ramp")).toBeInTheDocument();
        expect(screen.getByText("Gusto")).toBeInTheDocument();
        expect(screen.getAllByText("No silent sharing")).toHaveLength(10);
    });
});
