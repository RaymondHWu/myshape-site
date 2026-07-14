// Render RN-002 cover.html → cover.png using system Chrome
import puppeteer from "puppeteer-core";
import { resolve } from "path";
import { stat } from "fs/promises";
import { pathToFileURL } from "url";

const htmlPath = resolve(import.meta.dirname, "../papers/rn-002/cover.html");
const outPath = resolve(import.meta.dirname, "../papers/rn-002/cover.png");

const browser = await puppeteer.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
  args: ["--no-sandbox", "--disable-gpu"],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle0" });
  await page.screenshot({ path: outPath, type: "png" });
  const { size } = await stat(outPath);
  console.log(`✓ cover.png saved (${Math.round(size / 1024)} KB)`);
} finally {
  await browser.close();
}
