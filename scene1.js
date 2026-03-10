/**
 * Scene 1 - Courtroom conviction
 * Andy Dufresne (tank) is convicted of murder and sentenced to two life terms at Shawshank.
 * Press ENTER to continue to Shawshank.
 */
(function () {
  let canvas, ctx;
  let tankImage, judgeImage;
  let tankLoaded = false;
  let judgeLoaded = false;
  let elapsed = 0;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;

    tankImage = new Image();
    tankImage.src = "images/SawTank-Sheet-export.png";
    tankImage.onload = () => (tankLoaded = true);

    judgeImage = new Image();
    judgeImage.src = "images/chrisotfer.png";
    judgeImage.onload = () => (judgeLoaded = true);

    const handler = (e) => {
      if (e.key !== "Enter" || !window.goToScene) return;
      if (window.Dialogue?.visible?.()) return;
      window.removeEventListener("keydown", handler);
      window.goToScene("scene2");
    };
    window.addEventListener("keydown", handler);

    if (window.Dialogue) {
      const script = [
        { speaker: "Judge Christopher", text: "Verdict: Guilty. Murder in the first degree.", portrait: "chrisotfer" },
        { speaker: "Judge Christopher", text: "Saw-Tank — two life sentences at Shawshank State Prison.", portrait: "chrisotfer" },
        { speaker: "Saw-Tank", text: "bzzzzzzz", portrait: "sawTank_face" },
      ];
      window.Dialogue.start(script);
    }
  }

  function update(dt) {
    elapsed += dt;
  }

  function drawJudge() {
    const w = canvas.width;
    const h = canvas.height;
    const benchY = h * 0.22;

    if (judgeLoaded && judgeImage.complete && judgeImage.naturalWidth > 0) {
      const scale = Math.min(180 / judgeImage.width, 200 / judgeImage.height);
      const dw = judgeImage.width * scale;
      const dh = judgeImage.height * scale;
      ctx.drawImage(judgeImage, w / 2 - dw / 2, benchY - dh + 95, dw, dh);
    }
  }

  function drawAndy() {
    if (!tankLoaded || !tankImage.complete) return;

    const w = canvas.width;
    const h = canvas.height;
    const andyX = w / 2;
    const andyY = h * 0.7;

    const frameCount = 2;
    const frameIndex = Math.floor(elapsed * 2) % frameCount;
    const frameWidth = tankImage.width / frameCount;
    const frameHeight = tankImage.height;
    const scale = 1.2;
    const dw = frameWidth * scale;
    const dh = frameHeight * scale;

    ctx.save();
    ctx.translate(andyX, andyY);
    ctx.rotate(-Math.PI / 2);
    const pivotBack = dw * 0.25;
    ctx.drawImage(
      tankImage,
      frameIndex * frameWidth,
      0,
      frameWidth,
      frameHeight,
      -dw / 2 + pivotBack,
      -dh / 2,
      dw,
      dh
    );
    ctx.restore();
  }

  function render() {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // --- Background: wood-paneled courtroom ---
    const woodDark = "#2c1810";
    const woodMid = "#4a2f1f";
    const woodLight = "#5c3d2a";

    ctx.fillStyle = woodDark;
    ctx.fillRect(0, 0, w, h);

    // Vertical wood panels
    const panelW = w / 8;
    for (let i = 0; i <= 8; i++) {
      const x = i * panelW;
      const grad = ctx.createLinearGradient(x, 0, x + panelW, 0);
      grad.addColorStop(0, woodMid);
      grad.addColorStop(0.5, woodLight);
      grad.addColorStop(1, woodMid);
      ctx.fillStyle = grad;
      ctx.fillRect(x, 0, panelW + 1, h);
    }

    // Top molding (no bench/chair behind judge)
    ctx.fillStyle = "#1a0f0a";
    ctx.fillRect(0, 0, w, h * 0.2);

    // Jury box (left side) - below judge bar / verdict plaque
    ctx.fillStyle = "rgba(60, 40, 25, 0.6)";
    ctx.fillRect(w * 0.02, h * 0.54, w * 0.2, h * 0.38);
    ctx.strokeStyle = "#3d2817";
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.02, h * 0.54, w * 0.2, h * 0.38);
    ctx.fillStyle = "#8b7355";
    ctx.font = "14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("JURY", w * 0.12, h * 0.57);

    // Prosecutor table (right side)
    ctx.fillStyle = "rgba(60, 40, 25, 0.5)";
    ctx.fillRect(w * 0.78, h * 0.55, w * 0.2, h * 0.2);
    ctx.strokeStyle = "#3d2817";
    ctx.strokeRect(w * 0.78, h * 0.55, w * 0.2, h * 0.2);

    // Defendant's table (center bottom - where Andy sits)
    ctx.fillStyle = "rgba(45, 30, 20, 0.9)";
    ctx.fillRect(w * 0.25, h * 0.62, w * 0.5, h * 0.25);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.25, h * 0.62, w * 0.5, h * 0.25);

    // Verdict plaque
    ctx.fillStyle = "rgba(30, 20, 15, 0.95)";
    ctx.fillRect(w * 0.15, h * 0.32, w * 0.7, h * 0.18);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 3;
    ctx.strokeRect(w * 0.15, h * 0.32, w * 0.7, h * 0.18);

    // Judge
    drawJudge();

    // Andy (tank) at defendant's table
    drawAndy();

    // "Press ENTER to continue"
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "14px system-ui";
    ctx.fillText("Press ENTER to continue", w / 2, h - 20);
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene1 = { init, update, render };
})();
