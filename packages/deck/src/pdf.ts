/**
 * Export a PDF por impresión nativa, no por captura.
 * html2canvas rasteriza: el PDF pierde texto seleccionable y con tipografía
 * fina se nota. Playwright imprime desde el mismo HTML de /print y conserva
 * vectores. El camino de captura queda solo como respaldo en navegador.
 */
export type PdfOptions = { baseUrl: string; deckId: string; outPath: string };

export async function exportDeckPdf(opts: PdfOptions): Promise<string> {
  const { chromium } = await import("playwright");
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`${opts.baseUrl}/decks/${opts.deckId}/print`, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    await page.pdf({
      path: opts.outPath,
      width: "1920px",
      height: "1080px",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
    });
    return opts.outPath;
  } finally {
    await browser.close();
  }
}
