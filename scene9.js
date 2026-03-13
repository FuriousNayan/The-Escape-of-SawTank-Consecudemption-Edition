/**
 * Scene 9 - Andy's Escape
 * Hold E to push through 3 pipe blockages along the sewer pipe.
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

  const input = { up: false, down: false, left: false, right: false, interact: false };
  const KEY_MAP = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
    W: "up", S: "down", A: "left", D: "right",
  };

  const blockages = [
    { x: 300, y: 380, holdTime: 1.0, progress: 0, broken: false },
    { x: 500, y: 400, holdTime: 1.3, progress: 0, broken: false },
    { x: 700, y: 370, holdTime: 1.6, progress: 0, broken: false },
  ];

  let pushing = false;

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
    input.interact = false;

    blockages.forEach(function (b) { b.progress = 0; b.broken = false; });
    pushing = false;

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
      if (e.key === "e" || e.key === "E") {
        input.interact = down;
        e.preventDefault();
        return;
      }
      const action = KEY_MAP[e.key];
      if (!action) return;
      input[action] = down;
      e.preventDefault();
    };
    window.addEventListener("keydown", (e) => keyHandler(e, true));
    window.addEventListener("keyup", (e) => keyHandler(e, false));

    if (window.Dialogue) {
      const script = [
        { speaker: "The Big Collins", text: "The night Saw Tank escaped, there was a storm. Lightning, thunder, rain. Perfect cover.", portrait: "bigphilly", thought: true },
        { speaker: "The Big Collins", text: "Six hundred yards of sewer pipe. Crawling through filth no man should have to crawl through. Saw Tank did it.", portrait: "bigphilly", thought: true },
        { speaker: "The Big Collins", text: "When he came out the other end, he stood in the river and let the rain wash him clean. Free.", portrait: "bigphilly", thought: true },
      ];
      requestAnimationFrame(() => window.Dialogue.start(script));
    }
  }

  function inExitZone() {
    return player.x >= EXIT_LEFT && player.x <= EXIT_RIGHT &&
           player.y >= EXIT_TOP && player.y <= EXIT_BOTTOM;
  }

  function allBlockagesBroken() {
    return blockages.every(function (b) { return b.broken; });
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

    pushing = false;
    for (const b of blockages) {
      if (b.broken) continue;
      const dx = player.x - b.x;
      const dy = player.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 60 && input.interact) {
        b.progress += dt;
        pushing = true;
        if (b.progress >= b.holdTime) {
          b.broken = true;
          b.progress = b.holdTime;
        }
      } else if (!b.broken) {
        b.progress = Math.max(0, b.progress - dt * 0.5);
      }
    }

    if (allBlockagesBroken() && inExitZone()) window.goToScene("scene9b");

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

  function drawBlockages() {
    for (const b of blockages) {
      ctx.save();
      if (b.broken) {
        ctx.fillStyle = "#1a1a1a";
        ctx.fillRect(b.x - 20, b.y - 16, 40, 32);
        ctx.strokeStyle = "#5c4033";
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x - 20, b.y - 16, 40, 32);
        ctx.fillStyle = "rgba(100, 200, 100, 0.5)";
        ctx.font = "10px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("OPEN", b.x, b.y + 4);
      } else {
        const pulse = 0.5 + 0.5 * Math.sin(elapsed * 5);
        ctx.fillStyle = "#2a1a0a";
        ctx.fillRect(b.x - 20, b.y - 16, 40, 32);
        ctx.strokeStyle = "rgba(255, 140, 0, " + (0.5 + pulse * 0.5) + ")";
        ctx.lineWidth = 2 + pulse;
        ctx.strokeRect(b.x - 20, b.y - 16, 40, 32);

        const barW = 40;
        const barH = 5;
        const barX = b.x - barW / 2;
        const barY = b.y + 20;
        const pct = b.progress / b.holdTime;
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = pct > 0.7 ? "#66ff66" : "#ff8c00";
        ctx.fillRect(barX, barY, barW * pct, barH);
        ctx.strokeStyle = "#666";
        ctx.lineWidth = 1;
        ctx.strokeRect(barX, barY, barW, barH);
      }
      ctx.restore();
    }
  }

  function drawHUD() {
    const broken = blockages.filter(function (b) { return b.broken; }).length;
    const all = allBlockagesBroken();

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(W / 2 - 180, 6, 360, 30);
    ctx.fillStyle = all ? "#66ff66" : "#ff8c00";
    ctx.font = "bold 15px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      all ? "Pipe is clear! Crawl to freedom." : "Clear the pipe: " + broken + "/3 blockages",
      W / 2, 26
    );
    ctx.restore();

    if (!all) {
      for (const b of blockages) {
        if (b.broken) continue;
        const dx = player.x - b.x;
        const dy = player.y - b.y;
        if (Math.sqrt(dx * dx + dy * dy) < 60) {
          if (pushing) {
            const barW = 60;
            const barH = 8;
            const barX = player.x - barW / 2;
            const barY = player.y - 48;
            const pct = b.progress / b.holdTime;
            ctx.save();
            ctx.fillStyle = "rgba(0,0,0,0.65)";
            ctx.fillRect(barX - 2, barY - 2, barW + 4, barH + 4);
            ctx.fillStyle = pct > 0.7 ? "#66ff66" : "#ff8c00";
            ctx.fillRect(barX, barY, barW * pct, barH);
            ctx.strokeStyle = "#aaa";
            ctx.lineWidth = 1;
            ctx.strokeRect(barX, barY, barW, barH);
            ctx.restore();
          } else {
            ctx.save();
            ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
            ctx.fillRect(player.x - 90, player.y - 50, 180, 24);
            ctx.fillStyle = "#ffffff";
            ctx.font = "13px system-ui";
            ctx.textAlign = "center";
            ctx.fillText("Hold E to push through", player.x, player.y - 33);
            ctx.restore();
          }
          break;
        }
      }
    }
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

    drawBlockages();
    drawPlayer();
    drawHUD();
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene9 = { init, update, render };
})();
