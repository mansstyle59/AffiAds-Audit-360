/* Logo.dev integration for AffiAds Audit 360°.
 * Only a publishable pk_ token is accepted. Secret sk_ keys are rejected.
 * Logos are optional: without a token, the audit and PDF work unchanged.
 */
(function (root) {
  "use strict";
  const STORAGE_KEY = "affiads.logoDev.publishableToken";
  const TOKEN_RE = /^pk_[A-Za-z0-9_-]{8,}$/;

  function isPublishableToken(value) {
    return typeof value === "string" && TOKEN_RE.test(value.trim());
  }

  function logoUrl(name, token) {
    const cleanName = String(name || "").trim();
    const cleanToken = String(token || "").trim();
    if (!cleanName || !isPublishableToken(cleanToken)) return "";
    return "https://img.logo.dev/name/" + encodeURIComponent(cleanName) +
      "?token=" + encodeURIComponent(cleanToken) + "&size=96&format=png&fallback=monogram";
  }

  function readToken() {
    try {
      const value = root.localStorage.getItem(STORAGE_KEY) || "";
      return isPublishableToken(value) ? value : "";
    } catch (_) {
      return "";
    }
  }

  function createBrandLogo(name, compact) {
    const token = readToken();
    const src = logoUrl(name, token);
    if (!src || !root.document) return null;
    const wrap = root.document.createElement("div");
    wrap.className = "logodev-brand" + (compact ? " logodev-brand--compact" : "");
    const img = root.document.createElement("img");
    img.src = src;
    img.alt = "Logo de " + String(name || "").trim();
    img.width = compact ? 42 : 56;
    img.height = compact ? 42 : 56;
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    img.addEventListener("error", function () { wrap.remove(); }, { once: true });
    const label = root.document.createElement("span");
    label.textContent = String(name || "").trim();
    wrap.append(img, label);
    return wrap;
  }

  function enhance() {
    if (!root.document) return;
    const token = readToken();
    if (!token) {
      root.document.querySelectorAll(".logodev-brand").forEach(el => el.remove());
      return;
    }
    const summary = root.document.querySelector("#autoSummary");
    const summaryTitle = summary && summary.querySelector("h2");
    if (summaryTitle && !summary.querySelector(".logodev-brand")) {
      const logo = createBrandLogo(summaryTitle.textContent, true);
      if (logo) summaryTitle.insertAdjacentElement("afterend", logo);
    }
    const cover = root.document.querySelector("#report .cover");
    const coverTitle = cover && cover.querySelector("h1");
    if (coverTitle && !cover.querySelector(".logodev-brand")) {
      const logo = createBrandLogo(coverTitle.textContent, false);
      if (logo) coverTitle.insertAdjacentElement("afterend", logo);
    }
  }

  function init() {
    const input = root.document && root.document.getElementById("logoDevToken");
    const status = root.document && root.document.getElementById("logoDevStatus");
    const save = root.document && root.document.getElementById("saveLogoDevToken");
    const remove = root.document && root.document.getElementById("removeLogoDevToken");
    if (input) input.value = readToken();
    function setStatus(message, bad) {
      if (!status) return;
      status.textContent = message;
      status.dataset.state = bad ? "error" : "ok";
    }
    if (save) save.addEventListener("click", function () {
      const value = input ? input.value.trim() : "";
      if (!isPublishableToken(value)) {
        setStatus("Clé refusée. Collez une clé publique Logo.dev commençant par pk_. Les clés secrètes sk_ ne sont jamais acceptées.", true);
        return;
      }
      try {
        root.localStorage.setItem(STORAGE_KEY, value);
        setStatus("Clé publique enregistrée sur cet appareil. Les logos seront ajoutés aux résumés et au PDF.", false);
        enhance();
      } catch (_) {
        setStatus("Impossible d’enregistrer la clé dans ce navigateur.", true);
      }
    });
    if (remove) remove.addEventListener("click", function () {
      try { root.localStorage.removeItem(STORAGE_KEY); } catch (_) {}
      if (input) input.value = "";
      root.document.querySelectorAll(".logodev-brand").forEach(el => el.remove());
      setStatus("Intégration Logo.dev désactivée. Les audits continuent de fonctionner.", false);
    });
    if (root.document && root.MutationObserver) {
      const observer = new root.MutationObserver(enhance);
      ["autoSummary", "report"].forEach(id => {
        const target = root.document.getElementById(id);
        if (target) observer.observe(target, { childList: true, subtree: true });
      });
    }
    enhance();
  }

  const api = { isPublishableToken, logoUrl };
  if (root.document) {
    if (root.document.readyState === "loading") root.document.addEventListener("DOMContentLoaded", init, { once: true });
    else init();
  }
  root.AffiAdsLogoDev = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
