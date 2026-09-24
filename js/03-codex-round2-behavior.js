(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  function text(el) {
    return (el && el.textContent ? el.textContent : "").replace(/\s+/g, " ").trim();
  }

  function syncResultState() {
    const hasSaved =
      localStorage.getItem("enneagramDiagnosisComplete") === "true" ||
      localStorage.getItem("enneagramQuickResult") ||
      localStorage.getItem("enneagramScores");
    document.body.classList.toggle("check-result-ready", !!hasSaved);
  }

  function normalizeArrowText(root) {
    const walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach((node) => {
      const next = node.nodeValue.replace(/→|->/g, ">");
      if (next !== node.nodeValue) node.nodeValue = next;
    });
  }

  /* 1~9번 탭은 GNB 아래 공통 2Depth 탭(pageSubnav)으로 옮겨져, 여기서는 목차만 다시 만든다. */
  function ensureHandbookTabs() {
    buildHandbookOutline();
  }

  function buildHandbookOutline() {
    const wrap = document.querySelector("#page-handbook .wrap");
    const host = document.querySelector("#handbookTypeHost");
    if (!wrap || !host) return;

    let outline = document.querySelector("#page-handbook .handbook-outline");
    if (!outline) {
      outline = document.createElement("aside");
      outline.className = "handbook-outline";
      outline.innerHTML = '<p class="handbook-outline-title">HANDBOOK INDEX</p><div class="handbook-outline-list"></div>';
      wrap.insertBefore(outline, host);
    }

    const list = outline.querySelector(".handbook-outline-list");
    const headings = Array.from(host.querySelectorAll("h2, h3, h4")).filter((heading) => {
      const value = text(heading);
      return value && value.length > 1 && !heading.closest(".handbook-section-nav");
    }).slice(0, 24);

    let major = 0;
    let minor = 0;
    list.innerHTML = headings.map((heading, index) => {
      if (!heading.id) heading.id = "handbook-auto-heading-" + index;
      const tag = heading.tagName.toLowerCase();
      let no;
      if (tag === "h2") {
        major += 1;
        minor = 0;
        no = String(major);
      } else {
        if (major === 0) major = 1;
        minor += 1;
        no = major + "-" + minor;
      }
      return '<button class="handbook-outline-link" type="button" data-outline-target="' + heading.id + '"><span class="handbook-outline-no">' + no + '</span><span>' + text(heading) + '</span></button>';
    }).join("");

    list.onclick = function (event) {
      const button = event.target.closest("[data-outline-target]");
      if (!button) return;
      const target = document.getElementById(button.getAttribute("data-outline-target"));
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    };
  }

  function removeSharingTools() {
    document.querySelectorAll("#page-sharing .tools, #page-sharing .hero-note, #page-sharing .detail-controls").forEach((el) => el.remove());
  }

  function removePrintControls() {
    document.querySelectorAll('#page-handbook button').forEach(function (button) {
      if (button.textContent.includes('현재 유형 인쇄')) button.remove();
    });
    document.querySelectorAll('[onclick*="printCurrent"]').forEach(function (el) {
      el.remove();
    });
  }

  function removeImageLayoutClasses() {
    document.querySelectorAll("#page-handbook .hero-with-image").forEach(function (el) {
      el.classList.remove("hero-with-image");
      el.classList.remove("hero-no-image");
      el.classList.add("hero-no-media");
    });
  }

  function hideBrokenTopVisuals() {
    document.querySelectorAll(".hero-visual, .visual-card").forEach((el) => {
      if (!el.closest("#page-home")) el.setAttribute("aria-hidden", "true");
    });
  }

  ready(function () {
    ensureHandbookTabs();
    removeSharingTools();
    removePrintControls();
    removeImageLayoutClasses();
    hideBrokenTopVisuals();
    syncResultState();
    normalizeArrowText(document.body);

    const handbookHost = document.querySelector("#handbookTypeHost");
    if (handbookHost && "MutationObserver" in window) {
      const observer = new MutationObserver(function () {
        ensureHandbookTabs();
        removeImageLayoutClasses();
      });
      observer.observe(handbookHost, { childList: true, subtree: true });
    }

    document.addEventListener("click", function (event) {
      if (event.target.closest(".shell-handbook-type, [data-top-handbook]")) {
        setTimeout(ensureHandbookTabs, 140);
      }
      if (event.target.closest("#page-check button, #page-check input")) {
        setTimeout(syncResultState, 120);
      }
      setTimeout(function () { normalizeArrowText(document.body); }, 160);
    });

    if ("MutationObserver" in window) {
      const arrowObserver = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          mutation.addedNodes.forEach(function (node) {
            if (node.nodeType === Node.TEXT_NODE) {
              node.nodeValue = node.nodeValue.replace(/→|->/g, ">");
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              normalizeArrowText(node);
            }
          });
        });
      });
      arrowObserver.observe(document.body, { childList: true, subtree: true });
    }
  });
})();
