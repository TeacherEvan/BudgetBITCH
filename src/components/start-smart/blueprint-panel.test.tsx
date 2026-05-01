import { render, screen, within } from "@testing-library/react";
import { BlueprintPanel } from "./blueprint-panel";

describe("BlueprintPanel", () => {
  it("renders compact blueprint cards while preserving all result groups", () => {
    render(
      <BlueprintPanel
        blueprint={{
          priorityStack: ["cover_essentials"],
          riskWarnings: ["high_debt_pressure"],
          next7Days: ["List all fixed bills"],
          next30Days: ["Build starter emergency buffer"],
          learnModuleKeys: ["budgeting_basics"],
          recommendedIntegrations: ["openai"],
        }}
        assumptions={[
          {
            label: "Housing",
            confidence: "verified",
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("heading", { level: 2, name: "First moves" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Priorities" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Watchouts" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Next 7 days" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Next 30 days" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Learn next" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Integrations" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Assumption quality" }),
    ).toBeInTheDocument();
    expect(screen.getByText("cover_essentials")).toBeInTheDocument();
    expect(screen.getByText("high_debt_pressure")).toBeInTheDocument();
    expect(screen.getByText("List all fixed bills")).toBeInTheDocument();
    expect(screen.getByText("Build starter emergency buffer")).toBeInTheDocument();
    expect(screen.getByText("openai")).toBeInTheDocument();
  });

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
      name: "First moves",
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
