import { render, screen } from "@testing-library/react";
import DashboardPage from "./page";

describe("DashboardPage", () => {
    it("renders the main spectacle cards", () => {
        render(<DashboardPage />);

        expect(screen.getByText("Treasure Map")).toBeInTheDocument();
        expect(screen.getByText("Luck Meter")).toBeInTheDocument();
        expect(screen.getByText("Bills Due Soon")).toBeInTheDocument();
    });
});
