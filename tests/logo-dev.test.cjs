const test = require("node:test");
const assert = require("node:assert/strict");
const { isPublishableToken, logoUrl } = require("../assets/logo-dev.js");

test("accepts publishable Logo.dev keys only", () => {
  assert.equal(isPublishableToken("pk_12345678"), true);
  assert.equal(isPublishableToken(" pk_12345678 "), true);
  assert.equal(isPublishableToken("sk_12345678"), false);
  assert.equal(isPublishableToken(""), false);
  assert.equal(isPublishableToken("pk_short"), false);
  assert.equal(isPublishableToken(null), false);
});

test("builds an encoded HTTPS logo URL without leaking secrets", () => {
  const url = logoUrl("Boulangerie & Fils", "pk_12345678");
  assert.match(url, /^https:\/\/img\.logo\.dev\/name\/Boulangerie%20%26%20Fils\?/);
  assert.match(url, /token=pk_12345678/);
  assert.match(url, /fallback=monogram/);
  assert.equal(logoUrl("Example", "sk_12345678"), "");
  assert.equal(logoUrl("", "pk_12345678"), "");
});

test("integration remains optional and uses a local publishable-token setting", () => {
  const fs = require("node:fs");
  const html = fs.readFileSync("index.html", "utf8");
  const sw = fs.readFileSync("sw.js", "utf8");
  assert.match(html, /id="logoDevToken"/);
  assert.match(html, /assets\/logo-dev\.js/);
  assert.match(sw, /assets\/logo-dev\.js/);
});
