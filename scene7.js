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

  const input = { up: false, down: false, left: false, right: false, interact: false };
  const KEY_MAP = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
    W: "up", S: "down", A: "left", D: "right",
  };

  const TALLY_SPOTS = [
    { x: 200, y: 250, holdTime: 0.8, progress: 0, done: false },
    { x: 350, y: 250, holdTime: 0.9, progress: 0, done: false },
    { x: 500, y: 250, holdTime: 1.0, progress: 0, done: false },
    { x: 650, y: 250, holdTime: 1.1, progress: 0, done: false },
  ];
  let activeSpotIndex = -1;
  let chippingPct = 0;

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
    input.up = input.down = input.left = input.right = input.interact = false;
    for (const spot of TALLY_SPOTS) { spot.progress = 0; spot.done = false; }
    activeSpotIndex = -1;
    chippingPct = 0;

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
        { speaker: "The Big Collins", text: "Bogs and the Sisters. They had it in for Saw Tank from day one.", portrait: "bigphilly", thought: true },
        { speaker: "Captain Karimie", text: "Who did this to you? Give me their names.", portrait: "karim" },
        { speaker: "Saw-Tank", text: "I don't know.", portrait: "sawTank_face" },
        { speaker: "The Big Collins", text: "Saw Tank spent a month in the hole. When he came out, Bogs couldn't walk. Captain Karimie made sure of that.", portrait: "bigphilly", thought: true },
      ];
      requestAnimationFrame(() => window.Dialogue.start(script));
    }
  }

  function allTalliesDone() {
    return TALLY_SPOTS.every(s => s.done);
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

    activeSpotIndex = -1;
    chippingPct = 0;
    for (let i = 0; i < TALLY_SPOTS.length; i++) {
      const spot = TALLY_SPOTS[i];
      if (spot.done) continue;
      const dx = player.x - spot.x;
      const dy = player.y - spot.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 55 && input.interact) {
        spot.progress = Math.min(spot.progress + dt, spot.holdTime);
        if (spot.progress >= spot.holdTime) spot.done = true;
        activeSpotIndex = i;
        chippingPct = Math.min(spot.progress / spot.holdTime, 1);
      } else if (!spot.done) {
        spot.progress = Math.max(0, spot.progress - dt * 0.6);
      }
    }

    if (allTalliesDone() && inExitZone()) window.goToScene("scene8");

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

  function drawTallySpots() {
    for (let i = 0; i < TALLY_SPOTS.length; i++) {
      const spot = TALLY_SPOTS[i];
      const sx = spot.x;
      const sy = spot.y;

      if (spot.done) {
        ctx.strokeStyle = "#d4c8a0";
        ctx.lineWidth = 2.5;
        ctx.lineCap = "round";
        const gap = 6;
        const halfH = 14;
        const startX = sx - gap * 2;
        for (let j = 0; j < 4; j++) {
          const lx = startX + j * gap;
          ctx.beginPath();
          ctx.moveTo(lx, sy - halfH);
          ctx.lineTo(lx, sy + halfH);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.moveTo(startX - 3, sy + halfH + 2);
        ctx.lineTo(startX + 3 * gap + 3, sy - halfH - 2);
        ctx.stroke();
      } else {
        const pulse = 0.35 + 0.25 * Math.sin(elapsed * 3 + i * 1.5);
        ctx.strokeStyle = `rgba(200,180,140,${pulse})`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(sx - 18, sy - 18, 36, 36);
        ctx.setLineDash([]);

        if (spot.progress > 0) {
          const pct = spot.progress / spot.holdTime;
          const barW = 36;
          const barH = 5;
          const bx = sx - barW / 2;
          const by = sy + 22;
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(bx, by, barW, barH);
          ctx.fillStyle = "#e6c44d";
          ctx.fillRect(bx, by, barW * pct, barH);
        }
      }
    }
  }

  function drawHUD() {
    const done = TALLY_SPOTS.filter(s => s.done).length;
    ctx.save();

    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, 0, W, 32);

    ctx.font = "bold 15px system-ui, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (allTalliesDone()) {
      ctx.fillStyle = "#a8e6a3";
      ctx.fillText("Time served. Walk to the door.", W / 2, 16);
    } else if (activeSpotIndex >= 0) {
      ctx.fillStyle = "#f0d060";
      ctx.fillText("Chipping... " + Math.floor(chippingPct * 100) + "%", W / 2, 16);
    } else {
      ctx.fillStyle = "#ddd";
      ctx.fillText("Mark the days: " + done + "/4 tallies", W / 2, 16);
    }

    if (activeSpotIndex >= 0) {
      const barW = 50;
      const barH = 6;
      const bx = player.x - barW / 2;
      const by = player.y - 35;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
      ctx.fillStyle = "#e6c44d";
      ctx.fillRect(bx, by, barW * chippingPct, barH);
    }

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

    drawTallySpots();
    drawPlayer();

    ctx.fillStyle = "rgba(255, 220, 200, 0.8)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    if (!allTalliesDone()) {
      ctx.fillText("Hold E near each scratch mark to chip a tally", w / 2, h - 8);
    } else {
      ctx.fillText("Walk to the door to continue", w / 2, h - 8);
    }

    drawHUD();
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene7 = { init, update, render };
})();
