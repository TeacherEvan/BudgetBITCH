import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

describe("DashboardPage", () => {
    it("renders the main spectacle cards", () => {
        render(<DashboardPage />);

        expect(screen.getByText("Treasure Map")).toBeInTheDocument();
        expect(screen.getByText("Luck Meter")).toBeInTheDocument();
        expect(screen.getByText("Bills Due Soon")).toBeInTheDocument();
        expect(screen.getByText("Money Survival Blueprint")).toBeInTheDocument();
        expect(screen.getAllByRole("link", { name: /start smart/i })).toHaveLength(2);
        expect(screen.getByText("Learn!")).toBeInTheDocument();
        expect(screen.getAllByRole("link", { name: /open learn/i })).toHaveLength(2);
        expect(screen.getByText("Jobs")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /open jobs/i })).toBeInTheDocument();
        expect(screen.getByText("Connected Finance")).toBeInTheDocument();
        expect(screen.getByRole("link", { name: /open hub/i })).toBeInTheDocument();
    });
});
