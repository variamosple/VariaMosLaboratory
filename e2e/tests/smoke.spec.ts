import { test, expect } from "../support/fixtures";

test("the Laboratory opens for a signed-in researcher", async ({ page }) => {
  await page.goto("");
  await expect(page.getByRole("button", { name: "Create Experiment" })).toBeVisible();
  await page.screenshot({ path: ".work/smoke.png", fullPage: true });
});
