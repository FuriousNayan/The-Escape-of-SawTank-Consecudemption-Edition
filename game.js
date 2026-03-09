(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return;

  // Make sure we are not in "pixel-perfect" mode; allow smooth scaling.
  ctx.imageSmoothingEnabled = true;

  // --- Config ----------------------------------------------------------------

  const ROOM_COLS = 20;
  const ROOM_ROWS = 11;
  const TILE_SIZE = 48; // logical tiles, but movement is fully analog

  const PLAYER_SPEED = 210; // pixels / second
  const PLAYER_ROTATE_SPEED = Math.PI * 1.4; // radians / second

  // --- Assets ----------------------------------------------------------------

  const floorImage = new Image();
  floorImage.src = "grass.png";

  const tankImage = new Image();
  tankImage.src = "SawTank-Sheet-export.png";

  let floorLoaded = false;
  let tankLoaded = false;

  floorImage.onload = () => {
    floorLoaded = true;
  };

  tankImage.onload = () => {
    tankLoaded = true;
  };

  // --- Room Layout -----------------------------------------------------------
  // 0 = floor, 1 = wall, 2 = exit door

  const TILES = {
    FLOOR: 0,
    WALL: 1,
    EXIT: 2,
  };

  const room = [
    // 20 columns wide
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 1],
    [1, 0, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 1],
    [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  const EXIT_TILE_POS = { x: 18, y: 1 };

  const statusEl = document.getElementById("statusText");

  // --- Player ----------------------------------------------------------------

  const player = {
    x: TILE_SIZE * 2.5,
    y: TILE_SIZE * 8.5,
    angle: -Math.PI / 2, // facing "up"
    frame: 0,
    frameTimer: 0,
    isMoving: false,
  };

  const PLAYER_ANIM_FRAME_DURATION = 0.16;

  // A soft radius used for collision testing that roughly matches the tank body.
  const PLAYER_COLLISION_RADIUS = 18;

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
    }

    if (!escaped && reachedExit()) {
      escaped = true;
      if (statusEl) statusEl.textContent = "You escaped this block. Nice work, SawTank.";
    }
  }

  function updateAnimation(dt) {
    if (!tankLoaded) return;

    if (!player.isMoving) {
      player.frame = 0;
      player.frameTimer = 0;
      return;
    }

    player.frameTimer += dt;
    if (player.frameTimer >= PLAYER_ANIM_FRAME_DURATION) {
      player.frameTimer -= PLAYER_ANIM_FRAME_DURATION;
      player.frame = (player.frame + 1) % 2;
    }
  }

  // --- Rendering -------------------------------------------------------------

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    drawFloor();
    drawWallsAndExit();
    drawPlayer();
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
          ctx.fillStyle = "#143324";
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
          ctx.strokeStyle = "rgba(8, 16, 12, 0.5)";
          ctx.strokeRect(px + 0.5, py + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
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
    // Top of the sprite is forward.
    ctx.rotate(player.angle);
    ctx.drawImage(tankImage, sx, sy, frameWidth, frameHeight, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  }

  // --- Kick things off -------------------------------------------------------

  if (statusEl) statusEl.textContent = "Find the glowing exit tile.";
  requestAnimationFrame(update);
})();

