(() => {
  const FS_KEY = "weddingFs";

  function fullscreenElement() {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      null
    );
  }

  async function enterFullscreen() {
    document.documentElement.classList.add("is-immersive");
    const el = document.documentElement;
    try {
      if (fullscreenElement()) return true;
      if (el.requestFullscreen) {
        await el.requestFullscreen({ navigationUI: "hide" });
        return true;
      }
      if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen();
        return true;
      }
    } catch (_) {
      /* iOS / blocked — CSS immersive remains */
    }
    return false;
  }

  function markWantFullscreen() {
    try {
      sessionStorage.setItem(FS_KEY, "1");
    } catch (_) {}
  }

  function wantsFullscreen() {
    try {
      return sessionStorage.getItem(FS_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function clearWantFullscreen() {
    try {
      sessionStorage.removeItem(FS_KEY);
    } catch (_) {}
  }

  /** Startseite: Klick → Vollbild → Rätsel */
  function wireStartPage() {
    const start = document.getElementById("start-puzzle");
    if (!start) return;

    start.addEventListener("click", async (e) => {
      e.preventDefault();
      markWantFullscreen();
      await enterFullscreen();
      window.location.href = start.href || "raetsel.html";
    });
  }

  /**
   * Nach Navigation ist echtes Fullscreen oft weg.
   * CSS-Immersive sofort; beim ersten Tap erneut Fullscreen-API.
   */
  function wirePuzzlePage() {
    if (document.body.dataset.page !== "puzzle") return;
    if (!wantsFullscreen()) return;

    document.documentElement.classList.add("is-immersive");

    const resume = async () => {
      await enterFullscreen();
    };

    if (!fullscreenElement()) {
      document.addEventListener("pointerdown", resume, { once: true, capture: true });
      document.addEventListener("touchstart", resume, { once: true, capture: true, passive: true });
    }
  }

  document.addEventListener("fullscreenchange", () => {
    if (fullscreenElement()) {
      document.documentElement.classList.add("is-immersive");
    }
  });

  wireStartPage();
  wirePuzzlePage();

  window.WeddingFS = { enterFullscreen, wantsFullscreen, clearWantFullscreen };
})();
