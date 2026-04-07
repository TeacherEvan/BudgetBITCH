import { render, screen } from "@testing-library/react";
import OpenClawIntegrationPage from "./page";

describe("OpenClawIntegrationPage", () => {
    it("renders the OpenClaw setup wizard with high-risk warnings", () => {
        render(<OpenClawIntegrationPage />);

        expect(screen.getByRole("heading", { name: "Connect OpenClaw" })).toBeInTheDocument();
        expect(screen.getByText("High-risk connection")).toBeInTheDocument();
        expect(
            screen.getByText(
                "Verify local system access, data paths, and model routing before enabling OpenClaw.",
            ),
        ).toBeInTheDocument();
    });

    it("shows all high-risk checklist items and the official OpenClaw links", () => {
        render(<OpenClawIntegrationPage />);

        expect(
            screen.getByText("Check which local files, tools, or shells OpenClaw can reach."),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                "Confirm prompt routing and storage paths before enabling the integration.",
            ),
        ).toBeInTheDocument();
        expect(
            screen.getByText("Use one-click revoke if your trust model changes."),
        ).toBeInTheDocument();
        expect(screen.getByRole("heading", { name: "Privacy Shield" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Official login" })).toHaveAttribute(
            "href",
            expect.stringContaining("openclaw.ai"),
        );
        expect(screen.getByRole("link", { name: "Official docs" })).toHaveAttribute(
            "href",
            expect.stringContaining("openclaw.ai"),
        );
    });
});
