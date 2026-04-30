import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HOME_LOCATION_STORAGE_KEY } from "@/modules/home-location/home-location";
import LaunchWizard, { LAUNCH_PROFILE_STORAGE_KEY } from "./launch-wizard";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      kicker: "Startup questionnaire",
      title: "Ballpark expenses",
      description:
        "Add rough recurring costs first so BudgetBITCH can open with a practical money baseline instead of a blank board.",
      topCategoriesTitle: "Common expense titles",
      entryLabel: "Expense title",
      entryPlaceholder: "Search or select a common expense",
      customTitleLabel: "Custom expense title",
      customTitlePlaceholder: "Use this when the list does not fit",
      amountLabel: "Rough monthly amount",
      addExpense: "Add expense",
      finish: "Finish startup",
      summaryTitle: "Ballpark entries",
      emptySummary: "No expenses added yet.",
      helperTitle: "Why this comes first",
      helperDescription:
        "This first popup stays lightweight: rough categories, rough amounts, then the normal app flow.",
      currentCountLabel: "Saved categories",
      amountPrefix: "$",
      "errors.titleRequired": "Choose a common expense title or enter a custom one.",
      "errors.amountRequired": "Enter a rough monthly amount greater than zero.",
      "errors.atLeastOne": "Add at least one ballpark expense before finishing startup.",
      "categories.rentMortgage": "Rent or mortgage",
      "categories.groceries": "Groceries",
      "categories.utilities": "Utilities",
      "categories.transportFuel": "Transport or fuel",
      "categories.phoneInternet": "Phone or internet",
      "categories.insurance": "Insurance",
      "categories.debtPayments": "Debt payments",
      "categories.healthcare": "Healthcare",
      "categories.childcareFamilySupport": "Childcare or family support",
      "categories.funEntertainment": "Fun or entertainment",
    };

    return translations[key] ?? key;
  },
}));

describe("LaunchWizard", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("captures repeated ballpark expenses and stores a completed startup profile", async () => {
    const onComplete = vi.fn();
    window.localStorage.setItem(
      HOME_LOCATION_STORAGE_KEY,
      JSON.stringify({ countryCode: "TH", stateCode: "10", city: "Bangkok" }),
    );

    render(<LaunchWizard onComplete={onComplete} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /ballpark expenses/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/common expense titles/i)).toBeInTheDocument();
    expect(screen.getByText("Bangkok, 10, Thailand")).toBeInTheDocument();

    const expenseTitle = screen.getByRole("combobox", { name: /expense title/i });
    const amountInput = screen.getByLabelText(/rough monthly amount/i);

    fireEvent.focus(expenseTitle);
    fireEvent.click(await screen.findByRole("option", { name: /rent or mortgage/i }));
    fireEvent.change(amountInput, { target: { value: "1200" } });
    fireEvent.click(screen.getByRole("button", { name: /add expense/i }));

    fireEvent.change(screen.getByLabelText(/custom expense title/i), {
      target: { value: "Pet care" },
    });
    fireEvent.change(amountInput, { target: { value: "75" } });
    fireEvent.click(screen.getByRole("button", { name: /add expense/i }));

    expect(screen.getByText(/^2$/i, { selector: "p" })).toBeInTheDocument();
    expect(screen.getByText(/^Pet care$/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /finish startup/i }));

    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith(
      expect.objectContaining({
        completed: true,
        expenses: [
          { title: "Rent or mortgage", amount: 1200 },
          { title: "Pet care", amount: 75 },
        ],
      }),
    );

    expect(
      JSON.parse(window.localStorage.getItem(LAUNCH_PROFILE_STORAGE_KEY) ?? "null"),
    ).toMatchObject({
        completed: true,
        expenses: [
          { title: "Rent or mortgage", amount: 1200 },
          { title: "Pet care", amount: 75 },
        ],
      });
  });

  it("blocks startup completion until at least one expense is added", () => {
    const onComplete = vi.fn();

    render(<LaunchWizard onComplete={onComplete} />);

    fireEvent.click(screen.getByRole("button", { name: /finish startup/i }));

    expect(screen.getByRole("alert")).toHaveTextContent(/add at least one ballpark expense/i);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
