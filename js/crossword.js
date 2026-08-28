(() => {
  const puzzle = window.PUZZLE;
  if (!puzzle) return;


  function normalizeLetter(ch) {
    if (!ch) return "";
    const lower = ch.toLowerCase();
    if (lower === "ä") return "Ä";
    if (lower === "ö") return "Ö";
    if (lower === "ü") return "Ü";
    if (lower === "ß") return "S";
    return ch.toUpperCase().replace(/[^A-ZÄÖÜ]/g, "").slice(0, 1);
  }

  // Web Crypto SHA-256 helper
  async function computeHash(text) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  }


  function initQuiz() {
    const quizContainer = document.getElementById("quiz-container");
    const finalContainer = document.getElementById("final-container");
    const progressEl = document.getElementById("quiz-progress");
    const questionEl = document.getElementById("quiz-question");
    const inputRowEl = document.getElementById("quiz-input-row");
    const btnNext = document.getElementById("btn-next");
    const feedbackOverlay = document.getElementById("feedback-overlay");
    const feedbackText = document.getElementById("feedback-text");
    const titleEl = document.getElementById("puzzle-title");
    const subtitleEl = document.getElementById("puzzle-subtitle");
    const canvas = document.getElementById("celebration-canvas");

    if (!quizContainer || !finalContainer || !inputRowEl || !btnNext) return;

    if (titleEl) titleEl.textContent = puzzle.title || "Hochzeit-Rätsel";
    if (subtitleEl) subtitleEl.textContent = puzzle.subtitle || "";

    let currentClueIndex = 0;
    let isVerifying = false;

    function renderQuestion() {
      const clue = puzzle.clues[currentClueIndex];
      if (!clue) return;

      // Update progress & question
      progressEl.textContent = `Frage ${currentClueIndex + 1} von ${puzzle.clues.length}`;
      // Update question text; insert zero‑width space after hyphens to allow line‑breaks while keeping the dash visible
      questionEl.innerHTML = clue.clue.replace(/-/g, '-&#8203;');

      // Clear & rebuild inputs
      inputRowEl.innerHTML = "";
      if (clue.id === 2) {
        inputRowEl.classList.add("quiz-input-row--small");
      } else {
        inputRowEl.classList.remove("quiz-input-row--small");
      }
      const inputs = [];
      const pattern = clue.pattern || "o".repeat(clue.length);

      const words = pattern.split(" ");
      words.forEach((wordPattern) => {
        const wordRow = document.createElement("div");
        wordRow.className = "word-row";
        inputRowEl.appendChild(wordRow);

        for (let i = 0; i < wordPattern.length; i++) {
          const input = document.createElement("input");
          input.className = "cell";
          input.type = "text";
          input.inputMode = "text";
          input.autocomplete = "off";
          input.autocapitalize = "characters";
          input.spellcheck = false;
          input.maxLength = 1;
          
          const currentIdx = inputs.length;
          input.dataset.index = currentIdx;
          input.setAttribute("aria-label", `Buchstabe ${currentIdx + 1} von ${clue.length}`);

          wordRow.appendChild(input);
          inputs.push(input);

          // Auto-advance
          input.addEventListener("input", (e) => {
            const val = normalizeLetter(input.value);
            input.value = val;
            if (val && currentIdx < clue.length - 1) {
              inputs[currentIdx + 1].focus();
            }
          });

          // Auto-backspace
          input.addEventListener("keydown", (e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              if (input.value) {
                input.value = "";
              } else if (currentIdx > 0) {
                inputs[currentIdx - 1].value = "";
                inputs[currentIdx - 1].focus();
              }
            }
          });

          // Select text on focus
          input.addEventListener("focus", () => {
            input.select();
          });
        }
      });

      // Focus the first input box
      if (inputs[0]) inputs[0].focus();
    }

    async function checkAnswer() {
      if (isVerifying) return;
      
      const clue = puzzle.clues[currentClueIndex];
      if (!clue) return;

      const inputs = Array.from(inputRowEl.querySelectorAll("input"));
      const rawAnswer = inputs.map(input => input.value).join("");
      const normalizedAnswer = rawAnswer.toUpperCase().replace(/\s+/g, "");

      if (normalizedAnswer.length < clue.length) {
        // Focus first empty input
        const emptyInput = inputs.find(input => !input.value);
        if (emptyInput) emptyInput.focus();
        return;
      }

      isVerifying = true;
      const userHash = await computeHash(normalizedAnswer);

      if (userHash === clue.hash) {
        // Show correct overlay
        feedbackText.textContent = "RICHTIG";
        feedbackText.className = "feedback-text correct";
        feedbackOverlay.hidden = false;
        
        // Force reflow and add pop animation
        feedbackText.offsetHeight;
        feedbackText.classList.add("pop");

        setTimeout(() => {
          feedbackOverlay.hidden = true;
          feedbackText.classList.remove("pop");
          currentClueIndex++;
          isVerifying = false;

          if (currentClueIndex < puzzle.clues.length) {
            renderQuestion();
          } else {
            showFinalScreen();
          }
        }, 1200);
      } else {
        // Show wrong overlay
        feedbackText.textContent = "FALSCH";
        feedbackText.className = "feedback-text wrong";
        feedbackOverlay.hidden = false;
        
        // Force reflow and add pop animation
        feedbackText.offsetHeight;
        feedbackText.classList.add("pop");

        setTimeout(() => {
          feedbackOverlay.hidden = true;
          feedbackText.classList.remove("pop");
          
          // Clear all inputs
          inputs.forEach(input => { input.value = ""; });
          if (inputs[0]) inputs[0].focus();
          isVerifying = false;
        }, 1500);
      }
    }

    function showFinalScreen() {
      quizContainer.hidden = true;
      finalContainer.hidden = false;
      if (titleEl) titleEl.textContent = "Geschafft!";
      if (subtitleEl) subtitleEl.hidden = true;
      
      startCelebration();
    }

    function startCelebration() {
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      
      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      window.addEventListener("resize", () => {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      });

      const rockets = [];
      const particles = [];
      const fallingItems = [];
      const emojis = ["💶", "💵", "💰"];

      // Setup classes
      class Rocket {
        constructor() {
          this.x = Math.random() * width;
          this.y = height;
          this.tx = Math.random() * width;
          this.ty = Math.random() * (height * 0.45) + height * 0.05;
          const angle = Math.atan2(this.ty - this.y, this.tx - this.x);
          const speed = Math.random() * 5 + 10;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
          this.color = `hsl(${Math.random() * 360}, 100%, 70%)`;
        }

        update() {
          this.x += this.vx;
          this.y += this.vy;
          this.vy += 0.05; // Gravity on launch
        }

        draw() {
          ctx.beginPath();
          ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.shadowBlur = 10;
          ctx.shadowColor = this.color;
          ctx.fill();
          ctx.shadowBlur = 0; // reset
        }
      }

      class Particle {
        constructor(x, y, color) {
          this.x = x;
          this.y = y;
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 5 + 2;
          this.vx = Math.cos(angle) * speed;
          this.vy = Math.sin(angle) * speed;
          this.gravity = 0.08;
          this.alpha = 1;
          this.fade = Math.random() * 0.015 + 0.01;
          this.color = color;
          this.size = Math.random() * 2 + 1.5;
        }

        update() {
          this.x += this.vx;
          this.y += this.vy;
          this.vy += this.gravity;
          this.alpha -= this.fade;
        }

        draw() {
          ctx.save();
          ctx.globalAlpha = this.alpha;
          ctx.beginPath();
          ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          ctx.fillStyle = this.color;
          ctx.shadowBlur = 6;
          ctx.shadowColor = this.color;
          ctx.fill();
          ctx.restore();
        }
      }

      class FallingItem {
        constructor() {
          this.x = Math.random() * width;
          this.y = -50;
          this.vy = Math.random() * 2.5 + 1.5;
          this.rotation = Math.random() * Math.PI * 2;
          this.vRotation = Math.random() * 0.04 - 0.02;
          this.emoji = emojis[Math.floor(Math.random() * emojis.length)];
          this.fontSize = Math.floor(Math.random() * 16) + 24; // 24px - 40px
        }

        update() {
          this.y += this.vy;
          this.rotation += this.vRotation;
        }

        draw() {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rotation);
          ctx.font = `${this.fontSize}px sans-serif`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(this.emoji, 0, 0);
          ctx.restore();
        }
      }

      function loop() {
        ctx.clearRect(0, 0, width, height);

        // 1. Spawning
        if (Math.random() < 0.04 && rockets.length < 5) {
          rockets.push(new Rocket());
        }
        if (Math.random() < 0.06 && fallingItems.length < 50) {
          fallingItems.push(new FallingItem());
        }

        // 2. Rockets
        for (let i = rockets.length - 1; i >= 0; i--) {
          const r = rockets[i];
          r.update();
          r.draw();

          // Explode check
          if (r.vy >= 0 || r.y <= r.ty) {
            // Explode!
            const count = Math.floor(Math.random() * 30) + 50;
            for (let j = 0; j < count; j++) {
              particles.push(new Particle(r.x, r.y, r.color));
            }
            rockets.splice(i, 1);
          }
        }

        // 3. Particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.update();
          if (p.alpha <= 0) {
            particles.splice(i, 1);
          } else {
            p.draw();
          }
        }

        // 4. Falling Emojis
        for (let i = fallingItems.length - 1; i >= 0; i--) {
          const item = fallingItems[i];
          item.update();
          item.draw();

          if (item.y > height + 50) {
            fallingItems.splice(i, 1);
          }
        }

        requestAnimationFrame(loop);
      }

      requestAnimationFrame(loop);
    }

    // Connect Weiter button and global Enter keypress
    btnNext.addEventListener("click", checkAnswer);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        checkAnswer();
      }
    });

    renderQuestion();
  }

  if (document.body.dataset.page === "puzzle") initQuiz();
})();
