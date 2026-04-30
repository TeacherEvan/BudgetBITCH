type GoogleOAuthEnvironment = Record<string, string | undefined>;

type GoogleOAuthCredentials = {
  clientId: string;
  clientSecret: string;
};

const placeholderPattern = /replace_me|replace_with|your-app/i;

function cleanEnvValue(value: string | undefined) {
  const trimmedValue = value?.trim();

  if (!trimmedValue || placeholderPattern.test(trimmedValue)) {
    return undefined;
  }

  return trimmedValue;
}

export function getGoogleOAuthCredentials(env: GoogleOAuthEnvironment = process.env): GoogleOAuthCredentials | undefined {
  const clientId = cleanEnvValue(env.AUTH_GOOGLE_ID) ?? cleanEnvValue(env.GOOGLE_CLIENT_ID);
  const clientSecret = cleanEnvValue(env.AUTH_GOOGLE_SECRET) ?? cleanEnvValue(env.GOOGLE_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    return undefined;
  }

  return { clientId, clientSecret };
}

export function isGoogleOAuthConfigured(env: GoogleOAuthEnvironment = process.env) {
  return Boolean(getGoogleOAuthCredentials(env));
}