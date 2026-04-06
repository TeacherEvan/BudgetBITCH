import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

describe("DashboardPage", () => {
    it("renders the main spectacle cards", () => {
        render(<DashboardPage />);

        expect(screen.getByText("Treasure Map")).toBeInTheDocument();
        expect(screen.getByText("Luck Meter")).toBeInTheDocument();
        expect(screen.getByText("Bills Due Soon")).toBeInTheDocument();
        expect(screen.getByText("Money Survival Blueprint")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /start smart/i })).toBeInTheDocument();
        expect(screen.getByText("Learn!")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /open learn/i })).toBeInTheDocument();
        expect(screen.getByText("Jobs")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /open jobs/i })).toBeInTheDocument();
        expect(screen.getByText("Connected Finance")).toBeInTheDocument();
    });
});
