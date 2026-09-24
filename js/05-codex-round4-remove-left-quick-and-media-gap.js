(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function compactText(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
  }

  function removeQuickMenus() {
    document.body.classList.add("codex-quick-clean");
    document.querySelectorAll(".codex-remove-quick-menu").forEach(function (el) {
      el.classList.remove("codex-remove-quick-menu");
      el.removeAttribute("aria-hidden");
    });

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    while (walker.nextNode()) {
      if ((walker.currentNode.nodeValue || "").includes("QUICK MENU")) textNodes.push(walker.currentNode);
    }

    textNodes.forEach(function (node) {
      let target = node.parentElement;
      if (!target || target.closest("#page-check")) return;

      while (
        target.parentElement &&
        target.parentElement !== document.body &&
        compactText(target.parentElement).includes("QUICK MENU")
      ) {
        const rect = target.parentElement.getBoundingClientRect();
        if (rect.width > 380 || rect.height > 760 || rect.width < 40 || rect.height < 40) break;
        target = target.parentElement;
      }

      const rect = target.getBoundingClientRect();
      if (rect.width > 380 || rect.height > 760 || rect.width < 40 || rect.height < 40) return;

      target.classList.add("codex-remove-quick-menu");
      target.setAttribute("aria-hidden", "true");
    });
  }

  function removeEmptyHandbookMedia() {
    const host = document.querySelector("#page-handbook");
    if (!host) return;

    Array.from(host.querySelectorAll("*")).forEach(function (el) {
      if (el.id === "handbookTypeHost" || el.classList.contains("handbook-type-tabs")) return;
      if (el.closest(".handbook-type-tabs, .handbook-section-nav")) return;
      if (compactText(el)) return;
      if (el.querySelector("button, input, select, textarea, a, h1, h2, h3, h4, p, li")) return;

      const rect = el.getBoundingClientRect();
      if (rect.top < -20 || rect.top > 760) return;
      if (rect.width < 36 || rect.width > 180 || rect.height < 70 || rect.height > 280) return;

      const style = getComputedStyle(el);
      const hasFrame =
        parseFloat(style.borderTopWidth) > 0 ||
        parseFloat(style.borderRightWidth) > 0 ||
        parseFloat(style.borderBottomWidth) > 0 ||
        parseFloat(style.borderLeftWidth) > 0 ||
        style.backgroundColor !== "rgba(0, 0, 0, 0)";
      const mediaLike = /visual|image|photo|portrait|avatar|thumb|illust|media|figure|graphic/i.test(String(el.className || ""));
      if (hasFrame || mediaLike) {
        el.classList.add("codex-remove-empty-media");
        el.setAttribute("aria-hidden", "true");
      }
    });
  }

  function cleanupRound4() {
    removeQuickMenus();
    removeEmptyHandbookMedia();
  }

  ready(function () {
    cleanupRound4();
    window.addEventListener("hashchange", function () {
      setTimeout(cleanupRound4, 40);
      setTimeout(cleanupRound4, 180);
    });
    document.addEventListener("click", function () {
      setTimeout(cleanupRound4, 40);
      setTimeout(cleanupRound4, 180);
    });
    if ("MutationObserver" in window) {
      new MutationObserver(cleanupRound4).observe(document.body, { childList: true, subtree: true });
    }
  });
})();
