import { describe, expect, it } from "vitest";

import {
  getAuthenticatedUserEmail,
  getAuthenticatedUserId,
} from "./session";

describe("session helpers", () => {
  it("reads the app user id and verified email from an Auth.js session", () => {
    const session = {
      user: {
        id: "user_123",
        email: "alex@example.com",
        emailVerified: true,
      },
    };

    expect(getAuthenticatedUserId(session)).toBe("user_123");
    expect(getAuthenticatedUserEmail(session)).toBe("alex@example.com");
  });

  it("returns empty email when the session email is not verified", () => {
    const session = {
      user: {
        id: "user_123",
        email: "alex@example.com",
        emailVerified: false,
      },
    };

    expect(getAuthenticatedUserEmail(session)).toBe("");
  });
});
