import puppeteer from "puppeteer";
// Reuse browser instance across requests
let browserInstance: any = null;

export const getBrowserV2 = async () => {
  // console.log("Launching browserInstance!");
  // Return existing browser if still valid
  if (browserInstance) {
    // console.log("Launching previous browserInstance!");
    try {
      await browserInstance.version();
      return browserInstance;
    } catch {
      browserInstance = null;
    }
  }

  // console.log("Launching new browserInstance!");

  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      "--single-process",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-gpu",
      "--no-zygote",
      "--disable-dev-shm-usage",
    ],
    executablePath: "./google-chrome-stable",
    timeout: 60000,
  });

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
