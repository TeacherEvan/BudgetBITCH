import { describe, expect, it } from "vitest";
import {
  getStartSmartTemplate,
  listStartSmartTemplateCards,
} from "./template-catalog";

describe("template-catalog", () => {
  it("exposes both household and high-friction templates", () => {
    const cards = listStartSmartTemplateCards();

    expect(cards.some((card) => card.id === "single_teen")).toBe(true);
    expect(cards.some((card) => card.id === "entrepreneur")).toBe(true);
    expect(cards.some((card) => card.id === "housing_insecure")).toBe(true);
  });

  it("returns template defaults by id", () => {
    expect(getStartSmartTemplate("family_with_pets")?.lane).toBe("household");
  });
});
