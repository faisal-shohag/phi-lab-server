import puppeteerCore from "puppeteer-core";
import puppeteer from "puppeteer";
import chromium from "@sparticuz/chromium";

// const config = chromium as any;

// Reuse browser instance across requests
let browserInstance: any = null;

export const getBrowser = async () => {
  // Return existing browser if still valid
  if (browserInstance) {
    console.log("Launching previous browserInstance!");
    try {
      await browserInstance.version();
      return browserInstance;
    } catch {
      browserInstance = null;
    }
  }

  if (process.env.NODE_ENV === "production") {
    console.log("Launching new browserInstance!");
    browserInstance = await puppeteerCore.launch({
      args: [
        ...(chromium.args || []).filter(arg => arg && typeof arg === 'string'),
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        // "--single-process",
      ],
      executablePath: await chromium.executablePath(),
      headless: true,
      defaultViewport: {
        width: 400,
        height: 300,
        deviceScaleFactor: 1,
      },
    });
  } else {
    browserInstance = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserInstance;
};

// Optional: cleanup on process exit
if (typeof process !== "undefined") {
  process.on("exit", async () => {
    if (browserInstance) {
      await browserInstance.close();
    }
  });
}
