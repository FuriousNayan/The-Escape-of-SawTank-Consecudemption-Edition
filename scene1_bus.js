/**
 * Bus cutscene - Bus drops SawTank off, player slowly moves up into the prison.
 */
(function () {
  let canvas, ctx;
  let tankImage, barsImage, grassImage, dirtImage;
  let tankLoaded = false;
  let barsLoaded = false;
  let grassLoaded = false;
  let dirtLoaded = false;
  let elapsed = 0;

  const W = 960;
  const H = 540;

  // Cutscene phases
  const PHASE_BUS_ARRIVE = 0;
  const PHASE_DROP_OFF = 1;
  const PHASE_BUS_LEAVE = 2;
  const PHASE_WALK_IN = 3;

  let phase = PHASE_BUS_ARRIVE;
  let busX = W + 120;
  const BUS_STOP_X = W * 0.55;
  const BUS_ARRIVE_DURATION = 2.5;
  const DROP_OFF_DURATION = 1.2;
  const BUS_LEAVE_SPEED = 180;

  const tank = {
    x: 0,
    y: H + 60,
    angle: -Math.PI / 2,
    frame: 0,
    frameTimer: 0,
  };
  const TANK_ENTRY_Y = H * 0.72;
  const TANK_ENTRY_SPEED = 35;
  const TANK_ARRIVAL_Y = H * 0.32;
  let inputUp = false;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;
    phase = PHASE_BUS_ARRIVE;
    busX = W + 120;
    tank.x = 0;
    tank.y = H + 60;
    tank.frame = 0;
    tank.frameTimer = 0;
    inputUp = false;

    tankImage = new Image();
    tankImage.src = "images/SawTank-Sheet-export.png";
    tankImage.onload = () => (tankLoaded = true);

    barsImage = new Image();
    barsImage.src = "images/bars.png";
    barsImage.onload = () => (barsLoaded = true);

    grassImage = new Image();
    grassImage.src = "images/grass.png";
    grassImage.onload = () => (grassLoaded = true);

    dirtImage = new Image();
    dirtImage.src = "images/Dirt.png";
    dirtImage.onload = () => (dirtLoaded = true);

    const keyHandler = (e, down) => {
      if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
        inputUp = down;
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", (e) => keyHandler(e, true));
    window.addEventListener("keyup", (e) => keyHandler(e, false));
  }

  function update(dt) {
    elapsed += dt;

    if (phase === PHASE_BUS_ARRIVE) {
      const t = Math.min(elapsed / BUS_ARRIVE_DURATION, 1);
      const ease = 1 - (1 - t) * (1 - t);
      busX = W + 120 + (BUS_STOP_X - (W + 120)) * ease;
      if (t >= 1) {
        phase = PHASE_DROP_OFF;
        elapsed = 0;
      }
    } else if (phase === PHASE_DROP_OFF) {
      if (elapsed >= DROP_OFF_DURATION) {
        phase = PHASE_BUS_LEAVE;
        elapsed = 0;
        tank.x = BUS_STOP_X - 55;
        tank.y = TANK_ENTRY_Y;
      }
    } else if (phase === PHASE_BUS_LEAVE) {
      busX -= BUS_LEAVE_SPEED * dt;
      if (busX < -100) {
        phase = PHASE_WALK_IN;
        elapsed = 0;
      }
      tank.frameTimer += dt;
      if (tank.frameTimer >= 0.16) {
        tank.frameTimer -= 0.16;
        tank.frame = (tank.frame + 1) % 2;
      }
    } else if (phase === PHASE_WALK_IN) {
      if (inputUp && tank.y > TANK_ARRIVAL_Y) {
        tank.y -= TANK_ENTRY_SPEED * dt;
      }
      if (tank.y <= TANK_ARRIVAL_Y && window.goToScene) {
        window.goToScene("scene2");
      }
      tank.frameTimer += dt;
      if (tank.frameTimer >= 0.16) {
        tank.frameTimer -= 0.16;
        tank.frame = (tank.frame + 1) % 2;
      }
    }
  }

  function drawBus(x, y) {
    const bw = 140;
    const bh = 70;
    const wx = x - bw / 2;
    const wy = y - bh / 2;

    ctx.save();

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(wx, wy, bw, bh);
    ctx.strokeStyle = "#cccccc";
    ctx.lineWidth = 2;
    ctx.strokeRect(wx, wy, bw, bh);

    ctx.fillStyle = "#f5f5f5";
    ctx.fillRect(wx, wy - 12, bw, 12);
    ctx.strokeRect(wx, wy - 12, bw, 12);

    for (let i = 0; i < 4; i++) {
      const gx = wx + 18 + i * 32;
      ctx.fillStyle = "#87ceeb";
      ctx.fillRect(gx, wy + 12, 22, 28);
      ctx.strokeStyle = "#2a3d32";
      ctx.strokeRect(gx, wy + 12, 22, 28);
    }

    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(wx + 25, wy + bh - 8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.arc(wx + bw - 25, wy + bh - 8, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function drawPrisonGate() {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, DIRT_START_Y);
    ctx.clip();

    const gateY = H * 0.18;
    const gateH = H * 0.35;
    const openingW = 140;
    const openingH = 90;
    const openingX = W / 2 - openingW / 2;
    const openingY = gateY + gateH - openingH;

    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, W, gateY + gateH);

    if (barsLoaded) {
      const tileSize = 48;
      const cols = Math.ceil(W / tileSize) + 1;
      const rows = Math.ceil(gateH / tileSize) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const tx = x * tileSize;
          const ty = gateY + y * tileSize;
          if (tx + tileSize < openingX || tx > openingX + openingW ||
              ty + tileSize < openingY || ty > openingY + openingH) {
            ctx.drawImage(
              barsImage,
              0, 0, barsImage.width, barsImage.height,
              tx, ty, tileSize, tileSize
            );
          }
        }
      }
    } else {
      ctx.fillStyle = "#0d1a14";
      ctx.fillRect(0, gateY, W, gateH);
      ctx.fillStyle = "#2a3d32";
      const barW = 6;
      const barGap = 10;
      for (let bx = 0; bx < W; bx += barW + barGap) {
        if (bx + barW < openingX || bx > openingX + openingW) {
          ctx.fillRect(bx, gateY, barW, gateH);
        } else {
          ctx.fillRect(bx, gateY, barW, openingY - gateY);
          ctx.fillRect(bx, openingY + openingH, barW, gateY + gateH - (openingY + openingH));
        }
      }
    }

    ctx.fillStyle = "#3d2817";
    ctx.fillRect(0, gateY - 4, W, 6);
    ctx.fillRect(0, gateY + gateH - 2, W, 6);

    ctx.fillStyle = "#2a3d32";
    ctx.fillRect(openingX - 8, openingY, 8, openingH);
    ctx.fillRect(openingX + openingW, openingY, 8, openingH);
    ctx.fillRect(openingX - 8, openingY - 4, openingW + 16, 6);
    ctx.fillStyle = "#3d2817";
    ctx.fillRect(openingX - 10, openingY - 6, openingW + 20, 8);

    ctx.restore();
  }

  function drawRoad() {
    const roadY = H * 0.75;
    const roadH = H - roadY + 20;

    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(0, roadY, W, roadH);
    ctx.fillStyle = "#666";
    ctx.fillRect(0, roadY + roadH / 2 - 2, W, 4);
  }

  function drawTankAt(x, y) {
    if (!tankLoaded) return;

    const frameCount = 2;
    const frameIndex = tank.frame % frameCount;
    const frameWidth = tankImage.width / frameCount;
    const frameHeight = tankImage.height;
    const dw = frameWidth;
    const dh = frameHeight;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(tank.angle);
    const pivotBack = dw * 0.25;
    ctx.drawImage(
      tankImage,
      frameIndex * frameWidth, 0, frameWidth, frameHeight,
      -dw / 2 + pivotBack, -dh / 2, dw, dh
    );
    ctx.restore();
  }

  function drawTank() {
    drawTankAt(tank.x, tank.y);
  }

  const DIRT_START_Y = H * 0.48;

  function drawOutside() {
    const tileSize = 48;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, DIRT_START_Y);
    ctx.clip();
    if (barsLoaded) {
      const cols = Math.ceil(W / tileSize) + 1;
      const barRows = Math.ceil(DIRT_START_Y / tileSize);
      for (let y = 0; y < barRows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.drawImage(
            barsImage,
            0, 0, barsImage.width, barsImage.height,
            x * tileSize, y * tileSize, tileSize, tileSize
          );
        }
      }
    } else {
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, W, DIRT_START_Y);
    }
    ctx.restore();
    if (grassLoaded) {
      const cols = Math.ceil(W / tileSize) + 1;
      const rows = Math.ceil((H - DIRT_START_Y) / tileSize) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.drawImage(
            grassImage,
            0, 0, grassImage.width, grassImage.height,
            x * tileSize, DIRT_START_Y + y * tileSize,
            tileSize, tileSize
          );
        }
      }
    } else {
      ctx.fillStyle = "#2d4a2d";
      ctx.fillRect(0, DIRT_START_Y, W, H - DIRT_START_Y);
    }
  }

  function drawDirtPath() {
    const pathW = 140;
    const pathX = W / 2 - pathW / 2 - 48 + 24;
    const pathY = DIRT_START_Y;
    const pathH = H - DIRT_START_Y;
    const tileSize = 48;

    if (dirtLoaded) {
      const cols = Math.ceil(pathW / tileSize) + 1;
      const rows = Math.ceil(pathH / tileSize) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const tx = pathX + x * tileSize;
          const ty = pathY + y * tileSize;
          ctx.drawImage(
            dirtImage,
            0, 0, dirtImage.width, dirtImage.height,
            tx, ty, tileSize, tileSize
          );
        }
      }
    } else {
      ctx.fillStyle = "#5c4033";
      ctx.fillRect(pathX, pathY, pathW, pathH);
    }
  }

  function render() {
    if (!ctx || !canvas) return;

    drawOutside();
    drawDirtPath();
    drawRoad();

    if (phase === PHASE_DROP_OFF && elapsed > 0.3) {
      const alpha = Math.min((elapsed - 0.3) / 0.4, 1);
      ctx.globalAlpha = alpha;
      drawTankAt(BUS_STOP_X - 55, TANK_ENTRY_Y);
      ctx.globalAlpha = 1;
    } else if (phase === PHASE_BUS_LEAVE) {
      drawTank();
    } else if (phase === PHASE_WALK_IN) {
      drawTank();
    }

    drawPrisonGate();

    if (phase === PHASE_BUS_ARRIVE || phase === PHASE_DROP_OFF || phase === PHASE_BUS_LEAVE) {
      drawBus(busX, H * 0.72);
    }

    if (phase === PHASE_WALK_IN) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.85)";
      ctx.font = "14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("Hold UP to enter the prison", W / 2, H - 24);
    }
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene1_bus = { init, update, render };
})();
