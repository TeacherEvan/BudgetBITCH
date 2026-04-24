import { describe, expect, it } from "vitest";

import { getClerkUserEmail, missingClerkUserEmailErrorMessage } from "./clerk-user";

describe("getClerkUserEmail", () => {
  it("returns the verified primary email when available", () => {
    expect(
      getClerkUserEmail({
        primaryEmailAddress: {
          emailAddress: "primary@example.com",
          verification: { status: "verified" },
        },
      }),
    ).toBe("primary@example.com");
  });

  it("falls back to the first verified secondary email", () => {
    expect(
      getClerkUserEmail({
        primaryEmailAddress: {
          emailAddress: "pending@example.com",
          verification: { status: "unverified" },
        },
        emailAddresses: [
          { emailAddress: "pending@example.com", verification: { status: "unverified" } },
          { emailAddress: "verified@example.com", verification: { status: "verified" } },
        ],
      }),
    ).toBe("verified@example.com");
  });

  it("falls back when the verified primary email is blank but a verified secondary exists", () => {
    expect(
      getClerkUserEmail({
        primaryEmailAddress: {
          emailAddress: "   ",
          verification: { status: "verified" },
        },
        emailAddresses: [
          { emailAddress: "verified@example.com", verification: { status: "verified" } },
        ],
      }),
    ).toBe("verified@example.com");
  });

  it("returns an empty string when no verified email exists", () => {
    expect(
      getClerkUserEmail({
        emailAddresses: [
          { emailAddress: "pending@example.com", verification: { status: "unverified" } },
        ],
      }),
    ).toBe("");
    expect(missingClerkUserEmailErrorMessage).toMatch(/verified email-backed clerk account/i);
  });
});