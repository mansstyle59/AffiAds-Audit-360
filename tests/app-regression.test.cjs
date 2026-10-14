const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = (p) => fs.readFileSync(path.join(process.cwd(), p), "utf8");
const html = read("index.html"), css = read("assets/app.css"), js = read("assets/app.js"), sw = read("sw.js");
const manifest = JSON.parse(read("manifest.webmanifest"));

test("PWA manifest is valid and its icons exist", () => {
  assert.equal(manifest.name, "AffiAds Audit 360°");
  assert.equal(manifest.lang, "fr");
  assert.equal(manifest.display, "standalone");
  assert.ok(Array.isArray(manifest.icons) && manifest.icons.length);
  for (const icon of manifest.icons) {
    const p = icon.src.split("?")[0].replace(/^\.\//, "");
    assert.ok(fs.existsSync(path.join(process.cwd(), p)), "missing PWA icon: " + icon.src);
  }
});

test("home audit, chat and theme controls are present", () => {
  for (const id of ["view-auto","autoName","autoCity","runAuto","autoToReport","keyNotice","botFab","botPanel","botClose","view-settings"]) {
    assert.ok(new RegExp('id="' + id + '"' ).test(html), "missing element id=" + id);
  }
  for (const theme of ["auto","light","dark"]) assert.ok(html.includes('data-theme-set="' + theme + '"'));
});

test("all local assets referenced in HTML exist", () => {
  const refs = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(m => m[1]);
  for (const ref of refs) {
    if (!ref.startsWith("assets/")) continue;
    const p = ref.split("?")[0];
    assert.ok(fs.existsSync(path.join(process.cwd(), p)), "missing HTML asset: " + ref);
  }
});

test("service worker caches the essential application shell", () => {
  for (const p of ["index.html","assets/app.css","assets/app.js","manifest.webmanifest","assets/app-icon.svg"]) {
    assert.ok(sw.includes('"' + p + '"'), "service worker missing " + p);
  }
  assert.match(sw, /affiads-audit-2026-\d+/);
});

test("day/night theme overrides global forced backgrounds and keeps dark card text readable", () => {
  assert.match(css, /:root\[data-theme="light"\] body\{background:#f6f7ff!important;color:#171b4f!important\}/);
  assert.match(css, /:root\[data-theme="dark"\] body\{background:#080d2d!important;color:#f3f4ff!important\}/);
  assert.match(css, /:root\[data-theme="dark"\] \.card h2[^\{]*\{[^}]*color:#e6eaff!important/);
  assert.match(js, /function applyTheme\(\)[^{]*\{[^}]*settings\.theme/);
});

test("static HTML contains no duplicate IDs", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const duplicates = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  assert.deepEqual(duplicates, [], "duplicate IDs: " + duplicates.join(", "));
});


test("client list includes recency, completion and opportunity metadata", () => {
  assert.match(js, /Modifié le /);
  assert.match(js, /contrôles/);
  assert.match(js, /Analyse réalisée/);
});

test("backup import is bounded, confirmed and avoids overwriting duplicate IDs", () => {
  assert.match(js, /f\.size>25\*1024\*1024/);
  assert.match(js, /list\.length>500/);
  assert.match(js, /!confirm\("Importer "/);
  assert.match(js, /if\(db\.audits\[a\.id\]\)/);
  assert.match(js, /delete safeSettings\.googleKey/);
});

test("AI visibility compares platforms using only explicit yes/no results", () => {
  assert.match(js, /Comparaison par assistant/);
  assert.match(js, /presence==="yes"\|\|t\.presence==="no"/);
  assert.match(js, /Incertain/);
});


test("premium PDF export includes branded A4 pagination and professional report styles", () => {
  assert.match(js, /PDF polish 2026-74/);
  assert.match(js, /doc\.text\("Page "\+i\+" \/ "\+n,210-M,290/);
  assert.match(js, /setDrawColor\(225,229,243\)/);
  assert.match(css, /\.ophead\{padding:18px 28px;background:linear-gradient/);
  assert.match(css, /\.opoffer\{margin-top:15px;padding:15px 16px/);
});

test("premium PDF export fits the one-page summary inside printable A4 margins", () => {
  assert.match(js, /const maxW=194,maxH=268/);
  assert.match(js, /AFFIADS AUDIT 360°  ·  DOCUMENT DE TRAVAIL CONFIDENTIEL/);
  assert.match(css, /\.opchart\{/);
  assert.match(css, /\.opoffer\{/);
});


test("official AffiAds SVG logo and generated PNGs stay consistent", () => {
  const appIcon = read("assets/app-icon.svg");
  const assistantIcon = read("assets/assistant-icon.svg");
  for (const svg of [appIcon, assistantIcon]) {
    assert.match(svg, /<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(svg, /aria-labelledby="affiads-title affiads-desc"/);
    assert.match(svg, /<title id="affiads-title">AffiAds<\/title>/);
    assert.match(svg, /viewBox="0 0 512 512"/);
    assert.match(svg, /<path[^>]+fill="#FFFFFF"/);
    assert.match(svg, /<circle[^>]+r="76" fill="#FFFFFF"/);
    assert.match(svg, /<circle[^>]+r="52" fill="url\(#affiads-gold\)"/);
    assert.doesNotMatch(svg, /<script|foreignObject|href=["']https?:\/\//i);
  }
  assert.match(html, /assets\/logo-192\.png\?v=2026-\d+/);
  assert.match(html, /class="audit-form-card"/);
  assert.match(html, /AUDIT LOCAL/);
  assert.match(css, /\.ready-card\{/);
  assert.match(sw, /affiads-audit-2026-\d+/);
});


test("2026-75 fixes unreadable dark-theme cards and keeps report preview readable on white paper", () => {
  assert.match(css, /2026-75 • Contrast and coherence/);
  assert.match(css, /:root\[data-theme="dark"\] \.main \.card:not\(\.onepage\):not\(\.report\) h2[^\{]*\{[^}]*color:#edf1ff!important/);
  assert.match(css, /:root\[data-theme="dark"\] \.main \.onepage \.op h1[^\{]*\{[^}]*color:#202653!important/);
  assert.match(css, /\.main \.onepage \.op \.ophead \*/);
  assert.match(html, /assets\/app\.css\?v=2026-75/);
  assert.match(html, /assets\/app\.js\?v=2026-75/);
  assert.match(sw, /affiads-audit-2026-75/);
});
