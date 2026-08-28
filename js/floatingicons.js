(() => {
  const ICONS = ["🔍", "❓", "💡", "🧩", "📝", "🗝️", "🎯", "🔑", "💬", "⭐"];
  const ICON_COUNT = 18;

  const canvas = document.getElementById("floating-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let W, H;

  function resize() {
    W = canvas.width = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  class FloatingIcon {
    constructor(immediate) {
      this.reset(immediate);
    }

    reset(immediate) {
      this.emoji = ICONS[Math.floor(Math.random() * ICONS.length)];
      this.size = Math.random() * 22 + 18; // 18–40px
      this.x = Math.random() * W;
      // Start off-screen bottom (or random position on first load)
      this.y = immediate ? Math.random() * H : H + this.size + Math.random() * 200;
      this.speedY = -(Math.random() * 0.5 + 0.25); // float upward slowly
      this.speedX = (Math.random() - 0.5) * 0.35;  // gentle horizontal drift
      this.alpha = Math.random() * 0.18 + 0.07;    // 7%–25% opacity
      this.rotation = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.008;
      this.wobbleOffset = Math.random() * Math.PI * 2;
      this.wobbleSpeed = Math.random() * 0.012 + 0.005;
      this.wobbleAmp = Math.random() * 0.6 + 0.2;  // horizontal wobble amplitude
      this.tick = 0;
    }

    update() {
      this.tick++;
      this.y += this.speedY;
      this.x += this.speedX + Math.sin(this.wobbleOffset + this.tick * this.wobbleSpeed) * this.wobbleAmp;
      this.rotation += this.rotationSpeed;

      // Recycle when drifted off the top
      if (this.y < -this.size - 50) {
        this.reset(false);
      }
    }

    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      ctx.font = `${this.size}px sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, 0, 0);
      ctx.restore();
    }
  }

  // Initialise icons spread across the screen
  const icons = Array.from({ length: ICON_COUNT }, () => new FloatingIcon(true));

  function loop() {
    ctx.clearRect(0, 0, W, H);
    for (const icon of icons) {
      icon.update();
      icon.draw();
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
