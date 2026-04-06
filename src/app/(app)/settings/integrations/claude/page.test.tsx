import { render, screen } from "@testing-library/react";
import ClaudeIntegrationPage from "./page";

describe("ClaudeIntegrationPage", () => {
    it("renders the Claude setup wizard with privacy disclosures and official links", () => {
        render(<ClaudeIntegrationPage />);

        expect(screen.getByRole("heading", { name: "Connect Claude" })).toBeInTheDocument();
        expect(
            screen.getByText(
                "Only explicitly connected providers receive the minimum required data.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Official login" })).toHaveAttribute(
            "href",
            expect.stringContaining("platform.claude.com"),
        );
    });
});
