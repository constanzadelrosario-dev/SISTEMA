import { expect, test } from "@playwright/test";

/**
 * El criterio de terminado del corte 1: la ruta de impresión rinde láminas de
 * 1920×1080 con texto real, no una imagen. Si esto pasa, el PDF sale vectorial.
 */
test("la ruta de impresión rinde láminas a 1920×1080", async ({ page }) => {
  const id = process.env.DECK_ID;
  test.skip(!id, "define DECK_ID con un deck existente");

  await page.goto(`/decks/${id}/print`);
  const first = page.locator("[data-slide='1']");
  await expect(first).toBeVisible();

  const box = await first.boundingBox();
  expect(box?.width).toBe(1920);
  expect(box?.height).toBe(1080);

  // Texto seleccionable, no un lienzo rasterizado.
  expect(await page.locator("canvas").count()).toBe(0);
  expect((await first.innerText()).length).toBeGreaterThan(10);
});
