import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import NotesPage from "./page";

describe("NotesPage", () => {
  it("renders the page heading", () => {
    render(<NotesPage />);
    expect(screen.getByRole("heading", { name: /notes/i })).toBeInTheDocument();
  });

  it("renders the notes board", () => {
    render(<NotesPage />);
    expect(screen.getByRole("region", { name: /notes board/i })).toBeInTheDocument();
  });
});
