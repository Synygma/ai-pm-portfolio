import { expect, test } from "@playwright/test";

test("manifest is served with the ParCare name and icons", async ({ request }) => {
  const res = await request.get("/manifest.webmanifest");
  expect(res.ok()).toBe(true);
  const m = await res.json();
  expect(m.name).toBe("ParCare");
  expect(m.short_name).toBe("ParCare");
  for (const icon of m.icons) {
    const img = await request.get(icon.src);
    expect(img.ok(), icon.src).toBe(true);
  }
});

test("page head links the favicon, apple icon and manifest", async ({ page, request }) => {
  await page.goto("/");
  await expect(page.locator('link[rel="manifest"]')).toHaveCount(1);
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
  expect((await request.get("/favicon.ico")).ok()).toBe(true);
});

test("all 12 avatar crops are served", async ({ request }) => {
  for (const id of ["krishna", "shiva", "guruji", "trekker", "champ", "explorer", "sangeet-saathi", "kalakaar", "garden-mitra", "masterchef", "vidya", "my-child"]) {
    const res = await request.get(`/avatars/${id}.webp`);
    expect(res.status(), id).toBe(200);
    expect(res.headers()["content-type"]).toBe("image/webp");
  }
});
