import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NotesBoard } from "./notes-board";

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

beforeEach(() => {
  Object.defineProperty(window, "localStorage", {
    value: localStorageMock,
    writable: true,
  });
  localStorageMock.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("NotesBoard", () => {
  it("shows an empty state message when no notes exist", () => {
    render(<NotesBoard />);
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
  });

  it("adds a note when the user types and clicks Add note", () => {
    render(<NotesBoard />);
    const input = screen.getByRole("textbox", { name: /new note/i });
    fireEvent.change(input, { target: { value: "Buy groceries" } });
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(screen.getByText("Buy groceries")).toBeInTheDocument();
  });

  it("clears the input after adding a note", () => {
    render(<NotesBoard />);
    const input = screen.getByRole("textbox", { name: /new note/i });
    fireEvent.change(input, { target: { value: "Test entry" } });
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(input).toHaveValue("");
  });

  it("removes a note when Delete is clicked", () => {
    render(<NotesBoard />);
    const input = screen.getByRole("textbox", { name: /new note/i });
    fireEvent.change(input, { target: { value: "Temporary note" } });
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    fireEvent.click(screen.getByRole("button", { name: /delete temporary note/i }));
    expect(screen.queryByText("Temporary note")).not.toBeInTheDocument();
  });

  it("does not add an empty note", () => {
    render(<NotesBoard />);
    fireEvent.click(screen.getByRole("button", { name: /add note/i }));
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
  });
});
