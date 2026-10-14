const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("assets/app.js", "utf8");

// Execute the exact pure helpers used by the app, rather than maintaining copies.
const nets = source.match(/const NETS=\[\["Facebook","facebook\.com"\][^;]+;/)?.[0];
const netOf = source.match(/function netOf\(host\)\{[^\n]+\}/)?.[0];
const profileOk = source.match(/function profileOk\(u\)\{[^\n]+\}/)?.[0];
const norm = source.match(/function norm\(s\)\{[^\n]+\}/)?.[0];
const stop = source.match(/const STOP=new Set\(\[[^\n]+\]\);/)?.[0];
const toks = source.match(/function toks\(s\)\{[^\n]+\}/)?.[0];
assert.ok(nets && netOf && profileOk && norm && stop && toks, "social helper functions must be extractable");
const helpers = vm.runInNewContext([nets, netOf, profileOk, norm, stop, toks,
  "({NETS,netOf,profileOk,norm,toks})"
].join("\n"));

test("recognizes only supported social-network domains", () => {
  assert.equal(helpers.netOf("facebook.com"), "Facebook");
  assert.equal(helpers.netOf("www.facebook.com"), "Facebook");
  assert.equal(helpers.netOf("instagram.com"), "Instagram");
  assert.equal(helpers.netOf("m.tiktok.com"), "TikTok");
  assert.equal(helpers.netOf("youtube.com"), "YouTube");
  assert.equal(helpers.netOf("youtu.be"), "YouTube");
  assert.equal(helpers.netOf("snapchat.com"), "Snapchat");
  assert.equal(helpers.netOf("notfacebook.com"), null);
  assert.equal(helpers.netOf("example.com"), null);
});

test("accepts profile paths and rejects generic/share/search pages", () => {
  assert.equal(helpers.profileOk("https://www.facebook.com/ExampleSalon"), true);
  assert.equal(helpers.profileOk("https://www.instagram.com/example.salon/"), true);
  assert.equal(helpers.profileOk("https://www.tiktok.com/@example"), true);
  assert.equal(helpers.profileOk("https://www.facebook.com/sharer/sharer.php"), false);
  assert.equal(helpers.profileOk("https://www.instagram.com/explore/"), false);
  assert.equal(helpers.profileOk("https://www.youtube.com/watch?v=123"), false);
  assert.equal(helpers.profileOk("not a url"), false);
});

test("normalizes French business names consistently", () => {
  assert.deepEqual(Array.from(helpers.toks("L’Atelier du Café")), ["atelier", "cafe"]);
  assert.equal(helpers.norm("Été & Co"), "ete co");
});

test("deep search uses snippets and keeps broader manual candidates", () => {
  assert.ok(source.includes('String(r.snippet||"")'), "search snippets should contribute to matching");
  assert.ok(source.includes("if(!(exact||matched>=1))continue;"), "deep search should not discard every non-exact lead");
  assert.match(source, /const decisive=best\.rank\.packedMatch\|\|\(best\.rank\.matched>=2&&best\.rank\.cityHits>0\)/,
    "automatic selection must still require a strong match");
});

test("existing links are preserved and incorrect reports can be undone", () => {
  assert.match(source, /Object\.entries\(previous\.found\|\|\{\}\)/);
  assert.match(source, /data-social-restore/);
  assert.match(source, /signalement annulé par l’utilisateur/);
  assert.match(source, /verified:false/);
  assert.match(source, /verified:true/);
});

test("all five networks have a search entry", () => {
  for (const name of ["Facebook", "Instagram", "TikTok", "YouTube", "Snapchat"]) {
    assert.ok(source.includes('["' + name + '"'), name + " should remain configured");
  }
});
