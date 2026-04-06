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
});
