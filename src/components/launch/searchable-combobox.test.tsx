import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchableCombobox } from "./searchable-combobox";

const options = [
  {
    value: "dublin_ie",
    label: "Dublin",
    description: "Leinster, Ireland",
    keywords: ["dublin"],
  },
  {
    value: "toronto_ca",
    label: "Toronto",
    description: "Ontario, Canada",
    keywords: ["toronto"],
  },
];

describe("SearchableCombobox", () => {
  it("opens, filters, and commits a selection", async () => {
    const onChange = vi.fn();

    render(
      <SearchableCombobox label="City" value="" onChange={onChange} loadOptions={async () => options} />,
    );

    fireEvent.focus(screen.getByRole("combobox", { name: /city/i }));
    fireEvent.change(screen.getByRole("combobox", { name: /city/i }), {
      target: { value: "Dub" },
    });

    expect(await screen.findByRole("option", { name: /dublin/i })).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole("combobox", { name: /city/i }), { key: "ArrowDown" });
    fireEvent.keyDown(screen.getByRole("combobox", { name: /city/i }), { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith("dublin_ie");
  });

});