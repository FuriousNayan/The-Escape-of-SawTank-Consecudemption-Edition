/**
 * Scene 7 - Bogs Attack / Solitary
 * Walk to the door when you're released.
 */
(function () {
  let canvas, ctx;
  let tankImage, barsImage, floorImage;
  let tankLoaded = false;
  let barsLoaded = false;
  let floorLoaded = false;
  let elapsed = 0;

  const W = 960;
  const H = 540;
  const TILE_SIZE = 48;

  const SPEED = 90;
  const ROTATE_SPEED = Math.PI * 1.2;
  const FRAME_DURATION = 0.16;

  const player = {
    x: 480,
    y: 380,
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

  const EXIT_LEFT = 400;
  const EXIT_RIGHT = 560;
  const EXIT_TOP = 440;
  const EXIT_BOTTOM = 520;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;
    player.x = 480;
    player.y = 380;
    player.angle = -Math.PI / 2;
    player.frame = 0;
    player.frameTimer = 0;
    player.isMoving = false;
    input.up = input.down = input.left = input.right = false;

    tankImage = new Image();
    tankImage.src = "images/SawTank-Sheet-export.png";
    tankImage.onload = () => (tankLoaded = true);

    barsImage = new Image();
    barsImage.src = "images/bars.png";
    barsImage.onload = () => (barsLoaded = true);

    floorImage = new Image();
    floorImage.src = "images/Dirt.png";
    floorImage.onload = () => (floorLoaded = true);

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
        { speaker: "Red", text: "Bogs and the Sisters. They had it in for Saw Tank from day one.", portrait: "bigphilly", thought: true },
        { speaker: "Captain Hadley", text: "Who did this to you? Give me their names.", portrait: "karim" },
        { speaker: "Saw-Tank", text: "I don't know.", portrait: "sawTank_face" },
        { speaker: "Red", text: "Saw Tank spent a month in the hole. When he came out, Bogs couldn't walk. Hadley made sure of that.", portrait: "bigphilly", thought: true },
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
      player.y = Math.max(180, Math.min(H - 60, player.y));
    }

    if (inExitZone()) window.goToScene("scene8");

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

    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, w, h);

    if (floorLoaded) {
      const cols = Math.ceil(w / TILE_SIZE) + 1;
      const rows = Math.ceil(h / TILE_SIZE) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.globalAlpha = 0.5;
          ctx.drawImage(floorImage, 0, 0, floorImage.width, floorImage.height, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          ctx.globalAlpha = 1;
        }
      }
    }

    if (barsLoaded) {
      const barCols = Math.ceil(w / TILE_SIZE) + 1;
      for (let x = 0; x < barCols; x++) {
        ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, x * TILE_SIZE, 0, TILE_SIZE, h);
      }
    }

    ctx.fillStyle = "rgba(60, 45, 30, 0.9)";
    ctx.fillRect(EXIT_LEFT - 20, EXIT_TOP - 30, EXIT_RIGHT - EXIT_LEFT + 40, EXIT_BOTTOM - EXIT_TOP + 50);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 3;
    ctx.strokeRect(EXIT_LEFT - 20, EXIT_TOP - 30, EXIT_RIGHT - EXIT_LEFT + 40, EXIT_BOTTOM - EXIT_TOP + 50);
    ctx.fillStyle = "#8b7355";
    ctx.font = "14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("RELEASED", (EXIT_LEFT + EXIT_RIGHT) / 2, (EXIT_TOP + EXIT_BOTTOM) / 2);

    drawPlayer();

    ctx.fillStyle = "rgba(255, 220, 200, 0.8)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Walk to the door to continue", w / 2, h - 8);
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene7 = { init, update, render };
})();
