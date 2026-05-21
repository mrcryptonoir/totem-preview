(function () {
  "use strict";

  var script = document.currentScript;

  // Validate that a URL is safe to use as an iframe src (must be http/https).
  function safeSrc(raw) {
    if (!raw) return null;
    try {
      var u = new URL(raw);
      return u.protocol === "https:" || u.protocol === "http:" ? raw : null;
    } catch (_) {
      return null;
    }
  }

  // Validate a CSS color value to prevent style injection.
  var safeColorRe = /^(#[0-9a-fA-F]{3,8}|[a-zA-Z]{2,30}|rgba?\(\s*[\d.,\s%]{0,60}\)|hsla?\(\s*[\d.,\s%]{0,60}\))$/;
  function safeColor(raw, fallback) {
    return safeColorRe.test((raw || "").trim()) ? raw.trim() : fallback;
  }

  var derivedUrl = script.src.replace(/\/embed\.js([?#].*)?$/, "");
  var baseUrl = safeSrc(script.getAttribute("data-url")) || derivedUrl;
  var position = script.getAttribute("data-position") || "bottom-right";
  var buttonColor = safeColor(script.getAttribute("data-color"), "#2563eb");
  var btnPx = Math.min(120, Math.max(32, parseInt(script.getAttribute("data-size") || "56", 10) || 56));
  var title = script.getAttribute("data-title") || "Ask a question";

  // Create toggle button
  var btn = document.createElement("button");
  btn.setAttribute("aria-label", title);
  btn.innerHTML =
    '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">' +
    '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  btn.style.cssText =
    "position:fixed;z-index:99999;width:" + btnPx + "px;height:" + btnPx + "px;" +
    "border-radius:50%;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(0,0,0,0.15);" +
    "display:flex;align-items:center;justify-content:center;background:" + buttonColor + ";" +
    (position.includes("right") ? "right:20px;" : "left:20px;") +
    (position.includes("top") ? "top:20px;" : "bottom:20px;");

  // Create iframe container
  var container = document.createElement("div");
  container.style.cssText =
    "position:fixed;z-index:99998;width:400px;max-width:90vw;height:600px;max-height:80vh;" +
    "border-radius:12px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.2);" +
    "display:none;" +
    (position.includes("right") ? "right:20px;" : "left:20px;") +
    (position.includes("top") ? "top:" + (btnPx + 28) + "px;" : "bottom:" + (btnPx + 28) + "px;");

  var iframe = document.createElement("iframe");
  iframe.src = baseUrl;
  iframe.style.cssText = "width:100%;height:100%;border:none;";
  iframe.setAttribute("title", title);
  iframe.setAttribute("allow", "clipboard-write");
  container.appendChild(iframe);

  var isOpen = false;
  btn.addEventListener("click", function () {
    isOpen = !isOpen;
    container.style.display = isOpen ? "block" : "none";
    btn.innerHTML = isOpen
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  });

  document.body.appendChild(container);
  document.body.appendChild(btn);
})();
