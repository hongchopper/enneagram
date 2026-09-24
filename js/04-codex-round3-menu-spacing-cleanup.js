(function () {
  function cleanupRound3() {
    document.querySelectorAll("#page-handbook .handbook-outline, #page-check .check-diagnosis-panel").forEach(function (el) {
      el.remove();
    });
  }

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  }

  ready(function () {
    cleanupRound3();
    document.addEventListener("click", function () {
      setTimeout(cleanupRound3, 80);
      setTimeout(cleanupRound3, 180);
    });
    window.addEventListener("hashchange", function () {
      setTimeout(cleanupRound3, 80);
    });
    if ("MutationObserver" in window) {
      new MutationObserver(cleanupRound3).observe(document.body, { childList: true, subtree: true });
    }
  });
})();
