import { render, screen, within } from "@testing-library/react";
import { BlueprintPanel } from "./blueprint-panel";

describe("BlueprintPanel", () => {
  it("renders Learn lesson links inside the blueprint Learn next section", () => {
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

    const blueprintSectionHeading = screen.getByRole("heading", {
      level: 2,
      name: "What must I cover first?",
    });
    const blueprintSection = blueprintSectionHeading.closest("section");

    expect(blueprintSection).not.toBeNull();

    const learnNextHeading = within(blueprintSection as HTMLElement).getByRole(
      "heading",
      {
        level: 3,
        name: "Learn next",
      },
    );
    const learnNextSection = learnNextHeading.closest("article");

    expect(learnNextSection).not.toBeNull();

    expect(
      within(learnNextSection as HTMLElement).getByRole("link", {
        name: /budgeting basics/i,
      }),
    ).toHaveAttribute("href", "/learn/budgeting-basics");
    expect(
      within(learnNextSection as HTMLElement).getByRole("link", {
        name: /debt triage/i,
      }),
    ).toHaveAttribute("href", "/learn/debt-triage");
  });
});
