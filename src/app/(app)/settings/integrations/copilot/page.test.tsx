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

    it("renders the Copilot checklist items and official links", () => {
        render(<CopilotIntegrationPage />);

        expect(
            screen.getByText("Confirm which repositories and files the tool can inspect."),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Use only the official GitHub Copilot authentication flow."),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Revoke access immediately if the workspace no longer requires it.",
            ),
        ).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Official login" })).toHaveAttribute(
            "href",
            expect.stringContaining("github.com/features/copilot"),
        );
        expect(screen.getByRole("link", { name: "Official docs" })).toHaveAttribute(
            "href",
            expect.stringContaining("docs.github.com/en/copilot"),
        );
    });
});
