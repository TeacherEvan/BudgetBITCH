import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { WelcomeWindow } from "./welcome-window";

describe("WelcomeWindow", () => {
  it("renders the welcome heading with explicit auth links", () => {
    render(
      <WelcomeWindow
        signInHref="/sign-in?redirectTo=%2F"
        signUpHref="/sign-up?redirectTo=%2F"
      />,
    );

    expect(
      screen.getByRole("heading", { name: /open your budgetbitch board/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /open sign in/i })).toHaveAttribute(
      "href",
      "/sign-in?redirectTo=%2F",
    );
    expect(screen.getByRole("link", { name: /open sign-up/i })).toHaveAttribute(
      "href",
      "/sign-up?redirectTo=%2F",
    );
  });
});