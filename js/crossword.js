(() => {
  const puzzle = window.PUZZLE;
  if (!puzzle) return;

  const dirDelta = {
    across: { dr: 0, dc: 1 },
    down: { dr: 1, dc: 0 },
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalizeLetter(ch) {
    if (!ch) return "";
    const lower = ch.toLowerCase();
    if (lower === "ä") return "Ä";
    if (lower === "ö") return "Ö";
    if (lower === "ü") return "Ü";
    if (lower === "ß") return "S";
    return ch.toUpperCase().replace(/[^A-ZÄÖÜ]/g, "").slice(0, 1);
  }

  function buildModel(data) {
    const cells = new Map();
    const errors = [];
    let maxR = 0;
    let maxC = 0;

    for (const clue of data.clues) {
      const delta = dirDelta[clue.direction];
      if (!delta) {
        errors.push(`Unbekannte Richtung bei Frage ${clue.id}: ${clue.direction}`);
        continue;
      }

      const answer = String(clue.answer || "")
        .toUpperCase()
        .replace(/\s+/g, "");

      if (!answer) {
        errors.push(`Leere Antwort bei Frage ${clue.id}`);
        continue;
      }

      clue._answer = answer;
      clue._cells = [];

      for (let i = 0; i < answer.length; i++) {
        const r = clue.row + delta.dr * i;
        const c = clue.col + delta.dc * i;
        const key = `${r},${c}`;
        const letter = answer[i];
        const existing = cells.get(key);

        if (existing && existing.letter !== letter) {
          errors.push(
            `Konflikt bei (${r},${c}): „${existing.letter}“ vs „${letter}“ (Frage ${clue.id})`
          );
        }

        const cell = existing || {
          r,
          c,
          letter,
          number: null,
          isSolution: false,
          value: "",
        };
        cell.letter = letter;
        cells.set(key, cell);
        clue._cells.push(cell);
        maxR = Math.max(maxR, r);
        maxC = Math.max(maxC, c);
      }

      const start = cells.get(`${clue.row},${clue.col}`);
      if (start) {
        start.number = start.number == null ? clue.id : Math.min(start.number, clue.id);
      }
    }

    const solutionKeys = (data.solutionPath || []).map(({ r, c }) => `${r},${c}`);
    for (const key of solutionKeys) {
      const cell = cells.get(key);
      if (!cell) errors.push(`solutionPath trifft leere Zelle: ${key}`);
      else cell.isSolution = true;
    }

    return { cells, maxR, maxC, errors, solutionKeys };
  }

  function renderInstructionPage() {
    const root = document.getElementById("instruction-root");
    if (!root) return;

    const info = puzzle.instruction || {};
    const title = document.getElementById("instruction-title");
    if (title) title.textContent = info.title || "Anleitung";

    const body = Array.isArray(info.body) ? info.body : [String(info.body || "")];
    root.innerHTML = body.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
  }

  function initCrossword() {
    const boardEl = document.getElementById("board");
    const cluesEl = document.getElementById("clues");
    const solutionEl = document.getElementById("solution-word");
    const titleEl = document.getElementById("puzzle-title");
    const subtitleEl = document.getElementById("puzzle-subtitle");
    const errorEl = document.getElementById("puzzle-error");

    if (!boardEl || !cluesEl) return;

    if (titleEl) titleEl.textContent = puzzle.title || "Kreuzworträtsel";
    if (subtitleEl) subtitleEl.textContent = puzzle.subtitle || "";

    const model = buildModel(puzzle);
    if (model.errors.length && errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = model.errors.join(" · ");
      console.error(model.errors);
    }

    let activeClueId = puzzle.clues[0]?.id ?? null;
    const inputEls = new Map();

    boardEl.style.gridTemplateColumns = `repeat(${model.maxC + 1}, minmax(2.4rem, 2.75rem))`;

    for (let r = 0; r <= model.maxR; r++) {
      for (let c = 0; c <= model.maxC; c++) {
        const key = `${r},${c}`;
        const cell = model.cells.get(key);

        if (!cell) {
          const block = document.createElement("div");
          block.className = "cell cell--block";
          block.setAttribute("aria-hidden", "true");
          boardEl.appendChild(block);
          continue;
        }

        const wrap = document.createElement("div");
        wrap.style.position = "relative";

        if (cell.number != null) {
          const num = document.createElement("span");
          num.className = "cell-num";
          num.textContent = String(cell.number);
          wrap.appendChild(num);
        }

        const input = document.createElement("input");
        input.className = "cell" + (cell.isSolution ? " cell--solution" : "");
        input.type = "text";
        input.inputMode = "text";
        input.autocomplete = "off";
        input.autocapitalize = "characters";
        input.spellcheck = false;
        input.maxLength = 1;
        input.dataset.r = String(r);
        input.dataset.c = String(c);
        input.setAttribute(
          "aria-label",
          `Feld${cell.number != null ? " " + cell.number : ""} Zeile ${r + 1}, Spalte ${c + 1}`
        );

        wrap.appendChild(input);
        boardEl.appendChild(wrap);
        inputEls.set(key, input);
      }
    }

    function clueById(id) {
      return puzzle.clues.find((c) => c.id === id);
    }

    function cellsForClue(clue) {
      return clue?._cells || [];
    }

    function highlightClue() {
      document.querySelectorAll(".clue").forEach((el) => {
        el.classList.toggle("is-active", Number(el.dataset.id) === activeClueId);
      });
    }

    function focusCell(r, c) {
      inputEls.get(`${r},${c}`)?.focus();
    }

    function setActiveClue(id, focusFirstEmpty = true) {
      activeClueId = id;
      highlightClue();
      const clue = clueById(id);
      if (!clue) return;
      const cells = cellsForClue(clue);
      const target = focusFirstEmpty ? cells.find((c) => !c.value) || cells[0] : cells[0];
      if (target) focusCell(target.r, target.c);
    }

    function updateSolution() {
      if (!solutionEl) return;
      const letters = model.solutionKeys.map((key) => model.cells.get(key)?.value || "·");
      solutionEl.textContent = letters.join("");
      const complete = model.solutionKeys.every((key) => {
        const cell = model.cells.get(key);
        return cell && cell.value === cell.letter;
      });
      solutionEl.classList.toggle("is-complete", complete);
    }

    function updateClueDoneState() {
      for (const clue of puzzle.clues) {
        const done = cellsForClue(clue).every((c) => c.value === c.letter);
        document
          .querySelector(`.clue[data-id="${clue.id}"]`)
          ?.classList.toggle("is-done", done);
      }
    }

    function moveWithinClue(fromR, fromC, step) {
      const cells = cellsForClue(clueById(activeClueId));
      const idx = cells.findIndex((c) => c.r === fromR && c.c === fromC);
      const next = cells[idx + step];
      if (next) focusCell(next.r, next.c);
      return next;
    }

    function onLetter(r, c, raw) {
      const key = `${r},${c}`;
      const cell = model.cells.get(key);
      const input = inputEls.get(key);
      if (!cell || !input) return;

      const letter = normalizeLetter(raw);
      cell.value = letter;
      input.value = letter;
      updateSolution();
      updateClueDoneState();
      if (letter) moveWithinClue(r, c, 1);
    }

    function renderClues() {
      const across = puzzle.clues.filter((c) => c.direction === "across");
      const down = puzzle.clues.filter((c) => c.direction === "down");

      function group(title, list) {
        if (!list.length) return "";
        const items = list
          .map(
            (c) => `
          <li>
            <button type="button" class="clue" data-id="${c.id}">
              <span class="clue-num">${c.id}</span>
              <span class="clue-text">${escapeHtml(c.clue)}</span>
            </button>
          </li>`
          )
          .join("");
        return `
          <section class="clue-group">
            <h2>${title}</h2>
            <ul class="clue-list">${items}</ul>
          </section>`;
      }

      cluesEl.innerHTML = group("Waagerecht", across) + group("Senkrecht", down);
      cluesEl.querySelectorAll(".clue").forEach((btn) => {
        btn.addEventListener("click", () => setActiveClue(Number(btn.dataset.id)));
      });
    }

    renderClues();

    for (const [key, input] of inputEls) {
      const [r, c] = key.split(",").map(Number);

      input.addEventListener("focus", () => {
        const owning = puzzle.clues.filter((clue) =>
          cellsForClue(clue).some((cell) => cell.r === r && cell.c === c)
        );
        if (!owning.some((clue) => clue.id === activeClueId) && owning[0]) {
          activeClueId = owning[0].id;
        }
        highlightClue();
      });

      input.addEventListener("beforeinput", (e) => {
        if (e.inputType === "insertText" && e.data) {
          e.preventDefault();
          onLetter(r, c, e.data);
        }
      });

      input.addEventListener("input", () => {
        const v = input.value;
        if (!v) {
          const cell = model.cells.get(key);
          if (cell) cell.value = "";
          updateSolution();
          updateClueDoneState();
          return;
        }
        onLetter(r, c, v.slice(-1));
      });

      input.addEventListener("keydown", (e) => {
        if (e.key === "Backspace") {
          e.preventDefault();
          const cell = model.cells.get(key);
          if (cell?.value) {
            cell.value = "";
            input.value = "";
            updateSolution();
            updateClueDoneState();
          } else {
            const prev = moveWithinClue(r, c, -1);
            if (prev) {
              prev.value = "";
              const prevInput = inputEls.get(`${prev.r},${prev.c}`);
              if (prevInput) prevInput.value = "";
              updateSolution();
              updateClueDoneState();
            }
          }
          return;
        }

        if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
          const acrossClue = puzzle.clues.find(
            (clue) =>
              clue.direction === "across" &&
              cellsForClue(clue).some((cell) => cell.r === r && cell.c === c)
          );
          if (acrossClue) {
            e.preventDefault();
            activeClueId = acrossClue.id;
            highlightClue();
            moveWithinClue(r, c, e.key === "ArrowRight" ? 1 : -1);
          }
        }

        if (e.key === "ArrowDown" || e.key === "ArrowUp") {
          const downClue = puzzle.clues.find(
            (clue) =>
              clue.direction === "down" &&
              cellsForClue(clue).some((cell) => cell.r === r && cell.c === c)
          );
          if (downClue) {
            e.preventDefault();
            activeClueId = downClue.id;
            highlightClue();
            moveWithinClue(r, c, e.key === "ArrowDown" ? 1 : -1);
          }
        }
      });
    }

    updateSolution();
    if (activeClueId != null) setActiveClue(activeClueId, true);
  }

  if (document.body.dataset.page === "instruction") renderInstructionPage();
  if (document.body.dataset.page === "puzzle") initCrossword();
})();
