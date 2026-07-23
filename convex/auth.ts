import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { Email } from "@convex-dev/auth/providers/Email";

export function normalizePasswordEmail(email: unknown) {
  if (typeof email !== "string") {
    throw new Error("An email address is required.");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("An email address is required.");
  }

  return normalizedEmail;
}

// The host the reset/verification email links should point at. On Vercel this
// is NEXT_PUBLIC_APP_URL; locally it falls back to SITE_URL. We override the
// link target so users always land on the real app origin, never the bare
// Convex site URL.
function appOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL ?? process.env.SITE_URL;
  return (fromEnv ?? "http://localhost:3000").replace(/\/$/, "");
}

function resendFrom(): string {
  return process.env.AUTH_EMAIL_FROM ?? "Budget-BOSS <onboarding@resend.dev>";
}

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      profile(params) {
        return { email: normalizePasswordEmail(params.email) };
      },
      reset: Email({
        id: "resend",
        from: resendFrom(),
        async sendVerificationRequest({ identifier, url, token }) {
          // Host the reset link on the real app origin, not CONVEX_SITE_URL.
          const target = url.replace(/^https?:\/\/[^/]+/, appOrigin());
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY ?? ""}`,
            },
            body: JSON.stringify({
              from: resendFrom(),
              to: [identifier],
              subject: "Reset your Budget-BOSS password",
              html: resetEmailHtml({ url: target, code: token }),
              text: resetEmailText({ url: target, code: token }),
            }),
          });
        },
      }),
    }),
  ],
});
// Alias signUp to signIn for convenience; signUp will use flow="signUp" internally
export const signUp = signIn;

function resetEmailHtml({ url, code }: { url: string; code: string }) {
  return `<div style="font-family:Inter,system-ui,sans-serif;color:#0f172a">
  <h2>Reset your Budget-BOSS password</h2>
  <p>We received a request to reset your password. Use the code below on the
  reset page, or open the link to prefill it.</p>
  <p style="font-size:24px;letter-spacing:4px;font-weight:700">${code}</p>
  <p><a href="${url}">${url}</a></p>
  <p style="color:#64748b;font-size:12px">This code expires in one hour.
  If you did not request a reset, you can ignore this email.</p>
</div>`;
}

function resetEmailText({ url, code }: { url: string; code: string }) {
  return `Reset your Budget-BOSS password

We received a request to reset your password. Use this code on the reset page:

${code}

Or open this link to prefill it: ${url}

This code expires in one hour. If you did not request a reset, ignore this email.`;
}
