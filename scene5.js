/**
 * Scene 5 - Rooftop (Tar / Beer Scene)
 * Walk to the ladder to head back down after the beers.
 */
(function () {
  let canvas, ctx;
  let tankImage, floorImage, barsImage, bigPhillyImage, heywoodImage, floydImage;
  let tankLoaded = false;
  let floorLoaded = false;
  let barsLoaded = false;
  let bigPhillyLoaded = false;
  let heywoodLoaded = false;
  let floydLoaded = false;
  let elapsed = 0;

  const W = 960;
  const H = 540;
  const TILE_SIZE = 48;

  const SPEED = 90;
  const ROTATE_SPEED = Math.PI * 1.2;
  const FRAME_DURATION = 0.16;

  const player = {
    x: 200,
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

  const TAR_RADIUS = 28;
  const TAR_PROXIMITY = 55;
  const tarSpots = [
    { x: 300, y: 380, holdTime: 1.2, progress: 0, done: false },
    { x: 500, y: 340, holdTime: 1.0, progress: 0, done: false },
    { x: 650, y: 400, holdTime: 1.5, progress: 0, done: false },
  ];
  let activeTarIndex = -1;

  const EXIT_LEFT = 780;
  const EXIT_RIGHT = 920;
  const EXIT_TOP = 380;
  const EXIT_BOTTOM = 520;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;
    player.x = 200;
    player.y = 400;
    player.angle = -Math.PI / 2;
    player.frame = 0;
    player.frameTimer = 0;
    player.isMoving = false;
    input.up = input.down = input.left = input.right = input.interact = false;
    tarSpots.forEach(s => { s.progress = 0; s.done = false; });
    activeTarIndex = -1;

    tankImage = new Image();
    tankImage.src = "images/SawTank-Sheet-export.png";
    tankImage.onload = () => (tankLoaded = true);

    floorImage = new Image();
    floorImage.src = "images/Dirt.png";
    floorImage.onload = () => (floorLoaded = true);

    barsImage = new Image();
    barsImage.src = "images/bars.png";
    barsImage.onload = () => (barsLoaded = true);

    bigPhillyImage = new Image();
    bigPhillyImage.src = "images/bigphilly.png";
    bigPhillyImage.onload = () => (bigPhillyLoaded = true);

    heywoodImage = new Image();
    heywoodImage.src = "images/heywood.png";
    heywoodImage.onload = () => (heywoodLoaded = true);

    floydImage = new Image();
    floydImage.src = "images/Mr-Gardner.png";
    floydImage.onload = () => (floydLoaded = true);

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
        { speaker: "Captain Karimie", text: "You believe that sorry guy? Inheritance. Uncle Sam wants his cut. I swear, the government will take half.", portrait: "karim" },
        { speaker: "Saw-Tank", text: "I could set up a one-time transfer for you. Keep most of it. Would cost you a crate of beer for the work crew.", portrait: "sawTank_face" },
        { speaker: "Captain Karimie", text: "Beer? You want beer?", portrait: "karim" },
        { speaker: "Saw-Tank", text: "Three apiece. For my coworkers. It'd only be fair.", portrait: "sawTank_face" },
        { speaker: "The Big Collins", text: "And that's how it came to pass. We sat and drank with the sun on our shoulders and felt like free men.", portrait: "bigphilly", thought: true },
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
      player.y = Math.max(280, Math.min(H - 60, player.y));
    }

    activeTarIndex = -1;
    for (let i = 0; i < tarSpots.length; i++) {
      const s = tarSpots[i];
      if (s.done) continue;
      const dx = player.x - s.x;
      const dy = player.y - s.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < TAR_PROXIMITY && input.interact) {
        s.progress = Math.min(s.progress + dt, s.holdTime);
        activeTarIndex = i;
        if (s.progress >= s.holdTime) s.done = true;
      } else {
        s.progress = Math.max(0, s.progress - dt * 0.5);
      }
    }

    const allTarred = tarSpots.every(s => s.done);
    if (allTarred && inExitZone()) window.goToScene("scene6");

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

    ctx.fillStyle = "#1a1510";
    ctx.fillRect(0, 0, w, h);

    if (floorLoaded) {
      ctx.globalAlpha = 0.85;
      const cols = Math.ceil(w / TILE_SIZE) + 1;
      const rows = Math.ceil(h / TILE_SIZE) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.drawImage(floorImage, 0, 0, floorImage.width, floorImage.height, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = "#3d2817";
    ctx.fillRect(0, 0, w, 2);
    ctx.fillRect(0, h - 2, w, 2);

    if (barsLoaded) {
      const barH = 56;
      for (let x = 0; x < Math.ceil(w / TILE_SIZE) + 1; x++) {
        ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, x * TILE_SIZE, 0, TILE_SIZE, barH);
      }
      for (let x = 0; x < Math.ceil(w / TILE_SIZE) + 1; x++) {
        ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, x * TILE_SIZE, h - barH, TILE_SIZE, barH);
      }
      for (let y = 0; y < Math.ceil(h / TILE_SIZE) + 1; y++) {
        ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, 0, y * TILE_SIZE, barH, TILE_SIZE);
      }
      for (let y = 0; y < Math.ceil(h / TILE_SIZE) + 1; y++) {
        ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, w - barH, y * TILE_SIZE, barH, TILE_SIZE);
      }
    }

    ctx.fillStyle = "#2c1810";
    ctx.fillRect(0, h - 85, 90, 85);
    ctx.fillRect(w - 90, 0, 90, 75);
    ctx.fillRect(w - 95, h - 80, 95, 80);

    for (let i = 0; i < 5; i++) {
      const x = 200 + i * 160;
      ctx.fillStyle = "#4a4a4a";
      ctx.fillRect(x, h * 0.4, 50, 75);
      ctx.fillStyle = "#2a2a2a";
      ctx.fillRect(x + 4, h * 0.42, 20, 28);
      ctx.fillStyle = "#5c4033";
      ctx.fillRect(x + 12, h * 0.52, 12, 20);
    }

    ctx.fillStyle = "#3d2817";
    ctx.fillRect(40, 80, 200, 100);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 80, 200, 100);
    ctx.fillStyle = "#4a4a4a";
    ctx.fillRect(55, 95, 25, 35);
    ctx.fillRect(95, 95, 25, 35);
    ctx.fillRect(135, 95, 25, 35);

    if (bigPhillyLoaded) {
      const scale = Math.min(65 / bigPhillyImage.width, 65 / bigPhillyImage.height);
      const dw = bigPhillyImage.width * scale;
      const dh = bigPhillyImage.height * scale;
      ctx.drawImage(bigPhillyImage, 0, 0, bigPhillyImage.width, bigPhillyImage.height, 70 - dw / 2, 130 - dh / 2, dw, dh);
    }
    if (heywoodLoaded) {
      const scale = Math.min(55 / heywoodImage.width, 55 / heywoodImage.height);
      const dw = heywoodImage.width * scale;
      const dh = heywoodImage.height * scale;
      ctx.drawImage(heywoodImage, 0, 0, heywoodImage.width, heywoodImage.height, 130 - dw / 2, 125 - dh / 2, dw, dh);
    }
    if (floydLoaded) {
      const scale = Math.min(55 / floydImage.width, 55 / floydImage.height);
      const dw = floydImage.width * scale;
      const dh = floydImage.height * scale;
      ctx.drawImage(floydImage, 0, 0, floydImage.width, floydImage.height, 190 - dw / 2, 128 - dh / 2, dw, dh);
    }

    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = "10px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("The Big Collins", 70, 165);
    ctx.fillText("Mr Boohbah", 130, 160);
    ctx.fillText("P. Master", 190, 163);

    ctx.fillStyle = "rgba(60, 45, 30, 0.95)";
    ctx.fillRect(EXIT_LEFT - 20, EXIT_TOP - 20, EXIT_RIGHT - EXIT_LEFT + 40, EXIT_BOTTOM - EXIT_TOP + 40);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 3;
    ctx.strokeRect(EXIT_LEFT - 20, EXIT_TOP - 20, EXIT_RIGHT - EXIT_LEFT + 40, EXIT_BOTTOM - EXIT_TOP + 40);
    ctx.fillStyle = "#8b7355";
    ctx.font = "14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("LADDER", (EXIT_LEFT + EXIT_RIGHT) / 2, (EXIT_TOP + EXIT_BOTTOM) / 2 - 5);
    ctx.font = "11px Georgia";
    ctx.fillText("DOWN", (EXIT_LEFT + EXIT_RIGHT) / 2, (EXIT_TOP + EXIT_BOTTOM) / 2 + 12);

    drawTarSpots();
    drawPlayer();
    drawHUD();
  }

  function drawTarSpots() {
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 4);
    for (let i = 0; i < tarSpots.length; i++) {
      const s = tarSpots[i];
      ctx.save();
      if (s.done) {
        ctx.beginPath();
        ctx.arc(s.x, s.y, TAR_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "#1a1a1a";
        ctx.fill();
        ctx.strokeStyle = "#444";
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = "#4caf50";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(s.x - 10, s.y);
        ctx.lineTo(s.x - 2, s.y + 9);
        ctx.lineTo(s.x + 12, s.y - 8);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(s.x, s.y, TAR_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(30, 20, 10, 0.5)";
        ctx.fill();
        const orangeAlpha = 0.4 + 0.6 * pulse;
        ctx.strokeStyle = `rgba(255, 160, 40, ${orangeAlpha})`;
        ctx.lineWidth = 3;
        ctx.stroke();

        if (s.progress > 0) {
          const pct = s.progress / s.holdTime;
          const barW = TAR_RADIUS * 1.6;
          const barH = 6;
          const bx = s.x - barW / 2;
          const by = s.y - barH / 2;
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
          ctx.fillStyle = "#ff9800";
          ctx.fillRect(bx, by, barW * pct, barH);
        }
      }
      ctx.restore();
    }
  }

  function drawHUD() {
    const doneCount = tarSpots.filter(s => s.done).length;
    const allTarred = doneCount === tarSpots.length;

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
    ctx.fillRect(0, 0, canvas.width, 34);

    ctx.font = "bold 15px system-ui";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    if (allTarred) {
      ctx.fillStyle = "#8bc34a";
      ctx.fillText("Job's done! Walk to the ladder.", canvas.width / 2, 17);
    } else {
      ctx.fillStyle = "#ffc107";
      ctx.fillText(`Tar the roof: ${doneCount}/3 spots done`, canvas.width / 2, 17);
    }

    if (activeTarIndex >= 0) {
      const s = tarSpots[activeTarIndex];
      const pct = Math.min(1, s.progress / s.holdTime);
      const pctText = Math.floor(pct * 100);

      ctx.font = "13px system-ui";
      ctx.fillStyle = "#ffcc80";
      ctx.textAlign = "center";
      ctx.fillText(`Tarring... ${pctText}%`, canvas.width / 2, 50);

      const barW = 50;
      const barH = 6;
      const bx = player.x - barW / 2;
      const by = player.y - 38;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(bx - 1, by - 1, barW + 2, barH + 2);
      ctx.fillStyle = "#ff9800";
      ctx.fillRect(bx, by, barW * pct, barH);
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - 1, by - 1, barW + 2, barH + 2);
    }

    if (!allTarred) {
      for (const s of tarSpots) {
        if (s.done) continue;
        const dx = player.x - s.x;
        const dy = player.y - s.y;
        if (Math.sqrt(dx * dx + dy * dy) < TAR_PROXIMITY && !input.interact) {
          ctx.font = "12px system-ui";
          ctx.fillStyle = "rgba(255,255,255,0.75)";
          ctx.textAlign = "center";
          ctx.fillText("[E] Hold to tar", s.x, s.y + TAR_RADIUS + 16);
          break;
        }
      }
    }
    ctx.restore();
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene5 = { init, update, render };
})();
