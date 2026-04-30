import { describe, expect, it } from "vitest";
import {
  getAuthenticatedUserDisplayName,
  getAuthenticatedUserEmail,
  getAuthenticatedUserId,
} from "./session";

describe("session helpers", () => {
  it("reads the app user id and verified email from an Auth.js session", () => {
    const session = {
      user: {
        id: "user_123",
        email: "alex@example.com",
        name: "Alex Example",
        emailVerified: true,
      },
    };

    expect(getAuthenticatedUserId(session)).toBe("user_123");
    expect(getAuthenticatedUserEmail(session)).toBe("alex@example.com");
    expect(getAuthenticatedUserDisplayName(session)).toBe("Alex Example");
  });

  it("returns empty identity fields when the session is incomplete", () => {
    const session = {
      user: {
        id: "",
        email: "alex@example.com",
        name: "",
        emailVerified: false,
      },
    };

    expect(getAuthenticatedUserId(session)).toBe("");
    expect(getAuthenticatedUserEmail(session)).toBe("");
    expect(getAuthenticatedUserDisplayName(session)).toBeNull();
  });
});