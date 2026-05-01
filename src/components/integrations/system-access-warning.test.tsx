import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SystemAccessWarning } from "./system-access-warning";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      systemAccessWarning: "System access warning",
    };

    return translations[key] ?? key;
  },
}));

describe("SystemAccessWarning", () => {
  it("splits full-width colon warnings into a short heading and detail", () => {
    render(
      <SystemAccessWarning message="系统范围：在启用 OpenClaw 前，确认本地系统访问、数据路径和模型路由。" />,
    );

    expect(screen.getByRole("heading", { name: "System access warning" })).toBeInTheDocument();
    expect(screen.getByText("系统范围")).toBeInTheDocument();
    expect(
      screen.getByText("在启用 OpenClaw 前，确认本地系统访问、数据路径和模型路由。"),
    ).toBeInTheDocument();
  });
});