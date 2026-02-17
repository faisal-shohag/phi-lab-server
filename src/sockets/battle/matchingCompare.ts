import { loadPNGfromURL } from "../../app/api/css-battle/css.helpers";
import { PNG } from "pngjs";
import pixelmatchCustom from "../../app/helpers/pixelmatch";
import { getBrowser } from "../../app/utils/get-browser";

export const MatchingCompare = async (targetURL: string, code: string) => {
  try {
    const browser = await getBrowser();
    const page = await browser.newPage();
    await page.setViewport({
      width: 400,
      height: 300,
      deviceScaleFactor: 1,
    });
    await page.evaluate((html) => {
      document.open();
      document.write(`
    <style>
      * { margin: 0; padding: 0; }
      body { overflow: hidden; margin: 11.5px; }
    </style>
    ${html}
  `);
      document.close();
    }, code);
    const imageBuffer = await page.screenshot({
      type: "png",
      encoding: "base64",
    });

    await page.close();

    const targetBase64 = await loadPNGfromURL(targetURL);
    return await MatchingCompareProbability(targetBase64, imageBuffer, 0);
  } catch (error) {
    console.error("Screenshot error:", error);
    throw error;
  }
};

export const MatchingCompareProbability = async (
  targetBase64: string,
  userBase64: string,
  threshold = 0
) => {
  try {
    const img1 = PNG.sync.read(Buffer.from(targetBase64, "base64"));
    const img2 = PNG.sync.read(Buffer.from(userBase64, "base64"));

    if (img1.width !== img2.width || img1.height !== img2.height) {
      return { error: "Image sizes mismatch" };
    }

    // Reuse buffer if possible, avoid creating new PNG object
    const diff = new PNG({ width: img1.width, height: img1.height });
    const mismatched = pixelmatchCustom(
      img1.data,
      img2.data,
      diff.data,
      img1.width,
      img1.height,
      { threshold }
    );

    const total = img1.width * img1.height;
    const accuracy = ((total - mismatched) / total) * 100;

    return {
      matched: Number(accuracy.toFixed(2)),
      renderedURL: `data:image/png;base64,${userBase64}`,
    };
  } catch (e: any) {
    return { error: e.message };
  }
};
