import { expect, test, type Page } from "@playwright/test";
import { TEMPLATES, TEMPLATE_IDS } from "../../src/lib/issues";

// Pages that work without an account or a database.

const noHorizontalScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

function collectErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  return errors;
}

test.describe("landing page", () => {
  test("renders in the browser language (Turkish here) and links to the privacy page", async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "Giriş yap" })).toBeVisible();
    await expect(page.locator('footer a[href="/gizlilik"]')).toHaveCount(1);
    expect(await noHorizontalScroll(page)).toBe(true);
    expect(errors).toEqual([]);
  });

  test("switches to English with the language cookie", async ({ page, context, baseURL }) => {
    await context.addCookies([{ name: "hv-locale", value: "en", url: baseURL! }]);
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Log in" })).toBeVisible();
    await expect(page.locator('footer a[href="/gizlilik"]')).toHaveText("Privacy");
  });
});

test.describe("privacy page", () => {
  test("is public and complete", async ({ page }) => {
    const response = await page.goto("/gizlilik");
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe("/gizlilik");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gizlilik");
    await expect(page.getByRole("heading", { level: 2 })).toHaveCount(5);
    expect(await noHorizontalScroll(page)).toBe(true);
  });
});

test.describe("design studio demo", () => {
  for (const id of TEMPLATE_IDS) {
    test(`renders the ${id} template from its slug`, async ({ page }) => {
      const errors = collectErrors(page);
      await page.goto(`/sablonlar?gorunum=${TEMPLATES[id].slug}`);
      const paper = page.locator(`.np-root[data-template="${id}"]`);
      await expect(paper).toBeVisible();
      // Sample issue: at least one question and one answer are typeset.
      await expect(paper.locator("h2, h3").first()).toBeVisible();
      expect(await noHorizontalScroll(page)).toBe(true);
      expect(errors).toEqual([]);
    });
  }

  test("an unknown slug falls back to the classic template", async ({ page }) => {
    await page.goto("/sablonlar?gorunum=yok-boyle-bir-sey");
    await expect(page.locator('.np-root[data-template="classic"]')).toBeVisible();
  });

  test("print view hides the studio controls and keeps the newspaper", async ({ page }) => {
    await page.goto("/sablonlar?gorunum=gazete");
    await page.emulateMedia({ media: "print" });
    await expect(page.locator(".np-root")).toBeVisible();
    for (const element of await page.locator(".no-print").all()) {
      await expect(element).toBeHidden();
    }
  });
});

test.describe("offline and install metadata", () => {
  test("serves the offline page, the manifest and the service worker", async ({ request }) => {
    const offline = await request.get("/offline.html");
    expect(offline.status()).toBe(200);
    expect(await offline.text()).toContain("Haber Var");

    const manifest = await request.get("/manifest.webmanifest");
    expect(manifest.status()).toBe(200);
    const body = await manifest.json();
    expect(body.name).toContain("Haber Var");
    expect(body.display).toBe("standalone");

    const worker = await request.get("/sw.js");
    expect(worker.status()).toBe(200);
    expect(await worker.text()).toContain("notificationclick");
  });
});
