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
  assert.ok(js.includes('$("navNewClient").addEventListener("click",()=>{$("newClient").click()});'));
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
  assert.match(js, /PDF polish 2026-93/);
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


test("2026-93 keeps dark-theme cards, report preview and compact access screen readable", () => {
  assert.match(css, /2026-75 • Contrast and coherence|2026-76 • Contrast and coherence/);
  assert.match(css, /color:#edf1ff!important/);
  assert.match(css, /color:#202653!important/);
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});

test("mobile navigation matches the reference order and all primary actions are reachable", () => {
  assert.match(html, /<span class="t">Accueil<\/span>/);
  assert.match(html, /<span class="t">Clients<\/span>/);
  assert.match(html, /id="navNewClient"[^>]*aria-label="Commencer un nouvel audit"/);
  assert.match(html, /<span class="t">Audits<\/span>/);
  assert.match(html, /id="navMore"/);
  assert.match(html, /data-view="pitch"/);
  assert.match(js, /\$\("navNewClient"\)\.addEventListener\("click",\(\)=>\{\$\("newClient"\)\.click\(\)\}\)/);
});


test("2026-93 compact iPhone access screen stays within small viewports", () => {
  assert.ok(html.includes("assets/app.css?v=2026-93"));
  assert.ok(html.includes("assets/app.js?v=2026-93"));
  assert.ok(css.includes("2026-93 • Compact, safe-area-aware access screen for iPhone"));
  assert.ok(css.includes("min-height:100dvh"));
  assert.ok(css.includes("overflow-y:auto"));
  assert.ok(css.includes("grid-template-columns:repeat(3,58px)!important"));
  assert.ok(sw.includes("affiads-audit-2026-93"));
});


test("2026-93 remembers trusted access in Safari and installed PWA without prompting on every open", () => {
  assert.match(js, /const unlockedPwaSession=previous\.pwaTrusted===true/);
  assert.match(js, /if\(Lock\.mode==="unlock"\)\{Lock\.cfg\.pwaTrusted=true/);
  assert.doesNotMatch(js, /if\(!standalone&&Lock\.cfg&&Lock\.cfg\.hash&&!document\.body\.classList\.contains\("locked"\)\)lockNow\(false\)/);
  assert.match(js, /Choisissez quand le code doit être redemandé/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 keeps optional Google Fonts from blocking the first render", () => {
  assert.match(html, /fonts\.googleapis\.com[^"]+display=swap" media="print" onload="this\.media='all'"/);
  assert.match(html, /<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com/);
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});

test("2026-93 keeps dark-mode audit form and readiness copy high contrast", () => {
  assert.match(css, /:root\[data-theme="dark"\] #view-auto \.audit-form-card \.field label/);
  assert.match(css, /:root\[data-theme="dark"\] #view-auto \.ready-card li/);
  assert.match(css, /color:#edf1ff!important/);
  assert.match(css, /color:#c7d1ee!important/);
});


test("2026-93 enforces readable contrast for body copy, secondary text, forms and links in both themes", () => {
  assert.match(css, /:root\[data-theme="dark"\] \.main \.card:not\(\.onepage\):not\(\.report\) :is\([\s\S]*?color:#f1f4ff!important/);
  assert.match(css, /color:#c8d2ef!important/);
  assert.match(css, /:root\[data-theme="light"\] \.main \.card:not\(\.onepage\):not\(\.report\) :is\([\s\S]*?color:#20294a!important/);
  assert.match(css, /color:#56617c!important/);
  assert.match(css, /:root\[data-theme="dark"\] \.main :is\(input,textarea,select\)/);
  assert.match(css, /:root\[data-theme="light"\] \.main :is\(input,textarea,select\)/);
  assert.match(css, /:root\[data-theme="dark"\] \.main a:not\(\.btn\):not\(\.button\)\{color:#b7c3ff!important/);
  assert.match(css, /:root\[data-theme="light"\] \.main a:not\(\.btn\):not\(\.button\)\{color:#4335c9!important/);
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});

test("2026-93 lets the owner choose and persist when the access code is requested", () => {
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
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});

test("2026-93 applies access-code delay when the app returns from background", () => {
  assert.match(js, /if\(lockDelay\(\)===0&&!document\.body\.classList\.contains\("locked"\)\)lockNow\(false\)/);
  assert.match(js, /if\(lockDelay\(\)>0&&away>=lockDelay\(\)\*60000\)lockNow\(false\)/);
  assert.match(js, /const away=Lock\.hiddenAt\?Date\.now\(\)-Lock\.hiddenAt:0/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 removes the oversized duplicate new-client hero button", () => {
  assert.doesNotMatch(html, /id="heroNewClient"|class="new-client-hero"/);
  assert.doesNotMatch(js, /heroNewClient|new-client-hero/);
  assert.doesNotMatch(css, /\.new-client-hero\{/);
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});

test("2026-93 top bar offers useful Clients, New Audit and PDF actions", () => {
  assert.match(html, /id="topClients"[^>]*title="Ouvrir la liste des clients"/);
  assert.match(html, /id="topNewAudit"[^>]*title="Démarrer un nouvel audit"/);
  assert.match(html, /id="pdf"[^>]*title="Créer le rapport PDF"/);
  assert.match(js, /\$\("topClients"\)\.onclick=\(\)=>nav\("clients"\)/);
  assert.match(js, /\$\("topNewAudit"\)\.onclick=\(\)=>\$\("newClient"\)\.click\(\)/);
  assert.match(css, /\.topacts \.top-action\{display:inline-flex/);
  assert.match(css, /grid-template-columns:minmax\(0,1fr\) minmax\(0,1\.2fr\) auto!important/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 removes all leftover styles for the deleted hero CTA", () => {
  assert.doesNotMatch(css, /new-client-hero|new-client-plus|new-client-copy|new-client-arrow/);
  assert.doesNotMatch(html, /heroNewClient|new-client-hero/);
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 builds a concise, personalized prospect message for each format", () => {
  assert.match(js, /En regardant la présence en ligne de /);
  assert.match(js, /Quelques pistes pour la visibilité de /);
  assert.match(js, /Seriez-vous disponible pour un bref échange/);
  assert.match(js, /Cela vous intéresserait \?/);
  assert.match(js, /slice\(0,tone==="sms"\?1:2\)/);
  assert.match(html, /id="pitchRegen">Actualiser depuis l’audit/);
  assert.match(html, /id="pitchWhatsapp">WhatsApp/);
  assert.match(html, /id="pitchMail">E-mail/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});

test("2026-93 makes prospect composer compact and note readable in both themes", () => {
  assert.match(css, /#view-pitch textarea\.pitch\{min-height:175px;height:175px/);
  assert.match(css, /#view-pitch \.pitch-actions\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.match(css, /#view-pitch \.pitch-actions #pitchRegen\{grid-column:1\/-1\}/);
  assert.match(css, /:root\[data-theme="dark"\] #view-pitch \.pitch-note\{background:#222b55!important/);
  assert.match(css, /:root\[data-theme="light"\] #view-pitch \.pitch-note\{background:#f1f4ff!important/);
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 uses a clear burger menu label instead of the ambiguous Plus tab", () => {
  assert.match(html, /id="navMore" type="button" aria-label="Ouvrir le menu"/);
  assert.match(html, /<span class="t">Menu<\/span><\/button>/);
  assert.match(html, /M4 6h16M4 12h16M4 18h16/);
  assert.match(js, /navMore.*aria-expanded/);
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});

test("2026-93 enforces readable notice contrast and reserves footer space on mobile", () => {
  assert.match(css, /:root\[data-theme="dark"\] \.main \.notice,[\s\S]*?background:#20294f!important;[\s\S]*?color:#f0f3ff!important/);
  assert.match(css, /:root\[data-theme="light"\] \.main \.notice,[\s\S]*?background:#f0f4ff!important;[\s\S]*?color:#253153!important/);
  assert.match(css, /\.main \.footer,.main footer\{[\s\S]*?padding:12px 76px 20px 10px!important/);
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 prevents iPhone Safari form focus auto-zoom without disabling accessibility zoom", () => {
  assert.match(css, /@media \(max-width: 900px\)\{[\s\S]*?\.main input:not\(\[type="checkbox"\]\):not\(\[type="radio"\]\):not\(\[type="range"\]\),[\s\S]*?font-size:16px!important/);
  assert.match(css, /#pinDelay\{[\s\S]*?font-size:16px!important/);
  assert.match(html, /name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/);
  assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
  assert.match(html, /assets\/app\.css\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 assistant widget uses explicit readable colors in dark and light themes", () => {
  assert.match(css, /:root\[data-theme="dark"\] \.botpanel \.bcard,[\s\S]*?background:var\(--bot-card-bg\)!important/);
  assert.match(css, /:root\[data-theme="dark"\] \.botpanel \.bcard b,[\s\S]*?color:var\(--bot-text\)!important/);
  assert.match(css, /:root\[data-theme="dark"\] \.botpanel \.botfield textarea::placeholder[\s\S]*?opacity:1!important/);
  assert.match(css, /:root\[data-theme="light"\] \.botpanel \.bcard b,[\s\S]*?color:#20264a!important/);
  assert.match(css, /:root\[data-theme="light"\] \.botpanel \.botfield textarea[\s\S]*?-webkit-text-fill-color:#20264a!important/);
  assert.ok(html.includes("assets/app.css?v=2026-93"));
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 assistant prioritizes client lookup and shows stored client details", () => {
  assert.match(js, /\["find","Trouver un client","Par nom, ville, téléphone ou site"\]/);
  assert.match(js, /function botClientSearchText\(a\)/);
  assert.match(js, /function botClientDetail\(a\)/);
  assert.match(js, /\["Ouvrir la fiche",\(\)=>\{switchTo\(a\.id\)/);
  assert.match(js, /\["Message prospect",\(\)=>\{switchTo\(a\.id\)/);
  assert.match(js, /\["info","Fiche client","Coordonnées, audit, score et priorités"\]/);
  assert.match(js, /Dossiers clients enregistrés \(recherche locale sur cet appareil\)/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 report preview has a helpful empty state and avoids floating assistant overlap", () => {
  assert.ok(js.includes('b.name||"Votre prochain audit"'));
  assert.ok(js.includes("Renseignez le nom et la ville du commerce pour personnaliser ce rapport."));
  assert.ok(css.includes('body[data-view="report"] .botfab{display:none!important}'));
  assert.ok(css.includes("#view-report .onepage .op-emptyhint"));
  assert.ok(css.includes("#view-report .actions{display:grid!important;grid-template-columns:1fr 1fr!important"));
  assert.ok(html.includes("assets/app.css?v=2026-93"));
  assert.ok(html.includes("assets/app.js?v=2026-93"));
  assert.ok(sw.includes("affiads-audit-2026-93"));
});


test("2026-93 home quick actions prioritize client lookup, new audit and audit history", () => {
  assert.match(html, /id="quickFindClient"[\s\S]*?<b>Trouver un client<\/b><small>Recherche instantanée<\/small>/);
  assert.match(html, /id="quickNewAudit"[\s\S]*?<b>Nouvel audit<\/b><small>Analyser un commerce<\/small>/);
  assert.match(html, /id="quickAudits"[\s\S]*?<b>Mes audits<\/b><small>Rapports et historique<\/small>/);
  assert.match(js, /const quickFindClient=\$\("quickFindClient"\);if\(quickFindClient\)quickFindClient\.onclick=\(\)=>\{nav\("clients"\);requestAnimationFrame\(\(\)=>\{\$\("clientSearch"\)\.focus\(\{preventScroll:true\}\)\}\)\}/);
  assert.match(js, /const quickNewAudit=\$\("quickNewAudit"\);if\(quickNewAudit\)quickNewAudit\.onclick=\(\)=>\{nav\("auto"\);\$\("autoName"\)\.focus\(\{preventScroll:true\}\)\}/);
  assert.doesNotMatch(html, /id="quickPosition"/);
  assert.match(html, /assets\/app\.js\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});


test("2026-93 social cards offer direct Google search and one-tap manual profile linking", () => {
  assert.match(js, /data-social-manual=/);
  assert.match(js, /site:\\\"\+match\\[1\\]/);
  assert.match(js, /Collez le lien public de /);
  assert.match(js, /data-social-deep/);
  assert.match(css, /\\.soc-actions \\.soc-mini\\{display:inline-flex/);
  assert.match(html, /assets\\/app\\.js\\?v=2026-93/);
  assert.match(sw, /affiads-audit-2026-93/);
});
