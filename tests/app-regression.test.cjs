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

test("home audit and theme controls are present", () => {
  for (const id of ["view-auto","autoName","autoCity","runAuto","autoToReport","keyNotice","view-settings"]) {
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
  assert.ok(js.includes('$("navNewClient").addEventListener("click",()=>{nav("auto");requestAnimationFrame(()=>{$("autoName").focus({preventScroll:true})})});'));
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
  assert.match(js, /PDF polish 2026-98/);
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


test("2026-98 keeps dark-theme cards, report preview and compact access screen readable", () => {
  assert.match(css, /2026-75 • Contrast and coherence|2026-76 • Contrast and coherence/);
  assert.match(css, /color:#edf1ff!important/);
  assert.match(css, /color:#202653!important/);
  assert.ok(html.includes("assets/app.js?v=2026-98"));
  assert.match(html, /assets\/app\.js\?v=2026-98/);
  assert.match(sw, /affiads-audit-2026-107/);
});

test("mobile navigation matches the reference order and all primary actions are reachable", () => {
  assert.match(html, /<span class="t">Accueil<\/span>/);
  assert.match(html, /<span class="t">Clients<\/span>/);
  assert.match(html, /id="navNewClient"[^>]*aria-label="Commencer un nouvel audit"/);
  assert.match(html, /<span class="t">Audits<\/span>/);
  assert.match(html, /id="navMore"/);
  assert.match(html, /data-view="pitch"/);
  assert.match(js, /\$\("navNewClient"\)\.addEventListener\("click",\(\)=>\{nav\("auto"\);requestAnimationFrame\(\(\)=>\{\$\("autoName"\)\.focus\(\{preventScroll:true\}\)\}\)\}\)/);
});


test("2026-98 compact iPhone access screen stays within small viewports", () => {
  assert.ok(html.includes("assets/app.css?v=2026-107"));
  assert.ok(html.includes("assets/app.js?v=2026-98"));
  assert.ok(css.includes("Finition cohérente mobile") || css.includes("2026-98 finishing") || css.includes("2026-98 final polish"));
  assert.ok(css.includes("min-height:100dvh"));
  assert.ok(css.includes("overflow-y:auto"));
  assert.ok(css.includes("grid-template-columns:repeat(3,58px)!important"));
  assert.ok(sw.includes("affiads-audit-2026-107"));
});


test("2026-98 remembers trusted access in Safari and installed PWA without prompting on every open", () => {
  assert.match(js, /const unlockedPwaSession=previous\.pwaTrusted===true/);
  assert.match(js, /if\(Lock\.mode==="unlock"\)\{Lock\.cfg\.pwaTrusted=true/);
  assert.doesNotMatch(js, /if\(!standalone&&Lock\.cfg&&Lock\.cfg\.hash&&!document\.body\.classList\.contains\("locked"\)\)lockNow\(false\)/);
  assert.match(js, /Choisissez quand le code doit être redemandé/);
  assert.match(html, /assets\/app\.js\?v=2026-98/);
  assert.match(sw, /affiads-audit-2026-107/);
});


test("2026-98 keeps optional Google Fonts from blocking the first render", () => {
  assert.match(html, /fonts\.googleapis\.com[^"]+display=swap" media="print" onload="this\.media='all'"/);
  assert.match(html, /<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com/);
  assert.match(html, /assets\/app\.css\?v=2026-107/);
  assert.match(html, /assets\/app\.js\?v=2026-98/);
  assert.match(sw, /affiads-audit-2026-107/);
});

test("2026-98 keeps dark-mode audit form and readiness copy high contrast", () => {
  assert.match(css, /:root\[data-theme="dark"\] #view-auto \.audit-form-card \.field label/);
  assert.match(css, /:root\[data-theme="dark"\] #view-auto \.ready-card li/);
  assert.match(css, /color:#edf1ff!important/);
  assert.match(css, /color:#c7d1ee!important/);
});


test("2026-98 enforces readable contrast for body copy, secondary text, forms and links in both themes", () => {
  assert.match(css, /:root\[data-theme="dark"\] \.main \.card:not\(\.onepage\):not\(\.report\) :is\([\s\S]*?color:#f1f4ff!important/);
  assert.match(css, /color:#c8d2ef!important/);
  assert.match(css, /:root\[data-theme="light"\] \.main \.card:not\(\.onepage\):not\(\.report\) :is\([\s\S]*?color:#20294a!important/);
  assert.match(css, /color:#56617c!important/);
  assert.match(css, /:root\[data-theme="dark"\] \.main :is\(input,textarea,select\)/);
  assert.match(css, /:root\[data-theme="light"\] \.main :is\(input,textarea,select\)/);
  assert.match(css, /:root\[data-theme="dark"\] \.main a:not\(\.btn\):not\(\.button\)\{color:#b7c3ff!important/);
  assert.match(css, /:root\[data-theme="light"\] \.main a:not\(\.btn\):not\(\.button\)\{color:#4335c9!important/);
  assert.match(html, /assets\/app\.css\?v=2026-107/);
  assert.match(html, /assets\/app\.js\?v=2026-98/);
  assert.match(sw, /affiads-audit-2026-107/);
});

test("2026-98 lets the owner choose and persist when the access code is requested", () => {
  assert.match(html, /id="pinDelay"/);
  for (const value of ["-1","0","5","60","1440","10080"]) assert.ok(html.includes('<option value="'+value+'"'));
  assert.match(html, /id="pinDelayHelp" aria-live="polite"/);
  assert.match(js, /delay:Number\.isFinite\(savedDelay\)\?savedDelay:-1/);
  assert.match(js, /const unlockedPwaSession=previous\.pwaTrusted===true&&stillTrusted\(\)/);
  assert.match(js, /\$\("pinDelay"\)\.addEventListener\("change"/);
  assert.match(js, /Lock\.cfg\.delay=chosen/);
  assert.match(js, /pinDelayDescription\(value\)/);
  assert.match(css, /#pinDelay\{[^}]*font-size:16px!important/);
  assert.match(css, /\.pin-delay-help/);
  assert.match(html, /assets\/app\.css\?v=2026-107/);
  assert.match(html, /assets\/app\.js\?v=2026-98/);
  assert.match(sw, /affiads-audit-2026-107/);
});

test("2026-98 applies access-code delay when the app returns from background", () => {
  assert.match(js, /if\(lockDelay\(\)===0&&!document\.body\.classList\.contains\("locked"\)\)lockNow\(false\)/);
  assert.match(js, /if\(lockDelay\(\)>0&&away>=lockDelay\(\)\*60000\)lockNow\(false\)/);
  assert.match(js, /const away=Lock\.hiddenAt\?Date\.now\(\)-Lock\.hiddenAt:0/);
  assert.match(html, /assets\/app\.js\?v=2026-98/);
  assert.match(sw, /affiads-audit-2026-107/);
});


test("2026-98 removes the oversized duplicate new-client hero button", () => {
  assert.doesNotMatch(html, /id="heroNewClient"|class="new-client-hero"/);
  assert.doesNotMatch(js, /heroNewClient|new-client-hero/);
  assert.doesNotMatch(css, /\.new-client-hero\{/);
  assert.match(html, /assets\/app\.css\?v=2026-107/);
  assert.match(sw, /affiads-audit-2026-107/);
});

test("2026-98 mobile header removes duplicate Clients/New Audit actions while preserving PDF", () => {
  assert.doesNotMatch(html, /id="topClients"|id="topNewAudit"/);
  assert.match(html, /id="pdf"[^>]*title="Créer le rapport PDF"/);
  assert.doesNotMatch(js, /\$\("topClients"\)|\$\("topNewAudit"\)/);
  assert.match(css, /\.topacts\{display:none!important\}/);
  assert.match(js, /\$\("navNewClient"\)\.addEventListener\("click",\(\)=>\{nav\("auto"\);requestAnimationFrame\(\(\)=>\{\$\("autoName"\)\.focus\(\{preventScroll:true\}\)\}\)\}\)/);
  assert.match(html, /assets\/app\.js\?v=2026-98/);
  assert.match(sw, /affiads-audit-2026-107/);
});


test("2026-98 removes all leftover styles for the deleted hero CTA", () => {
  assert.doesNotMatch(css, /new-client-hero|new-client-plus|new-client-copy|new-client-arrow/);
  assert.doesNotMatch(html, /heroNewClient|new-client-hero/);
  assert.match(html, /assets\/app\.css\?v=2026-107/);
  assert.match(sw, /affiads-audit-2026-107/);
});


test("2026-98 builds a concise, personalized prospect message for each format", () => {
  assert.match(js, /En regardant la présence en ligne de /);
  assert.match(js, /Quelques pistes pour la visibilité de /);
  assert.match(js, /Seriez-vous disponible pour un bref échange/);
  assert.match(js, /Cela vous intéresserait \?/);
  assert.match(js, /slice\(0,tone==="sms"\?1:2\)/);
  assert.match(html, /id="pitchRegen">Actualiser depuis l’audit/);
  assert.match(html, /id="pitchWhatsapp">WhatsApp/);
  assert.match(html, /id="pitchMail">E-mail/);
  assert.match(html, /assets\/app\.js\?v=2026-98/);
  assert.match(sw, /affiads-audit-2026-107/);
});

test("2026-98 makes prospect composer compact and note readable in both themes", () => {
  assert.match(css, /#view-pitch textarea\.pitch\{min-height:175px;height:175px/);
  assert.match(css, /#view-pitch \.pitch-actions\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /#view-pitch \.pitch-actions #pitchRegen\{grid-column:1\/-1\}/);
  assert.match(css, /:root\[data-theme="dark"\] #view-pitch \.pitch-note\{background:#222b55!important/);
  assert.match(css, /:root\[data-theme="light"\] #view-pitch \.pitch-note\{background:#f1f4ff!important/);
  assert.match(html, /assets\/app\.css\?v=2026-107/);
  assert.match(sw, /affiads-audit-2026-107/);
});


test("2026-98 uses a clear burger menu label instead of the ambiguous Plus tab", () => {
  assert.match(html, /id="navMore" type="button" aria-label="Ouvrir le menu"/);
  assert.match(html, /<span class="t">Menu<\/span><\/button>/);
  assert.match(html, /M4 6h16M4 12h16M4 18h16/);
  assert.match(js, /navMore.*aria-expanded/);
  assert.match(html, /assets\/app\.css\?v=2026-107/);
  assert.match(sw, /affiads-audit-2026-107/);
});

test("2026-98 enforces readable notice contrast and reserves footer space on mobile", () => {
  assert.match(css, /:root\[data-theme="dark"\] \.main \.notice,[\s\S]*?background:#20294f!important;[\s\S]*?color:#f0f3ff!important/);
  assert.match(css, /:root\[data-theme="light"\] \.main \.notice,[\s\S]*?background:#f0f4ff!important;[\s\S]*?color:#253153!important/);
  assert.match(css, /\.main \.footer,.main footer\{[\s\S]*?padding:12px 76px 20px 10px!important/);
  assert.match(html, /assets\/app\.css\?v=2026-107/);
  assert.match(sw, /affiads-audit-2026-107/);
});


test("2026-98 prevents iPhone Safari form focus auto-zoom without disabling accessibility zoom", () => {
  assert.match(css, /@media \(max-width: 900px\)\{[\s\S]*?\.main input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="range"\]\),[\s\S]*?font-size:16px!important/);
  assert.match(css, /#pinDelay\{[\s\S]*?font-size:16px!important/);
  assert.match(html, /name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/);
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
  assert.match(html, /assets\/app\.css\?v=2026-107/);
  assert.match(sw, /affiads-audit-2026-107/);
});


test("mobile header has styled settings and working quick-theme controls without chat", () => {
  assert.match(html, /id="themeQuickToggle"/);
  assert.match(html, /aria-label="Ouvrir les réglages"/);
  assert.match(html, /assets\/header-actions\.css\?v=2026-107/);
  assert.match(js, /\$\("themeQuickToggle"\)\.onclick/);
  assert.match(js, /Passer au thème sombre/);
  assert.match(css, /body\[data-view="auto"\] \.top\{display:none!important\}/);
  assert.match(css, /padding-bottom:calc\(205px \+ env\(safe-area-inset-bottom\)\)!important/);
});

test("chat assistant interface and runtime have been removed", () => {
  assert.equal(html.includes('id="botFab"'), false);
  assert.equal(html.includes('id="botPanel"'), false);
  assert.equal(html.includes('id="brandAssistantBtn"'), false);
  assert.equal(js.includes("function botAsk("), false);
  assert.equal(js.includes("function initBot("), false);
  assert.equal(js.includes("BOT_GUIDE"), false);
});

test("2026-98 report preview has a helpful empty state", () => {
  assert.ok(js.includes('b.name||"Votre prochain audit"'));
  assert.ok(js.includes("Renseignez le nom et la ville du commerce pour personnaliser ce rapport."));
  assert.ok(css.includes('body[data-view="report"] .botfab{display:none!important}'));
  assert.ok(css.includes("#view-report .onepage .op-emptyhint"));
  assert.ok(css.includes("#view-report .actions{display:grid!important;grid-template-columns:1fr 1fr!important"));
  assert.ok(html.includes("assets/app.css?v=2026-107"));
  assert.ok(html.includes("assets/app.js?v=2026-98"));
  assert.ok(sw.includes("affiads-audit-2026-107"));
});


test("home screen removes redundant quick-action cards and keeps the audit form", () => {
  assert.doesNotMatch(html, /class="quick-actions"/);
  assert.doesNotMatch(html, /id="quickFindClient"|id="quickNewAudit"|id="quickAudits"/);
  assert.match(html, /class="audit-form-card"/);
  assert.match(html, /id="autoName"/);
  assert.match(html, /id="autoCity"/);
  assert.match(html, /id="runAuto"/);
  assert.match(html, /assets\/app\.js\?v=2026-98/);
  assert.match(sw, /affiads-audit-2026-107/);
});


test("2026-98 social cards offer direct Google search and one-tap manual profile linking", () => {
  assert.match(js, /data-social-manual=/);
  assert.ok(js.includes('" site:"+match[1]'));
  assert.match(js, /Collez le lien public de /);
  assert.match(js, /data-social-deep/);
  assert.ok(css.includes(".soc-actions .soc-mini{display:inline-flex"));
  assert.ok(html.includes("assets/app.js?v=2026-98"));
  assert.match(sw, /affiads-audit-2026-107/);
});


test("2026-98 keeps pills, checklist counters and social actions readable on mobile in both themes", () => {
  assert.ok(css.includes(':root[data-theme="dark"] .main :is(.pill,.badge)'));
  assert.ok(css.includes('-webkit-text-fill-color:#f5f7ff!important'));
  assert.ok(css.includes(':root[data-theme="light"] .main :is(.pill,.badge)'));
  assert.ok(css.includes('-webkit-text-fill-color:#28345f!important'));
  assert.ok(css.includes('flex:1 1 68px;width:auto;min-width:0;max-width:100%;min-height:32px'));
  assert.ok(css.includes('overflow-wrap:anywhere;word-break:normal;white-space:normal'));
  assert.ok(html.includes("assets/app.css?v=2026-107"));
  assert.ok(html.includes("assets/app.js?v=2026-98"));
  assert.ok(sw.includes("affiads-audit-2026-107"));
});


test("mobile layout keeps audit and client screens aligned with the bottom navigation", () => {
  assert.match(css, /\.hero-head\{display:grid;grid-template-columns:minmax\(0,1fr\) minmax\(100px,160px\)/);
  assert.match(css, /#view-clients \.clientlist\{display:grid;gap:10px/);
  assert.match(css, /#view-clients \.clientrow \.del\{align-self:center/);
  assert.match(css, /\.main\{padding:18px 16px calc\(var\(--tabbar\) \+ 30px \+ env\(safe-area-inset-bottom\)\)!important/);
  assert.match(css, /\.askactions\{display:grid;grid-template-columns:minmax\(0,1\.3fr\) minmax\(0,\.8fr\)/);
  assert.match(css, /\.nav>button \.t\{display:block!important;font-size:10px!important/);
  assert.match(html, /id="runAuto"/);
  assert.match(html, /id="clientSearch"/);
});


test("mobile header avoids duplicate clients/new-audit controls and central action opens the audit form", () => {
  assert.doesNotMatch(html, /id="topClients"|id="topNewAudit"/);
  assert.match(html, /id="navNewClient"/);
  assert.match(css, /\.topacts\{display:none!important\}/);
  assert.match(js, /\$\("navNewClient"\)\.addEventListener\("click",\(\)=>\{nav\("auto"\);requestAnimationFrame\(\(\)=>\{\$\("autoName"\)\.focus\(\{preventScroll:true\}\)\}\)\}\)/);
});


test("2026-107 positions the gold marker against its input and styles the mobile brand header", () => {
  assert.match(css, /\.askfields\s+\.bigfield\s+\.dot\s*\{[\s\S]*?left:\s*24px\s*!important;[\s\S]*?top:\s*32px\s*!important;[\s\S]*?transform:\s*none\s*!important;/);
  assert.match(css, /\.side\s+\.brand\s+img\s*\{[\s\S]*?width:\s*52px\s*!important;[\s\S]*?height:\s*52px\s*!important;/);
  assert.ok(css.includes("padding: calc(env(safe-area-inset-top) + 2px) 16px 8px !important;"));
  assert.ok(html.includes("assets/app.css?v=2026-107"));
  assert.ok(sw.includes("affiads-audit-2026-107"));
});
