import { render, screen } from "@testing-library/react";
import { BlueprintPanel } from "./blueprint-panel";

describe("BlueprintPanel", () => {
  it("renders Learn lesson links instead of plain recommendation text", () => {
    render(
      <BlueprintPanel
        blueprint={{
          priorityStack: ["cover_essentials"],
          riskWarnings: ["high_debt_pressure"],
          next7Days: ["List all fixed bills"],
          next30Days: ["Build starter emergency buffer"],
          learnModuleKeys: ["budgeting_basics", "debt_triage"],
          recommendedIntegrations: ["openai"],
        }}
      />,
    );

    expect(
      screen.getByRole("link", { name: /budgeting basics/i }),
    ).toHaveAttribute("href", "/learn/budgeting-basics");
    expect(screen.getByRole("link", { name: /debt triage/i })).toHaveAttribute(
      "href",
      "/learn/debt-triage",
    );
  });
});
