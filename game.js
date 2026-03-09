(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  ctx.imageSmoothingEnabled = true;

  function resizeCanvas() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // --- Config ----------------------------------------------------------------

  const ROOM_COLS = 20;
  const ROOM_ROWS = 11;
  const TILE_SIZE = 48; // logical tiles, but movement is fully analog
  const LOGICAL_WIDTH = ROOM_COLS * TILE_SIZE;
  const LOGICAL_HEIGHT = ROOM_ROWS * TILE_SIZE;

  const PLAYER_SPEED = 130; // pixels / second (slower scene pacing)
  const PLAYER_ROTATE_SPEED = Math.PI * 1.4; // radians / second

  // --- Assets ----------------------------------------------------------------

  const floorImage = new Image();
  floorImage.src = "images/grass.png";

  const tankImage = new Image();
  tankImage.src = "images/SawTank-Sheet-export.png";

  let floorLoaded = false;
  let tankLoaded = false;

  floorImage.onload = () => { floorLoaded = true; };
  tankImage.onload = () => { tankLoaded = true; };

  // --- Characters ------------------------------------------------------------
  // Each character has its own attributes. Add new entries to the array to introduce NPCs.
  // Schema: { id, spriteSrc, tileX, tileY, maxWidthTiles?, maxHeightTiles?, solid?, layer?, ... }
  const characterImages = {}; // id -> Image (populated when loaded)

  const characters = [
    {
      id: "bigPhilly",
      spriteSrc: "images/bigphilly.png",
      tileX: 1.8,
      tileY: 1.8,
      maxWidthTiles: 1.2,
      maxHeightTiles: 1.2,
      solid: false,
      layer: 0,
    },
    {
      id: "boohbahThug",
      spriteSrc: "images/boohbahThug.png",
      tileX: 3.5,
      tileY: 1.8,
      maxWidthTiles: 1.2,
      maxHeightTiles: 1.2,
      solid: false,
      layer: 0,
    },
  ];

  characters.forEach((ch) => {
    const img = new Image();
    img.src = ch.spriteSrc;
    img.onload = () => { characterImages[ch.id] = img; };
  });

  // --- Room Layout -----------------------------------------------------------
  // 0 = floor, 1 = wall, 2 = exit door

  const TILES = {
    FLOOR: 0,
    WALL: 1,
    EXIT: 2,
  };

  const EXIT_TILE_POS = { x: 18, y: 1 };

  const room = Array.from({ length: ROOM_ROWS }, (_, y) =>
    Array.from({ length: ROOM_COLS }, (_, x) => {
      const isBorder =
        y === 0 || y === ROOM_ROWS - 1 || x === 0 || x === ROOM_COLS - 1;
      return isBorder ? TILES.WALL : TILES.FLOOR;
    })
  );
  room[EXIT_TILE_POS.y][EXIT_TILE_POS.x] = TILES.EXIT;

  // Jail bar corridor near the bottom so the tank starts in a narrow lane.
  // This creates two vertical walls at columns 9 and 11 for rows 6-9,
  // leaving a straight corridor at column 10.
  for (let y = 6; y <= 9; y += 1) {
    room[y][9] = TILES.WALL;
    room[y][11] = TILES.WALL;
  }

  const statusEl = document.getElementById("statusText");

  // --- Player ----------------------------------------------------------------

  const player = {
    // Start in the bottom middle, just above the bottom wall
    x: (10.5) * TILE_SIZE,
    y: (9.5) * TILE_SIZE,
    angle: -Math.PI / 2, // facing "up"
    frame: 0,
    frameTimer: 0,
    isMoving: false,
  };

  const PLAYER_ANIM_FRAME_DURATION = 0.16;

  // A soft radius used for collision testing that roughly matches the tank body.
  const PLAYER_COLLISION_RADIUS = 18;

  // Trail marks: appear behind the tank and fade out.
  const trailMarks = [];
  const TRAIL_MARK_INTERVAL = 12; // pixels between marks
  const TRAIL_MARK_LIFETIME = 1.8; // seconds
  let lastTrailX = player.x;
  let lastTrailY = player.y;

  // --- Input -----------------------------------------------------------------

  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
  };

  const KEY_MAP = {
    ArrowUp: "up",
    ArrowDown: "down",
    ArrowLeft: "left",
    ArrowRight: "right",
    w: "up",
    s: "down",
    a: "left",
    d: "right",
    W: "up",
    S: "down",
    A: "left",
    D: "right",
  };

  window.addEventListener("keydown", (e) => {
    const action = KEY_MAP[e.key];
    if (!action) return;
    input[action] = true;
    e.preventDefault();
  });

  window.addEventListener("keyup", (e) => {
    const action = KEY_MAP[e.key];
    if (!action) return;
    input[action] = false;
    e.preventDefault();
  });

  // --- Helpers ---------------------------------------------------------------

  function tileAtPixel(px, py) {
    const tx = Math.floor(px / TILE_SIZE);
    const ty = Math.floor(py / TILE_SIZE);
    if (tx < 0 || ty < 0 || tx >= ROOM_COLS || ty >= ROOM_ROWS) return TILES.WALL;
    return room[ty][tx];
  }

  function isSolidTile(tile) {
    return tile === TILES.WALL;
  }

  function reachedExit() {
    const exitCenterX = (EXIT_TILE_POS.x + 0.5) * TILE_SIZE;
    const exitCenterY = (EXIT_TILE_POS.y + 0.5) * TILE_SIZE;
    const dx = player.x - exitCenterX;
    const dy = player.y - exitCenterY;
    return Math.hypot(dx, dy) < TILE_SIZE * 0.6;
  }

  // --- Simulation ------------------------------------------------------------

  let lastTime = 0;
  let escaped = false;

  function update(timestamp) {
    if (!lastTime) {
      lastTime = timestamp;
      requestAnimationFrame(update);
      return;
    }

    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;

    stepPlayer(dt);
    updateAnimation(dt);
    updateTrailMarks(lastTime);
    render();

    requestAnimationFrame(update);
  }

  function stepPlayer(dt) {
    if (escaped) return;

    let moveForward = 0;
    let rotateDir = 0;

    if (input.up) moveForward += 1;
    if (input.down) moveForward -= 1;
    if (input.left) rotateDir -= 1;
    if (input.right) rotateDir += 1;

    player.isMoving = moveForward !== 0;

    if (rotateDir !== 0) {
      player.angle += rotateDir * PLAYER_ROTATE_SPEED * dt;
    }

    if (!player.isMoving) return;

    const distance = PLAYER_SPEED * dt * Math.sign(moveForward);
    const dx = Math.cos(player.angle) * distance;
    const dy = Math.sin(player.angle) * distance;

    const nextX = player.x + dx;
    const nextY = player.y + dy;

    // Collision: sample a small cross-shape around the tank center.
    const samplePoints = [
      [nextX, nextY],
      [nextX + PLAYER_COLLISION_RADIUS, nextY],
      [nextX - PLAYER_COLLISION_RADIUS, nextY],
      [nextX, nextY + PLAYER_COLLISION_RADIUS],
      [nextX, nextY - PLAYER_COLLISION_RADIUS],
    ];

    let blocked = false;
    for (const [sx, sy] of samplePoints) {
      if (isSolidTile(tileAtPixel(sx, sy))) {
        blocked = true;
        break;
      }
    }

    if (!blocked) {
      player.x = nextX;
      player.y = nextY;

      const dist = Math.hypot(player.x - lastTrailX, player.y - lastTrailY);
      if (dist >= TRAIL_MARK_INTERVAL) {
        const perpX = -Math.sin(player.angle);
        const perpY = Math.cos(player.angle);
        const offset = 10;
        trailMarks.push({
          x: player.x + perpX * offset,
          y: player.y + perpY * offset,
          angle: player.angle,
          t: lastTime,
        });
        trailMarks.push({
          x: player.x - perpX * offset,
          y: player.y - perpY * offset,
          angle: player.angle,
          t: lastTime,
        });
        lastTrailX = player.x;
        lastTrailY = player.y;
      }
    }

    if (!escaped && reachedExit()) {
      escaped = true;
      if (statusEl) statusEl.textContent = "You escaped this block. Nice work, SawTank.";
    }
  }

  function updateTrailMarks(now) {
    const cutoff = now - TRAIL_MARK_LIFETIME * 1000;
    while (trailMarks.length > 0 && trailMarks[0].t < cutoff) {
      trailMarks.shift();
    }
  }

  function updateAnimation(dt) {
    if (!tankLoaded) return;

    player.frameTimer += dt;
    if (player.frameTimer >= PLAYER_ANIM_FRAME_DURATION) {
      player.frameTimer -= PLAYER_ANIM_FRAME_DURATION;
      player.frame = (player.frame + 1) % 2;
    }
  }

  // --- Rendering -------------------------------------------------------------

  function render() {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(canvas.width / LOGICAL_WIDTH, canvas.height / LOGICAL_HEIGHT);

    drawFloor();
    drawCharacters();
    drawWallsAndExit();
    drawPlayer();

    ctx.restore();
  }

  function drawFloor() {
    for (let y = 0; y < ROOM_ROWS; y += 1) {
      for (let x = 0; x < ROOM_COLS; x += 1) {
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (floorLoaded) {
          ctx.drawImage(
            floorImage,
            0,
            0,
            floorImage.width,
            floorImage.height,
            px,
            py,
            TILE_SIZE,
            TILE_SIZE
          );
        } else {
          ctx.fillStyle = "#0c3113";
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  function drawWallsAndExit() {
    for (let y = 0; y < ROOM_ROWS; y += 1) {
      for (let x = 0; x < ROOM_COLS; x += 1) {
        const tile = room[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        if (tile === TILES.WALL) {
          if (barsLoaded) {
            ctx.drawImage(
              barsImage,
              0,
              0,
              barsImage.width,
              barsImage.height,
              px,
              py,
              TILE_SIZE,
              TILE_SIZE
            );
          } else {
            ctx.fillStyle = "#0d1a14";
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          }
        } else if (tile === TILES.EXIT) {
          const grad = ctx.createLinearGradient(px, py, px, py + TILE_SIZE);
          grad.addColorStop(0, "#3ee6a8");
          grad.addColorStop(1, "#17835a");
          ctx.fillStyle = grad;
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "rgba(0, 0, 0, 0.55)";
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
        }
      }
    }
  }

  function drawCharacters() {
    const byLayer = [...characters].sort((a, b) => (a.layer ?? 0) - (b.layer ?? 0));
    for (const ch of byLayer) {
      const img = characterImages[ch.id];
      if (!img) continue;

      const maxW = (ch.maxWidthTiles ?? 1) * TILE_SIZE;
      const maxH = (ch.maxHeightTiles ?? 1) * TILE_SIZE;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const px = (ch.tileX ?? 0) * TILE_SIZE - drawW / 2;
      const py = (ch.tileY ?? 0) * TILE_SIZE - drawH / 2;

      ctx.drawImage(img, px, py, drawW, drawH);
    }
  }

  function drawPlayer() {
    if (!tankLoaded) return;

    const frameCount = 2;
    const frameIndex = player.frame % frameCount;

    // We know the sheet is two frames laid out horizontally.
    const frameWidth = tankImage.width / frameCount;
    const frameHeight = tankImage.height;
    const sx = frameIndex * frameWidth;
    const sy = 0;

    const dw = frameWidth;
    const dh = frameHeight;

    ctx.save();
    ctx.translate(player.x, player.y);
    ctx.rotate(player.angle);
    // Pivot toward the back of the tank: shift on X axis.
    const pivotBack = dw * 0.25;
    ctx.drawImage(
      tankImage,
      sx,
      sy,
      frameWidth,
      frameHeight,
      -dw / 2 + pivotBack,
      -dh / 2,
      dw,
      dh
    );
    ctx.restore();
  }

  // --- Kick things off -------------------------------------------------------

  if (statusEl) statusEl.textContent = "Find the glowing exit tile.";
  requestAnimationFrame(update);
})();

