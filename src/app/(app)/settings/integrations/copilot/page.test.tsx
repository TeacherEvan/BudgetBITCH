import { render, screen } from "@testing-library/react";
import CopilotIntegrationPage from "./page";

describe("CopilotIntegrationPage", () => {
    it("renders the Copilot setup wizard with system access guidance", () => {
        render(<CopilotIntegrationPage />);

        expect(
            screen.getByRole("heading", { name: "Connect GitHub Copilot" }),
        ).toBeInTheDocument();
        expect(screen.getByText("System access warning")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Review extension, repository, and prompt access before enabling GitHub Copilot.",
            ),
        ).toBeInTheDocument();
    });
});
