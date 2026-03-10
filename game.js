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

  function loop(timestamp) {
    if (!lastTime) lastTime = timestamp;
    const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // cap dt to avoid big jumps
    lastTime = timestamp;

    if (currentScene) {
      currentScene.update(dt);
      currentScene.render();
    }

    requestAnimationFrame(loop);
  }

  // Start with play screen; ensure scenes are loaded first
  goToScene("play");
  requestAnimationFrame(loop);

  // Expose for switching scenes (e.g. from scene 1: goToScene("scene2"))
  window.goToScene = goToScene;
})();
