/**
 * Play screen - title screen with SawTank face. Epic rain, red-to-blue, yellow hue.
 */
(function () {
  let canvas, ctx;
  let faceImage;
  let faceLoaded = false;
  let elapsed = 0;

  const W = 960;
  const H = 540;
  const RAIN_COUNT = 280;
  const rain = [];

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;

    for (let i = 0; i < RAIN_COUNT; i++) {
      rain.push({
        x: Math.random() * (W + 100) - 50,
        y: Math.random() * H,
        speed: 180 + Math.random() * 120,
        len: 8 + Math.random() * 16,
        tilt: 0.15 + Math.random() * 0.1,
      });
    }

    faceImage = new Image();
    faceImage.src = "images/sawTank_face.png";
    faceImage.onload = () => (faceLoaded = true);

    const handler = (e) => {
      if (e.key !== "Enter" && e.key !== " ") return;
      if (!window.goToScene) return;
      e.preventDefault();
      window.goToScene("scene1");
    };
    window.addEventListener("keydown", handler, { once: true });
  }

  function update(dt) {
    elapsed += dt;
    for (const r of rain) {
      r.y += r.speed * dt;
      r.x += r.tilt * r.speed * dt;
      if (r.y > H + 20) {
        r.y = -20;
        r.x = Math.random() * (W + 100) - 50;
      }
      if (r.x > W + 50) r.x = -50;
      if (r.x < -50) r.x = W + 50;
    }
  }

  function rainColor(y) {
    const t = y / H;
    const r = Math.round(180 + (80 - 180) * t);
    const g = Math.round(60 + (100 - 60) * t);
    const b = Math.round(100 + (220 - 100) * t);
    return `rgba(${r},${g},${b},0.5)`;
  }

  function render() {
    if (!ctx || !canvas) return;

    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, "#1a0a12");
    grad.addColorStop(0.3, "#0f1520");
    grad.addColorStop(0.7, "#0a1525");
    grad.addColorStop(1, "#050a18");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    for (const r of rain) {
      ctx.strokeStyle = rainColor(r.y);
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - r.tilt * r.len, r.y - r.len);
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = "rgba(255, 220, 120, 0.12)";
    ctx.fillRect(0, 0, W, H);

    const vignette = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.9);
    vignette.addColorStop(0, "rgba(0,0,0,0)");
    vignette.addColorStop(0.6, "rgba(0,0,0,0.3)");
    vignette.addColorStop(1, "rgba(0,0,0,0.7)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, W, H);

    if (faceLoaded && faceImage.complete && faceImage.naturalWidth > 0) {
      ctx.save();
      ctx.shadowColor = "rgba(255, 180, 80, 0.6)";
      ctx.shadowBlur = 40;
      const scale = Math.min(280 / faceImage.width, 280 / faceImage.height);
      const dw = faceImage.width * scale;
      const dh = faceImage.height * scale;
      ctx.drawImage(faceImage, W / 2 - dw / 2, H / 2 - dh / 2 - 30, dw, dh);
      ctx.restore();
    }

    ctx.fillStyle = "#f5e6c8";
    ctx.font = "bold 36px system-ui";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(255, 200, 100, 0.5)";
    ctx.shadowBlur = 12;
    ctx.fillText("SawTank: Prison Break", W / 2, H * 0.22);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255, 235, 180, 0.9)";
    ctx.font = "16px system-ui";
    ctx.fillText("Press ENTER or SPACE to play", W / 2, H - 40);
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.play = { init, update, render };
})();
