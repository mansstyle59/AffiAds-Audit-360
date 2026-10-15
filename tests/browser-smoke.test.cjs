const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

let server;
let browser;
let baseURL;

test("browser smoke: startup, navigation, themes, audit form, mobile layout and runtime errors", async t => {
  server = http.createServer((req, res) => {
    if (!["GET", "HEAD"].includes(req.method || "GET")) {
      res.writeHead(405).end();
      return;
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(req.url || "/", "http://127.0.0.1").pathname); }
    catch { res.writeHead(400).end(); return; }
    if (pathname === "/") pathname = "/index.html";
    const file = path.resolve(ROOT, "." + pathname);
    if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
      res.writeHead(403).end();
      return;
    }
    fs.readFile(file, (err, bytes) => {
      if (err) { res.writeHead(err.code === "ENOENT" ? 404 : 500).end(); return; }
      res.writeHead(200, { "Content-Type": MIME[path.extname(file)] || "application/octet-stream", "Cache-Control": "no-store" });
      if (req.method === "HEAD") res.end(); else res.end(bytes);
    });
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  baseURL = `http://127.0.0.1:${address.port}/`;
  browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    serviceWorkers: "block"
  });
  const page = await context.newPage();
  const pageErrors = [];
  const badLocalResponses = [];
  page.on("pageerror", error => pageErrors.push(error.message));
  page.on("response", response => {
    if (response.url().startsWith(baseURL) && response.status() >= 400) {
      badLocalResponses.push({ status: response.status(), url: response.url() });
    }
  });
  await page.route("**/*", route => {
    const target = new URL(route.request().url());
    if (target.origin !== new URL(baseURL).origin) return route.abort();
    return route.continue();
  });

  try {
    await page.goto(baseURL, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => {
      const gate = document.querySelector("#gateLock");
      return gate && !gate.hidden;
    }, { timeout: 8000 });

    // Confirm the access gate exists, then bypass only that gate in this isolated
    // test context so the rest of the UI can be smoke-tested without a real owner PIN.
    assert.equal(await page.locator("#gate").getAttribute("aria-modal"), "true");
    assert.ok(await page.locator("#pinPad button").count() >= 10, "PIN keypad should render");
    await page.evaluate(() => {
      document.body.classList.remove("locked");
      document.querySelector("#gate")?.classList.add("hidden");
      if (typeof nav === "function") nav("auto");
    });

    for (const id of ["autoName", "autoCity", "runAuto", "navNewClient", "navMore"]) {
      assert.equal(await page.locator("#" + id).count(), 1, `expected #${id}`);
    }
    assert.equal(await page.locator("#autoName").getAttribute("aria-label"), null);
    assert.equal(await page.locator('label[for="autoName"]').count(), 1);
    assert.equal(await page.locator('label[for="autoCity"]').count(), 1);

    await page.locator("#autoName").fill("Commerce test automatisé");
    await page.locator("#autoCity").fill("Azille");
    assert.equal(await page.locator("#autoName").inputValue(), "Commerce test automatisé");
    assert.equal(await page.locator("#autoCity").inputValue(), "Azille");

    // Exercise all primary views using the visible navigation.
    for (const view of ["clients", "report", "auto"]) {
      await page.locator(`.nav button[data-view="${view}"]`).click();
      await page.waitForFunction(expected => document.body.dataset.view === expected, view);
    }

    // Exercise every secondary view via the real mobile menu.
    for (const view of ["pitch", "home", "audit", "campaign", "research", "webcheck", "social", "tools", "settings"]) {
      await page.locator("#navMore").click();
      await page.locator(`#navSheet button[data-view="${view}"]`).click();
      await page.waitForFunction(expected => document.body.dataset.view === expected, view);
      assert.equal(await page.locator("#view-" + view).evaluate(el => el.classList.contains("hidden")), false,
        `view ${view} should be visible after navigation`);
    }

    // Verify the theme controls change the effective document theme.
    for (const theme of ["dark", "light", "auto"]) {
      await page.locator(`[data-theme-set="${theme}"]`).click();
      if (theme !== "auto") {
        assert.equal(await page.locator("html").getAttribute("data-theme"), theme);
      }
    }

    // Return to the audit screen and verify the mobile page itself does not overflow horizontally.
    await page.locator('.nav button[data-view="auto"]').click();
    const dimensions = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      page: document.documentElement.scrollWidth,
      body: document.body.scrollWidth
    }));
    assert.ok(dimensions.page <= dimensions.viewport + 2,
      `mobile page overflows horizontally: ${JSON.stringify(dimensions)}`);

    // Exercise the central action and ensure it lands back on the audit form.
    await page.locator("#navNewClient").click();
    await page.waitForFunction(() => document.body.dataset.view === "auto");
    assert.equal(await page.locator("#autoName").count(), 1);

    await page.waitForTimeout(250);
    assert.deepEqual(pageErrors, [], "uncaught JavaScript errors occurred");
    assert.deepEqual(badLocalResponses, [], "local assets failed to load");
  } finally {
    await context.close();
    await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
