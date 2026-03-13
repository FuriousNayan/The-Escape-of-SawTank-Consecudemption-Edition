/**
 * Scene 9b - The Warden Discovers
 * Walk to the exit after the warden discovers Saw Tank's escape.
 */
(function () {
  let canvas, ctx;
  let bigPhillyImage, barsImage, floorImage, wardenImage;
  let bigPhillyLoaded = false;
  let barsLoaded = false;
  let floorLoaded = false;
  let wardenLoaded = false;
  let elapsed = 0;
  let tunnelRevealed = false;

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

  const EXIT_LEFT = 820;
  const EXIT_RIGHT = 930;
  const EXIT_TOP = 350;
  const EXIT_BOTTOM = 480;

  const CELL_X = 300;
  const CELL_Y = 160;
  const CELL_W = 360;
  const CELL_H = 220;

  const POSTER_X = CELL_X + CELL_W - 80;
  const POSTER_Y = CELL_Y + 30;
  const POSTER_W = 50;
  const POSTER_H = 70;

  const TUNNEL_X = POSTER_X + POSTER_W / 2;
  const TUNNEL_Y = POSTER_Y + POSTER_H / 2;
  const TUNNEL_R = 28;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;
    tunnelRevealed = false;
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

    barsImage = new Image();
    barsImage.src = "images/bars.png";
    barsImage.onload = () => (barsLoaded = true);

    floorImage = new Image();
    floorImage.src = "images/Dirt.png";
    floorImage.onload = () => (floorLoaded = true);

    wardenImage = new Image();
    wardenImage.src = "images/waketech.png";
    wardenImage.onload = () => (wardenLoaded = true);

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
        { speaker: "Captain Karimie", text: "Sir! Cell 245 is empty! He's gone!", portrait: "karim" },
        { speaker: "The Big Tech", text: "What do you mean, gone? That's impossible.", portrait: "waketech" },
        { speaker: "The Big Tech", text: "Open this cell. Now.", portrait: "waketech" },
        { speaker: "The Big Collins", text: "When they opened his cell that morning, Saw Tank was gone. Vanished like a fart in the wind.", portrait: "bigphilly", thought: true },
        { speaker: "The Big Tech", text: "How? HOW?!", portrait: "waketech" },
        { speaker: "The Big Collins", text: "The Big Tech tore that cell apart. Behind the poster... a hole. A tunnel Saw Tank had been digging for twenty years.", portrait: "bigphilly", thought: true },
        { speaker: "The Big Tech", text: "I want him found. Every road, every highway. Find him!", portrait: "waketech" },
        { speaker: "The Big Collins", text: "The Big Tech never found him. But Saw Tank found The Big Tech. Every dirty dollar, every bribe, every secret. Saw Tank mailed it all.", portrait: "bigphilly", thought: true },
      ];
      requestAnimationFrame(() => {
        window.Dialogue.start(script, {
          onComplete: () => { tunnelRevealed = true; },
        });
      });
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

    if (tunnelRevealed && inExitZone()) window.goToScene("scene10");

    player.frameTimer += dt;
    if (player.frameTimer >= FRAME_DURATION) {
      player.frameTimer -= FRAME_DURATION;
      player.frame = (player.frame + 1) % 2;
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

  const WARDEN_X = CELL_X + CELL_W / 2 - 20;
  const WARDEN_Y = CELL_Y + CELL_H + 60;

  function isWardenSpeaking() {
    if (!window.Dialogue?.visible?.()) return false;
    const el = document.getElementById("dialogueSpeaker");
    return el && el.dataset.speaker === "the big tech";
  }

  function drawWarden() {
    if (!wardenLoaded || !isWardenSpeaking()) return;
    const maxW = TILE_SIZE * 1.8;
    const maxH = TILE_SIZE * 1.8;
    const scale = Math.min(maxW / wardenImage.width, maxH / wardenImage.height);
    const dw = wardenImage.width * scale;
    const dh = wardenImage.height * scale;

    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 4);
    ctx.save();
    ctx.shadowColor = "rgba(255, 80, 80, " + (0.3 + pulse * 0.3) + ")";
    ctx.shadowBlur = 10 + pulse * 6;
    ctx.drawImage(wardenImage, 0, 0, wardenImage.width, wardenImage.height, WARDEN_X - dw / 2, WARDEN_Y - dh / 2, dw, dh);
    ctx.restore();

    ctx.fillStyle = "#cc4444";
    ctx.font = "bold 11px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("THE BIG TECH", WARDEN_X, WARDEN_Y - dh / 2 - 6);
  }

  function drawCell() {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(CELL_X, CELL_Y, CELL_W, CELL_H);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 3;
    ctx.strokeRect(CELL_X, CELL_Y, CELL_W, CELL_H);

    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(CELL_X + 10, CELL_Y + CELL_H - 40, 80, 30);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 1;
    ctx.strokeRect(CELL_X + 10, CELL_Y + CELL_H - 40, 80, 30);
    ctx.fillStyle = "#666";
    ctx.font = "9px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("BED", CELL_X + 50, CELL_Y + CELL_H - 20);

    ctx.fillStyle = "#8b7355";
    ctx.font = "14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("CELL 245", CELL_X + CELL_W / 2, CELL_Y - 8);

    if (tunnelRevealed) {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 3);
      ctx.save();
      ctx.shadowColor = "rgba(255, 140, 0, " + (0.5 + pulse * 0.3) + ")";
      ctx.shadowBlur = 18 + pulse * 10;
      ctx.fillStyle = "#0a0a0a";
      ctx.beginPath();
      ctx.arc(TUNNEL_X, TUNNEL_Y, TUNNEL_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255, 140, 0, " + (0.4 + pulse * 0.4) + ")";
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = "#333";
      ctx.font = "9px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("TUNNEL", TUNNEL_X, TUNNEL_Y + TUNNEL_R + 14);

      const posterAngle = Math.sin(elapsed * 2) * 0.08;
      ctx.save();
      ctx.translate(POSTER_X, POSTER_Y);
      ctx.rotate(posterAngle);
      ctx.fillStyle = "#6a4e3a";
      ctx.fillRect(POSTER_W - 10, -30, POSTER_W, POSTER_H);
      ctx.strokeStyle = "#3a2a1a";
      ctx.lineWidth = 1;
      ctx.strokeRect(POSTER_W - 10, -30, POSTER_W, POSTER_H);
      ctx.fillStyle = "#aa8866";
      ctx.font = "7px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("POSTER", POSTER_W + POSTER_W / 2 - 10, POSTER_H / 2 - 25);
      ctx.restore();
    } else {
      ctx.fillStyle = "#6a4e3a";
      ctx.fillRect(POSTER_X, POSTER_Y, POSTER_W, POSTER_H);
      ctx.strokeStyle = "#3a2a1a";
      ctx.lineWidth = 1;
      ctx.strokeRect(POSTER_X, POSTER_Y, POSTER_W, POSTER_H);
      ctx.fillStyle = "#aa8866";
      ctx.font = "8px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("POSTER", POSTER_X + POSTER_W / 2, POSTER_Y + POSTER_H / 2 + 3);
    }

    if (barsLoaded) {
      const barCount = 6;
      const barSpacing = CELL_W / barCount;
      for (let i = 0; i < barCount; i++) {
        const barX = CELL_X + i * barSpacing;
        ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, barX, CELL_Y, barSpacing * 0.4, CELL_H);
      }
    }
  }

  function drawHUD() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(W / 2 - 180, 6, 360, 30);

    if (tunnelRevealed) {
      ctx.fillStyle = "#66ff66";
      ctx.font = "bold 15px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("The truth is out. Walk to the exit.", W / 2, 26);
    } else {
      ctx.fillStyle = "#ff6666";
      ctx.font = "bold 15px system-ui";
      ctx.textAlign = "center";
      ctx.fillText("The warden discovers the escape...", W / 2, 26);
    }
    ctx.restore();
  }

  function render() {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.fillStyle = "#0f0f0f";
    ctx.fillRect(0, 0, w, h);

    if (floorLoaded) {
      const cols = Math.ceil(w / TILE_SIZE) + 1;
      const rows = Math.ceil(h / TILE_SIZE) + 1;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          ctx.globalAlpha = 0.6;
          ctx.drawImage(floorImage, 0, 0, floorImage.width, floorImage.height, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
          ctx.globalAlpha = 1.0;
        }
      }
    }

    if (barsLoaded) {
      for (let x = 0; x < Math.ceil(w / TILE_SIZE) + 1; x++) {
        ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, x * TILE_SIZE, 0, TILE_SIZE, h * 0.35);
      }
    }

    drawCell();
    drawWarden();

    ctx.fillStyle = "rgba(40, 28, 18, 0.95)";
    ctx.fillRect(EXIT_LEFT - 20, EXIT_TOP - 20, EXIT_RIGHT - EXIT_LEFT + 40, EXIT_BOTTOM - EXIT_TOP + 40);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 3;
    ctx.strokeRect(EXIT_LEFT - 20, EXIT_TOP - 20, EXIT_RIGHT - EXIT_LEFT + 40, EXIT_BOTTOM - EXIT_TOP + 40);

    if (tunnelRevealed) {
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 4);
      ctx.fillStyle = "rgba(100, 255, 100, " + (0.15 + pulse * 0.1) + ")";
      ctx.fillRect(EXIT_LEFT - 20, EXIT_TOP - 20, EXIT_RIGHT - EXIT_LEFT + 40, EXIT_BOTTOM - EXIT_TOP + 40);
    }

    ctx.fillStyle = "#8b7355";
    ctx.font = "14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", (EXIT_LEFT + EXIT_RIGHT) / 2, (EXIT_TOP + EXIT_BOTTOM) / 2 + 5);

    drawPlayer();
    drawHUD();
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene9b = { init, update, render };
})();
