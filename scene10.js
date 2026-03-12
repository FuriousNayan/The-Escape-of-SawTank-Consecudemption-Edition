/**
 * Scene 10 - Red's Ending (Beach Reunion)
 * Walk to Andy on the beach to complete the story.
 */
(function () {
  let canvas, ctx;
  let bigPhillyImage, tankImage, grassImage;
  let bigPhillyLoaded = false;
  let tankLoaded = false;
  let grassLoaded = false;
  let elapsed = 0;
  let plotTwistTriggered = false;

  const W = 960;
  const H = 540;
  const TILE_SIZE = 48;

  const SPEED = 90;
  const ROTATE_SPEED = Math.PI * 1.2;
  const FRAME_DURATION = 0.16;

  const player = {
    x: 150,
    y: 420,
    angle: -Math.PI / 2,
    frame: 0,
    frameTimer: 0,
    isMoving: false,
  };

  const input = { up: false, down: false, left: false, right: false };
  const KEY_MAP = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
    W: "up", S: "down", A: "left", D: "right",
  };

  const ANDY_ZONE_LEFT = 500;
  const ANDY_ZONE_RIGHT = 900;
  const ANDY_ZONE_TOP = 280;
  const ANDY_ZONE_BOTTOM = 500;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;
    plotTwistTriggered = false;
    player.x = 150;
    player.y = 420;
    player.angle = -Math.PI / 2;
    player.frame = 0;
    player.frameTimer = 0;
    player.isMoving = false;
    input.up = input.down = input.left = input.right = false;

    bigPhillyImage = new Image();
    bigPhillyImage.src = "images/bigphilly.png";
    bigPhillyImage.onload = () => (bigPhillyLoaded = true);

    tankImage = new Image();
    tankImage.src = "images/SawTank-Sheet-export.png";
    tankImage.onload = () => (tankLoaded = true);

    grassImage = new Image();
    grassImage.src = "images/grass.png";
    grassImage.onload = () => (grassLoaded = true);

    const keyHandler = (e, down) => {
      const action = KEY_MAP[e.key];
      if (!action) return;
      input[action] = down;
      e.preventDefault();
    };
    window.addEventListener("keydown", (e) => keyHandler(e, true));
    window.addEventListener("keyup", (e) => keyHandler(e, false));

    if (window.Dialogue) {
      const script = [
        { speaker: "Red", text: "I found it. Buried under a black volcanic rock. A letter. And money.", portrait: "bigphilly", thought: true },
        { speaker: "Andy", text: "If you've made it this far, you're willing to come a little further. Get busy living or get busy dying. I'll be waiting.", portrait: "sawTank_face" },
        { speaker: "Red", text: "I hope. I hope to see my friend and shake his hand. I hope the Pacific is as blue as it has been in my dreams. I hope.", portrait: "bigphilly", thought: true },
      ];
      requestAnimationFrame(() => window.Dialogue.start(script));
    }
  }

  function inAndyZone() {
    return player.x >= ANDY_ZONE_LEFT && player.x <= ANDY_ZONE_RIGHT &&
           player.y >= ANDY_ZONE_TOP && player.y <= ANDY_ZONE_BOTTOM;
  }

  function update(dt) {
    elapsed += dt;
    if (!window.goToScene) return;
    if (window.Dialogue?.visible?.()) return;

    let moveForward = 0;
    let rotateDir = 0;
    if (input.up) moveForward += 1;
    if (input.down) moveForward -= 1;
    if (input.left) rotateDir -= 1;
    if (input.right) rotateDir += 1;

    player.isMoving = moveForward !== 0;
    if (rotateDir !== 0) player.angle += rotateDir * ROTATE_SPEED * dt;
    if (player.isMoving) {
      const dist = SPEED * dt * Math.sign(moveForward);
      player.x += Math.cos(player.angle) * dist;
      player.y += Math.sin(player.angle) * dist;
      player.x = Math.max(80, Math.min(W - 80, player.x));
      player.y = Math.max(200, Math.min(H - 60, player.y));
    }

    if (inAndyZone() && !plotTwistTriggered) {
      plotTwistTriggered = true;
      if (window.Dialogue && window.goToScene) {
        const arrestScript = [
          { speaker: "Saw-Tank", text: "Red. I need to tell you something. I'm not who you think I am.", portrait: "sawTank_face" },
          { speaker: "Saw-Tank", text: "I've been undercover this whole time. Shawshank, the escape, this beach — all of it. I'm a cop.", portrait: "sawTank_face" },
          { speaker: "Red", text: "What? No...", portrait: "bigphilly" },
          { speaker: "Saw-Tank", text: "You're under arrest. You have the right to remain silent. Anything you say can and will be used against you.", portrait: "sawTank_face" },
          { speaker: "Red", text: "You... you set me up. All of it.", portrait: "bigphilly", thought: true },
          { speaker: "Saw-Tank", text: "Get busy living or get busy dying. You chose. I'm sorry.", portrait: "sawTank_face" },
        ];
        requestAnimationFrame(() => {
          window.Dialogue.hide();
          window.Dialogue.start(arrestScript, {
            force: true,
            onComplete: () => {
              window.Dialogue.start(
                [{ speaker: "Saw-Tank", text: "You need to start over again.", portrait: "sawTank_face" }],
                { force: true }
              );
              setTimeout(() => window.goToScene("scene1"), 1200);
            },
          });
        });
      } else if (window.goToScene) {
        window.goToScene("scene1");
      }
    }

  }

  function drawPlayer() {
    if (!bigPhillyLoaded) return;
    const maxW = TILE_SIZE * 1.2;
    const maxH = TILE_SIZE * 1.2;
    const scale = Math.min(maxW / bigPhillyImage.width, maxH / bigPhillyImage.height);
    const dw = bigPhillyImage.width * scale;
    const dh = bigPhillyImage.height * scale;
    ctx.drawImage(bigPhillyImage, 0, 0, bigPhillyImage.width, bigPhillyImage.height, player.x - dw / 2, player.y - dh / 2, dw, dh);
  }

  function render() {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#1a2a3a";
    ctx.fillRect(0, 0, w, h * 0.5);

    ctx.fillStyle = "#0d3d5c";
    ctx.fillRect(0, h * 0.45, w, h * 0.55);

    const waveY = h * 0.5 + Math.sin(elapsed * 1.2) * 6;
    ctx.fillStyle = "#0a2d45";
    ctx.fillRect(0, waveY, w, h - waveY);

    if (grassLoaded) {
      const cols = Math.ceil(w / TILE_SIZE) + 1;
      const rows = Math.ceil((h - h * 0.6) / TILE_SIZE) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.drawImage(grassImage, 0, 0, grassImage.width, grassImage.height, x * TILE_SIZE, h * 0.58 + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    } else {
      ctx.fillStyle = "#5c4033";
      ctx.fillRect(0, h * 0.6, w, h * 0.4);
    }

    ctx.fillStyle = "#3d2817";
    ctx.fillRect(0, h * 0.58, w, 8);

    if (tankLoaded) {
      const scale = 1.2;
      const frameWidth = tankImage.width / 2;
      const dw = frameWidth * scale;
      const dh = tankImage.height * scale;
      ctx.drawImage(tankImage, 0, 0, frameWidth, tankImage.height, 720 - dw / 2, 380 - dh / 2, dw, dh);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "bold 20px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("Zihuatanejo", w / 2, h * 0.35);
    ctx.font = "14px system-ui";
    ctx.fillText("I hope", w / 2, h * 0.42);

    drawPlayer();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Walk to Andy to complete the story", w / 2, h - 8);
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene10 = { init, update, render };
})();
