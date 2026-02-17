// import puppeteer from "puppeteer";

import { getBrowserV2 } from "../../utils/get-browser-v2";

// import { getBrowser } from "../../utils/get-browser";
export const CreateCSSTarget = async (code: string) => {
  const browser = await getBrowserV2()

  const page = await browser.newPage();
  await page.setViewport({
    width: 400,
    height: 300,
    deviceScaleFactor: 1,
  });
  // const htmlContent = `
  //       <style>
  //     * {
  //       margin: 0;
  //       padding: 0;
  //     }

  //     body {
  //       overflow: hidden;
  //       margin: 11.5px;
  //       position:relative;
  //     }
  //   </style>
  //         ${code}
  //   `;
  // await page.setContent(htmlContent, {
  //   waitUntil: "domcontentloaded",
  // });

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
  return {
    success: true,
    pngBase64: `data:image/png;base64, ${imageBuffer}`,
  };
};

export const CssCreationService = {
  CreateCSSTarget,
};
