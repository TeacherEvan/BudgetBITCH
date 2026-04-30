import { describe, expect, it } from "vitest";
import { getGoogleOAuthCredentials, isGoogleOAuthConfigured } from "./oauth-config";

describe("getGoogleOAuthCredentials", () => {
  it("resolves the Auth.js Google provider environment names", () => {
    expect(
      getGoogleOAuthCredentials({
        AUTH_GOOGLE_ID: "auth-google-client-id",
        AUTH_GOOGLE_SECRET: "auth-google-client-secret",
      }),
    ).toEqual({
      clientId: "auth-google-client-id",
      clientSecret: "auth-google-client-secret",
    });
  });

  it("falls back to common Google OAuth environment names", () => {
    expect(
      getGoogleOAuthCredentials({
        GOOGLE_CLIENT_ID: "google-client-id",
        GOOGLE_CLIENT_SECRET: "google-client-secret",
      }),
    ).toEqual({
      clientId: "google-client-id",
      clientSecret: "google-client-secret",
    });
  });

  it("reports incomplete Google OAuth credentials as unconfigured", () => {
    expect(
      isGoogleOAuthConfigured({
        AUTH_GOOGLE_ID: "auth-google-client-id",
        AUTH_GOOGLE_SECRET: " ",
      }),
    ).toBe(false);
  });

  it("reports placeholder Google OAuth credentials as unconfigured", () => {
    expect(
      isGoogleOAuthConfigured({
        AUTH_GOOGLE_ID: "replace_me",
        AUTH_GOOGLE_SECRET: "replace_with_google_client_secret",
      }),
    ).toBe(false);
  });
});