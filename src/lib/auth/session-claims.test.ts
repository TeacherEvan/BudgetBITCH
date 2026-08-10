import { describe, expect, it } from "vitest";

import {
  applyTokenClaimsFromProfile,
  getSessionUserFromToken,
  getTokenClaimsFromProfile,
} from "./session-claims";

describe("auth session claims", () => {
  it("keeps emailVerified false unless the token says the email was verified", () => {
    const token = {
      sub: "user_123",
      emailVerified: false,
    };

    expect(
      getSessionUserFromToken(
        {
          id: "user_123",
          name: "Alex",
          email: "alex@example.com",
          image: null,
          emailVerified: false,
        },
        token,
      ),
    ).toEqual({
      name: "Alex",
      email: "alex@example.com",
      image: null,
      id: "user_123",
      emailVerified: false,
    });
  });

  it("copies the Google email_verified claim into token claims", () => {
    expect(
      getTokenClaimsFromProfile({
        sub: "user_123",
        email_verified: true,
      }),
    ).toEqual({
      sub: "user_123",
      emailVerified: true,
    });
  });

  it("preserves token claims when jwt runs again without a profile", () => {
    const token = {
      sub: "user_123",
      emailVerified: true,
    };

    expect(applyTokenClaimsFromProfile(token, undefined)).toBe(token);
    expect(token).toEqual({
      sub: "user_123",
      emailVerified: true,
    });
  });
});
