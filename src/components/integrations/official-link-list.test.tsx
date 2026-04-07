import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OfficialLinkList } from "./official-link-list";

describe("OfficialLinkList", () => {
    it("renders the official login and docs anchors using the provided URLs", () => {
        render(
            <OfficialLinkList
                loginUrl="https://example.com/login"
                docsUrl="https://example.com/docs"
            />,
        );

        expect(screen.getByRole("heading", { name: "Official links" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Official login" })).toHaveAttribute(
            "href",
            "https://example.com/login",
        );
        expect(screen.getByRole("link", { name: "Official docs" })).toHaveAttribute(
            "href",
            "https://example.com/docs",
        );
        expect(screen.queryByRole("link", { name: "Open setup wizard" })).not.toBeInTheDocument();
    });
});