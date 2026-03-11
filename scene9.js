/**
 * Scene 9 - Andy's Escape
 * Walk to the sewer pipe to make your escape.
 */
(function () {
  let canvas, ctx;
  let tankImage, grassImage, dirtImage, barsImage;
  let tankLoaded = false;
  let grassLoaded = false;
  let dirtLoaded = false;
  let barsLoaded = false;
  let elapsed = 0;

  const W = 960;
  const H = 540;
  const TILE_SIZE = 48;

  const SPEED = 90;
  const ROTATE_SPEED = Math.PI * 1.2;
  const FRAME_DURATION = 0.16;

  const player = {
    x: 150,
    y: 400,
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

  const EXIT_LEFT = 750;
  const EXIT_RIGHT = 900;
  const EXIT_TOP = 350;
  const EXIT_BOTTOM = 500;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;
    player.x = 150;
    player.y = 400;
    player.angle = -Math.PI / 2;
    player.frame = 0;
    player.frameTimer = 0;
    player.isMoving = false;
    input.up = input.down = input.left = input.right = false;

    tankImage = new Image();
    tankImage.src = "images/SawTank-Sheet-export.png";
    tankImage.onload = () => (tankLoaded = true);

    grassImage = new Image();
    grassImage.src = "images/grass.png";
    grassImage.onload = () => (grassLoaded = true);

    dirtImage = new Image();
    dirtImage.src = "images/Dirt.png";
    dirtImage.onload = () => (dirtLoaded = true);

    barsImage = new Image();
    barsImage.src = "images/bars.png";
    barsImage.onload = () => (barsLoaded = true);

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
        { speaker: "Red", text: "The night Andy escaped, there was a storm. Lightning, thunder, rain. Perfect cover.", portrait: "bigphilly", thought: true },
        { speaker: "Red", text: "Six hundred yards of sewer pipe. Crawling through filth no man should have to crawl through. Andy did it.", portrait: "bigphilly", thought: true },
        { speaker: "Red", text: "When he came out the other end, he stood in the river and let the rain wash him clean. Free.", portrait: "bigphilly", thought: true },
      ];
      requestAnimationFrame(() => window.Dialogue.start(script));
    }
  }

  function inExitZone() {
    return player.x >= EXIT_LEFT && player.x <= EXIT_RIGHT &&
           player.y >= EXIT_TOP && player.y <= EXIT_BOTTOM;
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

    if (inExitZone()) window.goToScene("scene10");

    player.frameTimer += dt;
    if (player.frameTimer >= FRAME_DURATION) {
      player.frameTimer -= FRAME_DURATION;
      player.frame = (player.frame + 1) % 2;
    }
  }

  function drawPlayer() {
    if (!tankLoaded) return;
    const frameIndex = player.frame % 2;
    const frameWidth = tankImage.width / 2;
    const scale = 1.0;
    const dw = frameWidth * scale;
    const dh = tankImage.height * scale;
    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    const pivotBack = dw * 0.25;
    ctx.drawImage(tankImage, frameIndex * frameWidth, 0, frameWidth, tankImage.height, -dw / 2 + pivotBack, -dh / 2, dw, dh);
    ctx.restore();
  }

  function render() {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#1a1a2a";
    ctx.fillRect(0, 0, w, h);

    if (grassLoaded) {
      const cols = Math.ceil(w / TILE_SIZE) + 1;
      const rows = Math.ceil(h / TILE_SIZE) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.drawImage(grassImage, 0, 0, grassImage.width, grassImage.height, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    if (dirtLoaded) {
      ctx.fillStyle = "#3d2817";
      ctx.fillRect(0, h * 0.7, w, h * 0.3 + 20);
      const pathW = 200;
      const pathX = EXIT_LEFT - 50;
      const cols = Math.ceil(pathW / TILE_SIZE) + 1;
      const rows = Math.ceil((h - h * 0.7) / TILE_SIZE) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.drawImage(dirtImage, 0, 0, dirtImage.width, dirtImage.height, pathX + x * TILE_SIZE, h * 0.65 + y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    ctx.fillStyle = "#2c1810";
    ctx.fillRect(EXIT_LEFT - 30, EXIT_TOP - 50, EXIT_RIGHT - EXIT_LEFT + 60, 120);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 3;
    ctx.strokeRect(EXIT_LEFT - 30, EXIT_TOP - 50, EXIT_RIGHT - EXIT_LEFT + 60, 120);
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(EXIT_LEFT, EXIT_TOP, EXIT_RIGHT - EXIT_LEFT, 80);
    ctx.fillStyle = "#8b7355";
    ctx.font = "12px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("PIPE", (EXIT_LEFT + EXIT_RIGHT) / 2, EXIT_TOP - 25);

    drawPlayer();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Walk to the pipe to escape", w / 2, h - 8);
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene9 = { init, update, render };
})();
