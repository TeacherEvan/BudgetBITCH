import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotesPage from "./page";

describe("NotesPage", () => {
  it("renders the page heading", () => {
    render(<NotesPage />);
    expect(screen.getByTestId("mobile-panel-frame")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "Notes" })).toBeInTheDocument();
  });

  it("renders the notes board", () => {
    render(<NotesPage />);
    expect(screen.getByRole("region", { name: /notes board/i })).toBeInTheDocument();
  });
});
