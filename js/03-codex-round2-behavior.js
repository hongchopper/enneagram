(function () {
  const typeNames = ["개혁자", "조력자", "성취자", "개인주의자", "탐구자", "충실가", "열정가", "도전자", "평화주의자"];

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

  function clickFirst(selector) {
    const target = document.querySelector(selector);
    if (target) target.click();
  }

  function enhanceCheckPage() {
    const wrap = document.querySelector("#page-check .quick-check-wrap");
    if (!wrap || document.querySelector("#page-check .check-diagnosis-panel")) return;

    const panel = document.createElement("section");
    panel.className = "check-diagnosis-panel";
    panel.innerHTML = [
      "<h3>내 유형 진단하기</h3>",
      "<p>헷갈리는 유형을 고르면 해당 유형의 문항으로 바로 이동합니다. 완료 후 결과가 저장된 상태를 기준으로 점수 결과를 볼 수 있게 구성했습니다.</p>",
      '<div class="check-diagnosis-grid">',
      typeNames.map((name, index) => '<button class="check-diagnosis-type" type="button" data-diagnosis-type="' + (index + 1) + '">' + (index + 1) + '<span class="sr-only">번 ' + name + '</span></button>').join(""),
      "</div>",
      '<button class="check-diagnosis-complete" type="button">진단 완료하고 점수 결과 보기</button>'
    ].join("");

    const firstStep = wrap.querySelector(".quick-step");
    wrap.insertBefore(panel, firstStep || wrap.firstChild);

    panel.addEventListener("click", function (event) {
      const typeButton = event.target.closest("[data-diagnosis-type]");
      if (typeButton) {
        const type = typeButton.getAttribute("data-diagnosis-type");
        localStorage.setItem("enneagramSelectedDiagnosisType", type);
        panel.querySelectorAll(".check-diagnosis-type").forEach((button) => {
          button.classList.toggle("active", button === typeButton);
        });
        clickFirst('[data-check-target="detail-' + type + '"]');
        return;
      }

      if (event.target.closest(".check-diagnosis-complete")) {
        localStorage.setItem("enneagramDiagnosisComplete", "true");
        syncResultState();
        clickFirst('[data-check-target="result"]');
      }
    });

    const selected = localStorage.getItem("enneagramSelectedDiagnosisType");
    if (selected) {
      const selectedButton = panel.querySelector('[data-diagnosis-type="' + selected + '"]');
      if (selectedButton) selectedButton.classList.add("active");
    }
  }

  function labelCheckMenu() {
    const submenu = document.querySelector("#checkGroup .shell-submenu");
    if (!submenu || submenu.querySelector(".codex-check-label")) return;
    const quick = submenu.querySelector('[data-check-target="quick"]');
    const detail = submenu.querySelector('[data-check-target="detail-1"]');
    if (quick) {
      const label = document.createElement("div");
      label.className = "shell-submenu-label codex-check-label";
      label.textContent = "간편 체크";
      submenu.insertBefore(label, quick);
    }
    if (detail) {
      const label = document.createElement("div");
      label.className = "shell-submenu-label shell-submenu-label-mode codex-check-label";
      label.textContent = "내 유형 진단하기";
      submenu.insertBefore(label, detail);
    }
  }

  function ensureHandbookTabs() {
    const wrap = document.querySelector("#page-handbook .wrap");
    const host = document.querySelector("#handbookTypeHost");
    if (!wrap || !host) return;

    let tabs = document.querySelector("#page-handbook .handbook-type-tabs");
    if (!tabs) {
      tabs = document.createElement("nav");
      tabs.className = "handbook-type-tabs";
      tabs.setAttribute("aria-label", "유형별 핸드북 탭");
      tabs.innerHTML = typeNames
        .map((name, index) => '<button class="handbook-type-tab" type="button" data-handbook-tab="' + (index + 1) + '">' + (index + 1) + '번</button>')
        .join("");
      wrap.insertBefore(tabs, wrap.firstChild);
      tabs.addEventListener("click", function (event) {
        const button = event.target.closest("[data-handbook-tab]");
        if (!button) return;
        const type = button.getAttribute("data-handbook-tab");
        localStorage.setItem("enneagramCurrentHandbookType", type);
        clickFirst('.shell-handbook-type[data-type="' + type + '"], [data-top-handbook="' + type + '"]');
        setTimeout(function () {
          syncHandbookTabs(type);
          buildHandbookOutline();
        }, 120);
      });
    }

    const current =
      document.querySelector(".shell-handbook-type.active")?.getAttribute("data-type") ||
      localStorage.getItem("enneagramCurrentHandbookType") ||
      "1";
    syncHandbookTabs(current);
    buildHandbookOutline();
  }

  function syncHandbookTabs(type) {
    document.querySelectorAll("#page-handbook .handbook-type-tab").forEach((button) => {
      button.classList.toggle("active", button.getAttribute("data-handbook-tab") === String(type));
    });
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
      const tabs = document.querySelector("#page-handbook .handbook-type-tabs");
      if (tabs && tabs.nextSibling) wrap.insertBefore(outline, tabs.nextSibling);
      else wrap.insertBefore(outline, host);
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
    labelCheckMenu();
    enhanceCheckPage();
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
