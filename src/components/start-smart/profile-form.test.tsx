import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StartSmartProfileInput } from "@/modules/start-smart/profile-schema";
import { ProfileForm } from "./profile-form";

const blankProfile: StartSmartProfileInput = {
  countryCode: "",
  stateCode: "",
  cityCode: "",
  ageBand: "adult",
  housing: "renting",
  adults: 1,
  dependents: 0,
  pets: 0,
  incomePattern: "steady",
  debtLoad: "low",
  goals: ["emergency_fund"],
  benefitsSupport: ["none"],
  preferredIntegrations: [],
};

describe("ProfileForm", () => {
  it("renders dependent location selects and keeps city hidden until a matching province is chosen", () => {
    const onChange = vi.fn();

    render(<ProfileForm values={blankProfile} onChange={onChange} />);

    expect(screen.getByLabelText(/^Country$/i)).toHaveValue("");
    expect(screen.getByLabelText(/^Province or state$/i)).toBeDisabled();
    expect(screen.queryByLabelText(/^city$/i)).not.toBeInTheDocument();
  });

  it("shows big-city options for US and China province selections", () => {
    const onChange = vi.fn();

    render(
      <ProfileForm
        values={{
          ...blankProfile,
          countryCode: "US",
          stateCode: "CA",
        }}
        onChange={onChange}
      />,
    );

    expect(screen.getByLabelText(/^Province or state$/i)).toBeEnabled();
    expect(screen.getByLabelText(/^City$/i)).toBeEnabled();
    expect(screen.getByRole("option", { name: "Los Angeles" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "San Francisco" })).toBeInTheDocument();
  });

  it("emits select values for location changes", () => {
    const onChange = vi.fn();

    render(<ProfileForm values={blankProfile} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText(/^Country$/i), { target: { value: "CN" } });
    expect(onChange).toHaveBeenCalledWith("countryCode", "CN");
  });
});
