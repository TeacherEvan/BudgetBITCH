import { ConvexHttpClient } from "convex/browser";

type ConvexHttpClientConstructorOptions = NonNullable<
  ConstructorParameters<typeof ConvexHttpClient>[1]
>;

export type ConvexHttpClientOptions = Pick<
  ConvexHttpClientConstructorOptions,
  "auth" | "fetch"
>;

function getRequiredConvexUrl() {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.trim();

  if (!convexUrl) {
    throw new Error(
      "NEXT_PUBLIC_CONVEX_URL is not configured for server-side Convex HTTP calls.",
    );
  }

  return convexUrl;
}

export function getConvexHttpClient(options: ConvexHttpClientOptions = {}) {
  return new ConvexHttpClient(getRequiredConvexUrl(), options);
}
