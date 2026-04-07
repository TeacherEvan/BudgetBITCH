import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RiskChecklist } from "./risk-checklist";

describe("RiskChecklist", () => {
    it("renders the checklist title and preserves item order", () => {
        const items = [
            "Confirm repository access.",
            "Use only the official login flow.",
            "Revoke access if trust changes.",
        ];

        render(<RiskChecklist title="Risk checklist" items={items} />);

        expect(screen.getByRole("heading", { name: "Risk checklist" })).toBeInTheDocument();
        const renderedItems = screen.getAllByRole("listitem").map((item) => item.textContent);
        expect(renderedItems).toEqual(items);
    });
});