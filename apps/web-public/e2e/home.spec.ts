import { expect, test } from "@playwright/test";

// Frontend E2E (top of the pyramid): a real browser against the running public
// app. Anonymous visitors get the artist Home (only Home is public) and can
// open the passwordless sign-in modal.
test.describe("Public artist home", () => {
  test("anonymous visitor sees the home and can open the sign-in modal", async ({ page }) => {
    await page.goto("/artist/aurora");

    await expect(page.getByRole("link", { name: "Aurora", exact: true })).toBeVisible();

    const signIn = page.getByRole("button", { name: "Sign in" });
    await expect(signIn).toBeVisible();
    await signIn.click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(dialog.getByPlaceholder(/your\.email/i)).toBeVisible();
  });

  test("member-only pages 404 for anonymous visitors", async ({ page }) => {
    const res = await page.goto("/artist/aurora/store");
    expect(res?.status()).toBe(404);
  });
});
