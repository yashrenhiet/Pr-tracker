import { expect, test, type Page } from "playwright/test";

/**
 * Production-readiness guarantees for the dashboard. Each test pins a failure that shipped in an
 * earlier version of this UI. Needs the dev server (`npm run dev`) and backend running.
 */

/** Backend calls only. A bare `/\/api\//` also matches Vite's own `/src/api/*.ts` module requests,
 * which blanks the whole app instead of simulating an API failure. */
const API = (url: URL) => url.pathname.startsWith("/api/");

async function openFirstReview(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /open details/i }).first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
}

test.describe("failure states", () => {
  for (const [name, handler] of [
    ["server error", (r: Parameters<Parameters<Page["route"]>[1]>[0]) => r.fulfill({ status: 500, body: "{}" })],
    ["offline", (r: Parameters<Parameters<Page["route"]>[1]>[0]) => r.abort("connectionrefused")],
  ] as const) {
    test(`${name} shows an error with retry, never "no results"`, async ({ page }) => {
      await page.route(API, handler);
      await page.goto("/");
      const alert = page.getByRole("alert").filter({ hasText: "couldn't load" });
      await expect(alert).toBeVisible();
      await expect(alert.getByRole("button", { name: "Try again" })).toBeVisible();
      await expect(page.getByText("No pull requests match")).toHaveCount(0);
    });
  }

  test("unknown route renders a 404 with a way back", async ({ page }) => {
    await page.goto("/does-not-exist");
    await expect(page.getByText("We can't find that page")).toBeVisible();
    await expect(page).toHaveTitle(/^Page not found/);
  });

  test("deep link to a missing PR explains itself", async ({ page }) => {
    await page.goto("/?review=999999");
    await expect(page.getByRole("dialog")).toContainText("isn't available");
  });
});

test.describe("filters", () => {
  test("typing is debounced and the filter lives in the URL", async ({ page }) => {
    await page.goto("/");
    let requests = 0;
    page.on("request", (r) => {
      if (/\/api\/reviews\?.*component=/.test(r.url())) requests++;
    });
    await page.getByLabel("Component").pressSequentially("platform", { delay: 40 });
    await expect(page).toHaveURL(/component=platform/);
    await page.waitForTimeout(500);
    expect(requests).toBe(1);
  });
});

test.describe("modals", () => {
  test("drawer traps focus and locks page scroll", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /track a pr/i }).first().click();
    for (let i = 0; i < 30; i++) {
      await page.keyboard.press("Tab");
      expect(await page.evaluate(() => !!document.activeElement?.closest('[role="dialog"]'))).toBe(true);
    }
    expect(await page.evaluate(() => document.body.style.overflow)).toBe("hidden");
  });

  test("Escape closes only the innermost modal, and focus returns to its trigger", async ({ page }) => {
    await openFirstReview(page);
    await page.getByRole("button", { name: "Stop tracking" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    await expect(page.getByRole("alertdialog").getByRole("button", { name: "Cancel" })).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(page.getByRole("alertdialog")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.getByRole("button", { name: "Stop tracking" })).toBeFocused();
  });

  test("delete uses the branded confirm, never window.confirm", async ({ page }) => {
    let nativeDialog = false;
    page.on("dialog", (d) => {
      nativeDialog = true;
      void d.dismiss();
    });
    await openFirstReview(page);
    await page.getByRole("button", { name: "Stop tracking" }).click();
    await expect(page.getByRole("alertdialog")).toBeVisible();
    expect(nativeDialog).toBe(false);
  });
});

test.describe("editing", () => {
  test("changing status then saving details does not 409", async ({ page }) => {
    const statuses: number[] = [];
    page.on("response", (r) => {
      if (/\/api\/reviews\/\d+/.test(r.url()) && r.request().method() !== "GET") statuses.push(r.status());
    });
    await openFirstReview(page);
    const moveTo = page.getByLabel("Move to");
    const current = await moveTo.inputValue();
    await moveTo.selectOption(current === "APPROVED" ? "REVIEW_IN_PROGRESS" : "APPROVED");
    await page.getByRole("button", { name: "Update status" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Status set to" })).toBeVisible();

    await page.getByLabel("Context").fill(`e2e ${Date.now()}`);
    await page.getByRole("button", { name: "Save changes" }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    expect(statuses).toEqual([200, 200]);
  });
});

test.describe("accessibility & responsive", () => {
  test("skip link is the first tab stop", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "Skip to main content" })).toBeFocused();
  });

  test("no horizontal scrolling on a phone", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("table")).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  });
});
