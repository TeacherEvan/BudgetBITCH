import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../convex/_generated/api";

export const convexProfileSyncErrorMessage =
  "CONVEX_SYNC_SECRET is not configured for Convex profile sync.";

export const authBootstrapAuthenticationRequiredMessage = "Authentication is required.";

export const authBootstrapErrorCodes = {
  authenticationRequired: "authentication-required",
  missingConvexSyncSecret: "missing-convex-sync-secret",
  convexIdentityFetchFailed: "convex-identity-fetch-failed",
  convexProfileSyncFailed: "convex-profile-sync-failed",
} as const;

export type AuthBootstrapErrorCode =
  (typeof authBootstrapErrorCodes)[keyof typeof authBootstrapErrorCodes];

export type AuthBootstrapErrorShape = {
  code: AuthBootstrapErrorCode;
  message: string;
  status: number;
};

export type AuthBootstrapErrorResponse = {
  error: Pick<AuthBootstrapErrorShape, "code" | "message">;
};

const knownAuthBootstrapErrorCodes = new Set<string>(
  Object.values(authBootstrapErrorCodes),
);

export class AuthBootstrapError extends Error implements AuthBootstrapErrorShape {
  readonly code: AuthBootstrapErrorCode;
  readonly status: number;
  readonly cause?: unknown;

  constructor(input: AuthBootstrapErrorShape & { cause?: unknown }) {
    super(input.message);
    this.name = "AuthBootstrapError";
    this.code = input.code;
    this.status = input.status;
    this.cause = input.cause;
  }
}

export function isAuthBootstrapError(error: unknown): error is AuthBootstrapErrorShape {
  if (!(error instanceof Error)) {
    return false;
  }

  const candidate = error as Error & Partial<AuthBootstrapErrorShape>;

  return (
    typeof candidate.code === "string" &&
    knownAuthBootstrapErrorCodes.has(candidate.code) &&
    typeof candidate.status === "number" &&
    typeof candidate.message === "string"
  );
}

export function isAuthBootstrapErrorCode(
  code: string | null | undefined,
): code is AuthBootstrapErrorCode {
  return typeof code === "string" && knownAuthBootstrapErrorCodes.has(code);
}

export function toAuthBootstrapErrorResponse(
  error: AuthBootstrapErrorShape,
): AuthBootstrapErrorResponse {
  return {
    error: {
      code: error.code,
      message: error.message,
    },
  };
}

export type ConvexAuthenticatedIdentity = {
  tokenIdentifier: string;
  subject: string;
  issuer: string;
  email: string | null;
  name: string | null;
};

export async function getConvexAuthenticatedIdentity(): Promise<ConvexAuthenticatedIdentity | null> {
  const token = await convexAuthNextjsToken();

  if (!token) {
    return null;
  }

  try {
    return await fetchQuery(api.authSession.currentIdentity, {}, { token });
  } catch (error) {
    throw new AuthBootstrapError({
      code: authBootstrapErrorCodes.convexIdentityFetchFailed,
      message:
        "BudgetBITCH could not verify your Convex Auth session. Try again in a moment.",
      status: 503,
      cause: error,
    });
  }
}

export async function syncConvexLocalProfile(input: {
  profileId: string;
  displayName: string | null;
}) {
  const token = await convexAuthNextjsToken();
  const syncSecret = process.env.CONVEX_SYNC_SECRET?.trim();

  if (!token) {
    throw new AuthBootstrapError({
      code: authBootstrapErrorCodes.authenticationRequired,
      message: authBootstrapAuthenticationRequiredMessage,
      status: 401,
    });
  }

  if (!syncSecret) {
    throw new AuthBootstrapError({
      code: authBootstrapErrorCodes.missingConvexSyncSecret,
      message: convexProfileSyncErrorMessage,
      status: 503,
    });
  }

  try {
    return await fetchMutation(
      api.authSession.syncLocalProfile,
      { ...input, syncSecret },
      { token },
    );
  } catch (error) {
    throw new AuthBootstrapError({
      code: authBootstrapErrorCodes.convexProfileSyncFailed,
      message:
        "BudgetBITCH could not sync your local profile with Convex. Try again in a moment.",
      status: 503,
      cause: error,
    });
  }
}
