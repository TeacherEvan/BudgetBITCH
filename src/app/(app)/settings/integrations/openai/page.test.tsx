import { render, screen } from "@testing-library/react";
import OpenAiIntegrationPage from "./page";

describe("OpenAiIntegrationPage", () => {
  it("renders the OpenAI setup wizard with privacy disclosures and official links", () => {
    render(<OpenAiIntegrationPage />);

    expect(screen.getByRole("heading", { name: "Connect OpenAI" })).toBeInTheDocument();
    expect(
      screen.getByText("Only explicitly connected providers receive the minimum required data."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Official login" })).toHaveAttribute(
      "href",
      expect.stringContaining("platform.openai.com"),
    );
    expect(screen.getByRole("link", { name: "Official docs" })).toHaveAttribute(
      "href",
      expect.stringContaining("platform.openai.com"),
    );
  });
});
