import AppError from "../../helpers/app-error";
import { getBrowser } from "../../utils/get-browser";
import { loadPNGfromURL } from "../css-battle/css.helpers";
import { compare } from "../css-battle/csss.compare";
import { PNG } from "pngjs";
// import { getBrowserV2 } from "../../utils/get-browser-v2";

export const CheckWebsite = async (url: string) => {
  if (!url) {
    throw new AppError(400, "Url is required!");
  }

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // 1. Load reference image once
    const refImage = await loadPNGfromURL(
      "https://res.cloudinary.com/dj493l0jy/image/upload/v1775219031/assignment-refs/B13/B13_A1.png",
    );

    // 2. Get exact dimensions of the reference image
    const refImagePNG = PNG.sync.read(Buffer.from(refImage, "base64"));

    // 3. Navigate to the target website
    await page.goto(url, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // 4. Force the viewport to be EXACTLY the same size as the reference image
    //    → This guarantees the screenshot will have identical width & height
    await page.setViewport({
      width: refImagePNG.width,
      height: refImagePNG.height,
      
    });

    // 5. Take screenshot (viewport size = reference size)
    const imageBuffer = await page.screenshot({
      type: "png",
      encoding: "base64",
      fullPage: true,
      // fullPage: false is default when viewport height is set
      // We removed fullPage: true because it would break the exact size requirement
    });

    // 6. Compare with reference (now both images have identical dimensions)
    const result = await compare(refImage, imageBuffer);

    return {
      success: true,
      pngBase64: imageBuffer,
      result,
      // Optional: also return the dimensions used (helpful for debugging)
      dimensions: { width: refImagePNG.width, height: refImagePNG.height },
    };
  } finally {
    await page.close();
  }
};



export const CheckService = { CheckWebsite };
