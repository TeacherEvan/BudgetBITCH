// Feature: Join (shared-board invite) page — invite-link flow (no manual input
// form; the code arrives via ?code=). Heading render is unauthenticated; the
// error-state path requires a valid auth context to call redeemInviteToken, so
// it is auth-gated and skips cleanly without credentials.
import { test, expect, signInReal, seedLocalStorage, HAS_CREDS } from "./helpers";

test.describe("Join", () => {
  test("renders join heading when no code present", async ({ page }) => {
    await page.goto("/join");
    await expect(
      page.getByRole("heading", { name: /join an account|เข้าร่วมบัญชี/i }),
    ).toBeVisible({ timeout: 8000 });
  });

  test("shows error state on invalid/unknown invite code", async ({ page }) => {
    if (!HAS_CREDS) test.skip(true, "no creds");
    await seedLocalStorage(page);
    await signInReal(page);
    await page.goto("/join?code=not-a-real-invite-token");
    await expect(
      page.getByText(/could not join|ไม่สามารถเข้าร่วมได้/i).first(),
    ).toBeVisible({ timeout: 15000 });
  });
});
