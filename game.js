/**
 * Scene Manager - orchestrates multiple scenes
 * Scenes are loaded from scene1.js, scene2.js, etc.
 */
(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // --- Scene state ---
  let currentSceneName = "scene1";
  let currentScene = null;
  let lastTime = 0;

  function goToScene(name) {
    const sceneDef = window.Scenes?.[name];
    if (!sceneDef) return;
    if (window.Dialogue?.hide) window.Dialogue.hide();
    currentSceneName = name;
    currentScene = sceneDef;
    sceneDef.init({ canvas, ctx });
  }

  // --- VCR post-process ---
  let vcrGlitchTimer = 0;

  function drawVCR(dt) {
    const W = canvas.width;
    const H = canvas.height;

    // Grain
    const grainCount = 220;
    for (let i = 0; i < grainCount; i++) {
      const gx = Math.random() * W;
      const gy = Math.random() * H;
      const gs = Math.random() * 2 + 1;
      const ga = Math.random() * 0.12 + 0.03;
      ctx.fillStyle = `rgba(255,255,255,${ga})`;
      ctx.fillRect(gx, gy, gs, gs);
    }

    // Horizontal glitch band
    vcrGlitchTimer -= dt;
    if (vcrGlitchTimer <= 0) {
      vcrGlitchTimer = 0.8 + Math.random() * 2.5;
      const gy = Math.random() * H;
      const gh = 1 + Math.random() * 4;
      const shift = (Math.random() - 0.5) * 14;
      ctx.save();
      ctx.globalAlpha = 0.35;
      const slice = ctx.getImageData(0, gy, W, gh);
      ctx.putImageData(slice, shift, gy);
      ctx.restore();
    }

    // Subtle RGB fringe on left edge
    ctx.save();
    const fringe = ctx.createLinearGradient(0, 0, 18, 0);
    fringe.addColorStop(0, "rgba(255,0,0,0.06)");
    fringe.addColorStop(0.5, "rgba(0,255,0,0.04)");
    fringe.addColorStop(1, "rgba(0,0,255,0.00)");
    ctx.fillStyle = fringe;
    ctx.fillRect(0, 0, 18, H);
    ctx.restore();
  }

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;

    if (currentScene) {
      currentScene.update(dt);
      currentScene.render();
    }

    drawVCR(dt);

    requestAnimationFrame(loop);
  }

  // Start with play screen; ensure scenes are loaded first
  goToScene("play");
  requestAnimationFrame(loop);

  // Expose for switching scenes (e.g. from scene 1: goToScene("scene2"))
  window.goToScene = goToScene;
})();
