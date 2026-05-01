import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RiskChecklist } from "./risk-checklist";

describe("RiskChecklist", () => {
    it("renders short risk bullets with clear headings and preserves item order", () => {
        const items = [
            "Repository reach: Confirm repository access.",
            "Official flow：Use only the official login flow.",
            "Revoke path: Revoke access if trust changes.",
        ];

        render(<RiskChecklist title="Risk checklist" items={items} />);

        expect(screen.getByRole("heading", { name: "Risk checklist" })).toBeInTheDocument();
        expect(screen.getByText("Repository reach")).toBeInTheDocument();
        expect(screen.getByText("Confirm repository access.")).toBeInTheDocument();
        expect(screen.getByText("Official flow")).toBeInTheDocument();
        expect(screen.getByText("Use only the official login flow.")).toBeInTheDocument();
        const renderedItems = screen.getAllByRole("listitem").map((item) => item.textContent);
        expect(renderedItems).toEqual([
            "Repository reachConfirm repository access.",
            "Official flowUse only the official login flow.",
            "Revoke pathRevoke access if trust changes.",
        ]);
    });
});