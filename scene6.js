/**
 * Scene 6 - Brooks
 * Library scene. Walk to the exit when ready to continue.
 */
(function () {
  let canvas, ctx;
  let tankImage, barsImage, floorImage, brooksImage;
  let tankLoaded = false;
  let barsLoaded = false;
  let floorLoaded = false;
  let brooksLoaded = false;
  let elapsed = 0;

  const W = 960;
  const H = 540;
  const TILE_SIZE = 48;

  const SPEED = 90;
  const ROTATE_SPEED = Math.PI * 1.2;
  const FRAME_DURATION = 0.16;

  const player = {
    x: 200,
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

  const EXIT_LEFT = 400;
  const EXIT_RIGHT = 560;
  const EXIT_TOP = 420;
  const EXIT_BOTTOM = 520;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;
    player.x = 200;
    player.y = 420;
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

    brooksImage = new Image();
    brooksImage.src = "images/brooks.png";
    brooksImage.onload = () => (brooksLoaded = true);

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
        { speaker: "Brooks", text: "I've been here fifty years. Fifty years! The world went and got itself in a big hurry.", portrait: "brooks" },
        { speaker: "Brooks", text: "The parole board got me into this halfway house. And a job bagging groceries. I can't sleep. The bed's too soft.", portrait: "brooks" },
        { speaker: "Red", text: "Brooks Hatlen was here. So was Red. He was institutionalized.", portrait: "bigphilly", thought: true },
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

    if (inExitZone()) window.goToScene("scene7");

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

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, w, h);

    if (floorLoaded) {
      const cols = Math.ceil(w / TILE_SIZE) + 1;
      const rows = Math.ceil(h / TILE_SIZE) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.drawImage(floorImage, 0, 0, floorImage.width, floorImage.height, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    if (barsLoaded) {
      const barCols = Math.ceil(w / TILE_SIZE) + 1;
      for (let x = 0; x < barCols; x++) {
        ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, x * TILE_SIZE, 0, TILE_SIZE, h * 0.35);
      }
    }

    ctx.fillStyle = "#2c1810";
    ctx.fillRect(w * 0.15, h * 0.2, w * 0.7, h * 0.45);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.15, h * 0.2, w * 0.7, h * 0.45);
    ctx.fillStyle = "#8b7355";
    ctx.font = "22px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("SHAWSHANK LIBRARY", w / 2, h * 0.38);
    ctx.font = "12px Georgia";
    ctx.fillText("Established 1912", w / 2, h * 0.44);

    if (brooksLoaded) {
      const maxW = TILE_SIZE * 1.3;
      const maxH = TILE_SIZE * 1.3;
      const scale = Math.min(maxW / brooksImage.width, maxH / brooksImage.height);
      const dw = brooksImage.width * scale;
      const dh = brooksImage.height * scale;
      const bx = w * 0.5 - dw / 2;
      const by = h * 0.52 - dh / 2;
      ctx.save();
      ctx.filter = "sepia(0.15) saturate(0.9) hue-rotate(195deg) brightness(1.08)";
      ctx.drawImage(brooksImage, 0, 0, brooksImage.width, brooksImage.height, bx, by, dw, dh);
      ctx.restore();
    }

    ctx.fillStyle = "rgba(60, 45, 30, 0.95)";
    ctx.fillRect(EXIT_LEFT - 15, EXIT_TOP - 15, EXIT_RIGHT - EXIT_LEFT + 30, EXIT_BOTTOM - EXIT_TOP + 30);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 3;
    ctx.strokeRect(EXIT_LEFT - 15, EXIT_TOP - 15, EXIT_RIGHT - EXIT_LEFT + 30, EXIT_BOTTOM - EXIT_TOP + 30);
    ctx.fillStyle = "#8b7355";
    ctx.font = "14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", (EXIT_LEFT + EXIT_RIGHT) / 2, (EXIT_TOP + EXIT_BOTTOM) / 2);

    drawPlayer();

    ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Walk to the exit to continue", w / 2, h - 8);
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene6 = { init, update, render };
})();
