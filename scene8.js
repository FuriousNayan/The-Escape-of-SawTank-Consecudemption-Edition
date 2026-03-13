/**
 * Scene 8 - Tommy / Warden's Office
 * Collect 3 pieces of evidence before leaving the warden's block.
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
    x: 300,
    y: 420,
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

  const evidence = [
    { x: 400, y: 300, name: "Ledger", collected: false },
    { x: 600, y: 350, name: "Letter", collected: false },
    { x: 250, y: 400, name: "Photo", collected: false },
  ];

  let collectMessage = "";
  let collectTimer = 0;

  const EXIT_LEFT = 750;
  const EXIT_RIGHT = 900;
  const EXIT_TOP = 400;
  const EXIT_BOTTOM = 510;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;
    player.x = 300;
    player.y = 420;
    player.angle = -Math.PI / 2;
    player.frame = 0;
    player.frameTimer = 0;
    player.isMoving = false;
    input.up = input.down = input.left = input.right = false;
    input.interact = false;

    evidence.forEach(function (e) { e.collected = false; });
    collectMessage = "";
    collectTimer = 0;

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
        { speaker: "Tommy", text: "I knew a guy. Elmo Blatch. Bragged about it in another joint. Said he killed a banker's wife and some guy took the fall.", portrait: "heywood" },
        { speaker: "Saw-Tank", text: "That was me. I'm that guy.", portrait: "sawTank_face" },
        { speaker: "The Big Tech", text: "Norton. I'm very disappointed. I thought you trusted me.", portrait: "waketech" },
        { speaker: "The Big Collins", text: "Tommy was found shot. The Big Tech called it a suicide. That was when Saw Tank knew. He would never get out through the system.", portrait: "bigphilly", thought: true },
      ];
      requestAnimationFrame(() => window.Dialogue.start(script));
    }
  }

  function inExitZone() {
    return player.x >= EXIT_LEFT && player.x <= EXIT_RIGHT &&
           player.y >= EXIT_TOP && player.y <= EXIT_BOTTOM;
  }

  function allEvidenceCollected() {
    return evidence.every(function (e) { return e.collected; });
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

    if (input.interact) {
      for (const item of evidence) {
        if (item.collected) continue;
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        if (Math.sqrt(dx * dx + dy * dy) < 55) {
          item.collected = true;
          collectMessage = "Collected: " + item.name;
          collectTimer = 2.0;
          input.interact = false;
          break;
        }
      }
    }

    if (collectTimer > 0) collectTimer -= dt;

    if (allEvidenceCollected() && inExitZone()) window.goToScene("scene9");

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

  function drawEvidence() {
    for (const item of evidence) {
      if (item.collected) continue;
      const pulse = 0.5 + 0.5 * Math.sin(elapsed * 4);
      ctx.save();
      ctx.shadowColor = "rgba(255, 220, 100, " + (0.4 + pulse * 0.4) + ")";
      ctx.shadowBlur = 12 + pulse * 6;
      ctx.fillStyle = "rgba(255, 220, 100, " + (0.7 + pulse * 0.2) + ")";
      ctx.fillRect(item.x - 12, item.y - 8, 24, 16);
      ctx.strokeStyle = "#fff8dc";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(item.x - 12, item.y - 8, 24, 16);
      ctx.restore();
      ctx.fillStyle = "#fff8dc";
      ctx.font = "11px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(item.name, item.x, item.y - 14);
    }
  }

  function drawHUD() {
    const collected = evidence.filter(function (e) { return e.collected; }).length;
    const all = allEvidenceCollected();

    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
    ctx.fillRect(W / 2 - 160, 6, 320, 30);
    ctx.fillStyle = all ? "#66ff66" : "#ffd700";
    ctx.font = "bold 15px system-ui";
    ctx.textAlign = "center";
    ctx.fillText(
      all ? "Evidence secured. Leave the office." : "Gather evidence: " + collected + "/3",
      W / 2, 26
    );
    ctx.restore();

    if (!all) {
      for (const item of evidence) {
        if (item.collected) continue;
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        if (Math.sqrt(dx * dx + dy * dy) < 55) {
          ctx.save();
          ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
          ctx.fillRect(player.x - 80, player.y - 50, 160, 24);
          ctx.fillStyle = "#ffffff";
          ctx.font = "13px system-ui";
          ctx.textAlign = "center";
          ctx.fillText("Press E to take " + item.name, player.x, player.y - 33);
          ctx.restore();
          break;
        }
      }
    }

    if (collectTimer > 0) {
      const alpha = Math.min(1, collectTimer);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.fillRect(W / 2 - 120, H / 2 - 20, 240, 36);
      ctx.fillStyle = "#66ff66";
      ctx.font = "bold 14px system-ui";
      ctx.textAlign = "center";
      ctx.fillText(collectMessage, W / 2, H / 2 + 2);
      ctx.restore();
    }
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
      for (let x = 0; x < Math.ceil(w / TILE_SIZE) + 1; x++) {
        ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, x * TILE_SIZE, 0, TILE_SIZE, h * 0.4);
      }
    }

    ctx.fillStyle = "#2c1810";
    ctx.fillRect(w * 0.2, h * 0.25, w * 0.6, h * 0.4);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.2, h * 0.25, w * 0.6, h * 0.4);
    ctx.fillStyle = "#8b7355";
    ctx.font = "18px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("THE BIG TECH'S OFFICE", w / 2, h * 0.42);

    ctx.fillStyle = "rgba(60, 45, 30, 0.95)";
    ctx.fillRect(EXIT_LEFT - 20, EXIT_TOP - 20, EXIT_RIGHT - EXIT_LEFT + 40, EXIT_BOTTOM - EXIT_TOP + 40);
    ctx.strokeStyle = "#5c4033";
    ctx.lineWidth = 3;
    ctx.strokeRect(EXIT_LEFT - 20, EXIT_TOP - 20, EXIT_RIGHT - EXIT_LEFT + 40, EXIT_BOTTOM - EXIT_TOP + 40);
    ctx.fillStyle = "#8b7355";
    ctx.font = "14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText("EXIT", (EXIT_LEFT + EXIT_RIGHT) / 2, (EXIT_TOP + EXIT_BOTTOM) / 2);

    drawEvidence();
    drawPlayer();
    drawHUD();
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene8 = { init, update, render };
})();
