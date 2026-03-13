/**
 * Scene 4 - Andy Meets Red / Rock Hammer
 * Red is "the guy who can get things." Walk to Red to continue.
 */
(function () {
  let canvas, ctx;
  let tankImage, bigPhillyImage, barsImage, floorImage;
  let tankLoaded = false;
  let bigPhillyLoaded = false;
  let barsLoaded = false;
  let floorLoaded = false;
  let elapsed = 0;
  const dust = [];

  const W = 960;
  const H = 540;
  const TILE_SIZE = 48;

  const SPEED = 90;
  const ROTATE_SPEED = Math.PI * 1.2;
  const FRAME_DURATION = 0.16;

  const player = {
    x: 180,
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

  const collectibles = [
    { name: "Smokes",       x: 350, y: 350, collected: false, type: "smokes" },
    { name: "Playing Cards", x: 550, y: 450, collected: false, type: "cards" },
    { name: "Rock Hammer",  x: 750, y: 300, collected: false, type: "hammer" },
  ];
  const COLLECT_RADIUS = 50;
  let interactPressed = false;

  const RED_ZONE_LEFT = 520;
  const RED_ZONE_RIGHT = 750;
  const RED_ZONE_TOP = 320;
  const RED_ZONE_BOTTOM = 500;

  function init(options) {
    canvas = options.canvas;
    ctx = options.ctx;
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    elapsed = 0;
    player.x = 180;
    player.y = 380;
    player.angle = -Math.PI / 2;
    player.frame = 0;
    player.frameTimer = 0;
    player.isMoving = false;
    input.up = input.down = input.left = input.right = input.interact = false;
    interactPressed = false;
    for (const c of collectibles) c.collected = false;

    tankImage = new Image();
    tankImage.src = "images/SawTank-Sheet-export.png";
    tankImage.onload = () => (tankLoaded = true);

    bigPhillyImage = new Image();
    bigPhillyImage.src = "images/bigphilly.png";
    bigPhillyImage.onload = () => (bigPhillyLoaded = true);

    barsImage = new Image();
    barsImage.src = "images/bars.png";
    barsImage.onload = () => (barsLoaded = true);

    floorImage = new Image();
    floorImage.src = "images/Dirt.png";
    floorImage.onload = () => (floorLoaded = true);

    for (let i = 0; i < 24; i++) {
      dust.push({
        x: Math.random() * W,
        y: Math.random() * H,
        speed: 12 + Math.random() * 18,
        size: 0.8 + Math.random() * 1.5,
        opacity: 0.03 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2,
      });
    }

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
        { speaker: "The Big Collins", text: "I'm the guy who can get things. Smokes, playing cards, a little rock hammer.", portrait: "bigphilly" },
        { speaker: "Saw-Tank", text: "A rock hammer?", portrait: "sawTank_face" },
        { speaker: "The Big Collins", text: "For shaping rocks. Into chess pieces or what have you. Maybe even drum sticks. Takes a while, but it'd keep your mind occupied.", portrait: "bigphilly" },
        { speaker: "Saw-Tank", text: "I'd like one.", portrait: "sawTank_face" },
        { speaker: "The Big Collins", text: "I'll see what I can do. Could take a couple of weeks. I'm a man who likes to plan ahead.", portrait: "bigphilly" },
        { speaker: "The Big Collins", text: "Most new fish are scared. Saw Tank wasn't. He had a quiet way about him. A walk and a talk that just wasn't normal around here.", portrait: "bigphilly", thought: true },
      ];
      requestAnimationFrame(() => {
        window.Dialogue.start(script);
      });
    }
  }

  function inRedZone() {
    return player.x >= RED_ZONE_LEFT && player.x <= RED_ZONE_RIGHT &&
           player.y >= RED_ZONE_TOP && player.y <= RED_ZONE_BOTTOM;
  }

  function update(dt) {
    elapsed += dt;
    for (const d of dust) {
      d.y -= d.speed * dt;
      if (d.y < -10) {
        d.y = H + 5;
        d.x = Math.random() * W;
      }
    }
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

    // Collectible pickup via E key (rising-edge only)
    if (input.interact && !interactPressed) {
      interactPressed = true;
      for (const c of collectibles) {
        if (c.collected) continue;
        const dx = player.x - c.x;
        const dy = player.y - c.y;
        if (Math.sqrt(dx * dx + dy * dy) <= COLLECT_RADIUS) {
          c.collected = true;
          break;
        }
      }
    }
    if (!input.interact) interactPressed = false;

    const allCollected = collectibles.every(c => c.collected);
    if (allCollected && inRedZone()) {
      window.goToScene("scene5");
    }

    player.frameTimer += dt;
    if (player.frameTimer >= FRAME_DURATION) {
      player.frameTimer -= FRAME_DURATION;
      player.frame = (player.frame + 1) % 2;
    }
  }

  function drawPlayer() {
    if (!tankLoaded) return;
    const frameCount = 2;
    const frameIndex = player.frame % frameCount;
    const frameWidth = tankImage.width / frameCount;
    const frameHeight = tankImage.height;
    const scale = 1.0;
    const dw = frameWidth * scale;
    const dh = frameHeight * scale;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    const pivotBack = dw * 0.25;
    ctx.drawImage(
      tankImage,
      frameIndex * frameWidth, 0, frameWidth, frameHeight,
      -dw / 2 + pivotBack, -dh / 2, dw, dh
    );
    ctx.restore();
  }

  function drawCollectibles() {
    const pulse = 0.5 + 0.5 * Math.sin(elapsed * 3);
    for (const c of collectibles) {
      if (c.collected) continue;

      // Pulsing yellow glow
      ctx.save();
      const glowRadius = 22 + pulse * 8;
      const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, glowRadius);
      glow.addColorStop(0, `rgba(255, 220, 60, ${0.35 + pulse * 0.2})`);
      glow.addColorStop(1, "rgba(255, 220, 60, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(c.x - glowRadius, c.y - glowRadius, glowRadius * 2, glowRadius * 2);
      ctx.restore();

      ctx.save();
      if (c.type === "smokes") {
        ctx.fillStyle = "#8B5E3C";
        ctx.fillRect(c.x - 8, c.y - 5, 16, 10);
        ctx.fillStyle = "#A97B50";
        ctx.fillRect(c.x - 6, c.y - 3, 12, 6);
      } else if (c.type === "cards") {
        ctx.fillStyle = "#E8E0D0";
        ctx.fillRect(c.x - 7, c.y - 10, 14, 20);
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        ctx.strokeRect(c.x - 7, c.y - 10, 14, 20);
        ctx.fillStyle = "#C00";
        ctx.font = "bold 10px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("A", c.x, c.y + 4);
      } else if (c.type === "hammer") {
        ctx.fillStyle = "#888";
        ctx.fillRect(c.x - 2, c.y - 4, 4, 16);
        ctx.fillRect(c.x - 8, c.y - 8, 16, 6);
        ctx.fillStyle = "#6B4226";
        ctx.fillRect(c.x - 2, c.y + 2, 4, 10);
      }
      ctx.restore();

      // Label
      ctx.save();
      ctx.font = "600 10px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255, 240, 200, 0.9)";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 3;
      ctx.fillText(c.name, c.x, c.y - 18);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function nearbyItem() {
    for (const c of collectibles) {
      if (c.collected) continue;
      const dx = player.x - c.x;
      const dy = player.y - c.y;
      if (Math.sqrt(dx * dx + dy * dy) <= COLLECT_RADIUS) return c;
    }
    return null;
  }

  function drawHUD() {
    const collected = collectibles.filter(c => c.collected).length;
    const allCollected = collected === collectibles.length;

    // Semi-transparent banner at top
    ctx.save();
    ctx.fillStyle = "rgba(10, 8, 6, 0.7)";
    ctx.fillRect(0, 0, W, 36);
    ctx.strokeStyle = "rgba(255, 200, 140, 0.3)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, 36);
    ctx.lineTo(W, 36);
    ctx.stroke();

    ctx.font = "600 14px system-ui";
    ctx.textAlign = "center";
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 4;

    if (!allCollected) {
      ctx.fillStyle = "rgba(255, 230, 180, 0.95)";
      ctx.fillText("Collect contraband for The Big Collins: " + collected + "/3", W / 2, 24);
    } else {
      ctx.fillStyle = "rgba(120, 255, 140, 0.95)";
      ctx.fillText("All items collected! Walk to The Big Collins.", W / 2, 24);
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    // Proximity prompt
    const nearby = nearbyItem();
    if (nearby) {
      ctx.save();
      ctx.font = "600 13px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(10, 8, 6, 0.75)";
      const promptText = "Press E to pick up " + nearby.name;
      const tm = ctx.measureText(promptText);
      const px = player.x;
      const py = player.y - 42;
      ctx.fillRect(px - tm.width / 2 - 8, py - 12, tm.width + 16, 22);
      ctx.fillStyle = "rgba(255, 235, 100, 0.95)";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 3;
      ctx.fillText(promptText, px, py + 4);
      ctx.shadowBlur = 0;
      ctx.restore();
    }
  }

  function render() {
    if (!ctx || !canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    // Atmospheric gradient background (prison yard dusk)
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, "#0d1117");
    skyGrad.addColorStop(0.25, "#151922");
    skyGrad.addColorStop(0.5, "#1a1d24");
    skyGrad.addColorStop(0.85, "#242018");
    skyGrad.addColorStop(1, "#1e1a14");
    ctx.fillStyle = skyGrad;
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

    if (barsLoaded) {
      ctx.globalAlpha = 0.7;
      const barRows = 3;
      for (let y = 0; y < barRows; y++) {
        for (let x = 0; x < Math.ceil(w / TILE_SIZE) + 1; x++) {
          ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
      ctx.globalAlpha = 1;
    }

    // Soft spotlight on Red's meeting area (dramatic focus)
    const spotGrad = ctx.createRadialGradient(640, 380, 0, 640, 380, 280);
    spotGrad.addColorStop(0, "rgba(255, 220, 180, 0.22)");
    spotGrad.addColorStop(0.35, "rgba(255, 200, 150, 0.08)");
    spotGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spotGrad;
    ctx.fillRect(0, 0, w, h);

    // Ambient floating dust in the yard
    for (const d of dust) {
      const sway = Math.sin(elapsed * 0.8 + d.phase) * 3;
      ctx.fillStyle = `rgba(255, 235, 200, ${d.opacity * (0.6 + 0.4 * Math.sin(elapsed + d.phase))})`;
      ctx.fillRect(d.x + sway, d.y, d.size, d.size);
    }

    // Red's shadow (ground shadow)
    if (bigPhillyLoaded) {
      const maxW = TILE_SIZE * 2;
      const maxH = TILE_SIZE * 2;
      const scale = Math.min(maxW / bigPhillyImage.width, maxH / bigPhillyImage.height);
      const dw = bigPhillyImage.width * scale;
      const dh = bigPhillyImage.height * scale;
      const redX = 640 - dw / 2;
      const redY = 380 - dh / 2;

      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
      ctx.beginPath();
      ctx.ellipse(640, 380 + dh * 0.35, dw * 0.55, dh * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(255, 200, 140, 0.35)";
      ctx.shadowBlur = 35;
      ctx.drawImage(bigPhillyImage, 0, 0, bigPhillyImage.width, bigPhillyImage.height, redX, redY, dw, dh);
      ctx.restore();

      ctx.save();
      ctx.font = "600 13px system-ui";
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(30, 22, 18, 0.85)";
      ctx.fillRect(640 - 66, redY - 22, 132, 20);
      ctx.strokeStyle = "rgba(255, 200, 140, 0.5)";
      ctx.lineWidth = 1;
      ctx.strokeRect(640 - 66, redY - 22, 132, 20);
      ctx.fillStyle = "rgba(255, 235, 200, 0.95)";
      ctx.fillText("The Big Collins", 640, redY - 8);
      ctx.restore();
    }

    drawCollectibles();
    drawPlayer();

    // Cinematic vignette (darker edges, pulls focus to center)
    const vignette = ctx.createRadialGradient(w / 2, h * 0.42, h * 0.1, w / 2, h / 2, h * 1.0);
    vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
    vignette.addColorStop(0.4, "rgba(0, 0, 0, 0.15)");
    vignette.addColorStop(0.7, "rgba(0, 0, 0, 0.45)");
    vignette.addColorStop(1, "rgba(0, 0, 0, 0.7)");
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);

    // Subtle warm haze overlay (prison yard golden hour)
    const haze = ctx.createLinearGradient(0, 0, 0, h);
    haze.addColorStop(0, "rgba(80, 60, 40, 0.06)");
    haze.addColorStop(0.6, "rgba(120, 90, 60, 0.04)");
    haze.addColorStop(1, "rgba(60, 45, 30, 0.08)");
    ctx.fillStyle = haze;
    ctx.fillRect(0, 0, w, h);

    drawHUD();
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene4 = { init, update, render };
})();
