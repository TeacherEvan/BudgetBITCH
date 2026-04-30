import { describe, expect, it } from "vitest";

import {
  getSessionUserFromToken,
  getTokenClaimsFromProfile,
  type SessionTokenClaims,
} from "./session-claims";

describe("auth session claims", () => {
  it("keeps emailVerified false unless the token says the email was verified", () => {
    const token: SessionTokenClaims = {
      sub: "user_123",
      emailVerified: false,
    };

    expect(
      getSessionUserFromToken(
        {
          name: "Alex",
          email: "alex@example.com",
          image: null,
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
});
