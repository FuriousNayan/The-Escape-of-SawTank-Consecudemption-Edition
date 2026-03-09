(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    // Canvas not supported; fail silently in this minimal skeleton.
    return;
  }

  // --- Config ----------------------------------------------------------------

  const MAP_COLS = 20;
  const MAP_ROWS = 15;
  const TILE_SIZE = 32;
  const PLAYER_SIZE = TILE_SIZE - 8;
  const PLAYER_SPEED = 5 * TILE_SIZE; // pixels per second (in tiles/sec * TILE_SIZE)

  // Set the internal canvas resolution based on the logical grid.
  canvas.width = MAP_COLS * TILE_SIZE;
  canvas.height = MAP_ROWS * TILE_SIZE;

  // Tile types
  const TILE = {
    FLOOR: 0,
    WALL: 1,
  };

  // Colors for tiles and entities
  const COLORS = {
    [TILE.FLOOR]: "#2b2b40",
    [TILE.WALL]: "#70708c",
    player: "#ffcc33",
  };

  // --- Map -------------------------------------------------------------------

  // Simple room-like layout: walls around the edges and a few internal walls.
  const map = createMap();

  function createMap() {
    const grid = [];

    for (let y = 0; y < MAP_ROWS; y += 1) {
      const row = [];
      for (let x = 0; x < MAP_COLS; x += 1) {
        const isBorder =
          y === 0 || y === MAP_ROWS - 1 || x === 0 || x === MAP_COLS - 1;
        row.push(isBorder ? TILE.WALL : TILE.FLOOR);
      }
      grid.push(row);
    }

    // A few interior walls for interest
    for (let x = 4; x < 10; x += 1) {
      grid[5][x] = TILE.WALL;
    }
    for (let y = 7; y < 12; y += 1) {
      grid[y][12] = TILE.WALL;
    }

    return grid;
  }

  function rectCollidesWithWall(x, y, width, height) {
    const leftTile = Math.floor(x / TILE_SIZE);
    const rightTile = Math.floor((x + width - 1) / TILE_SIZE);
    const topTile = Math.floor(y / TILE_SIZE);
    const bottomTile = Math.floor((y + height - 1) / TILE_SIZE);

    for (let ty = topTile; ty <= bottomTile; ty += 1) {
      for (let tx = leftTile; tx <= rightTile; tx += 1) {
        if (
          tx < 0 ||
          tx >= MAP_COLS ||
          ty < 0 ||
          ty >= MAP_ROWS ||
          map[ty][tx] === TILE.WALL
        ) {
          return true;
        }
      }
    }

    return false;
  }

  // --- Player ----------------------------------------------------------------

  const player = {
    x: (2.5) * TILE_SIZE,
    y: (2.5) * TILE_SIZE,
  };

  // --- Input -----------------------------------------------------------------

  const inputState = {
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

  window.addEventListener("keydown", (event) => {
    const action = KEY_MAP[event.key];
    if (!action) return;
    inputState[action] = true;
    event.preventDefault();
  });

  window.addEventListener("keyup", (event) => {
    const action = KEY_MAP[event.key];
    if (!action) return;
    inputState[action] = false;
    event.preventDefault();
  });

  // --- Game Loop -------------------------------------------------------------

  let lastFrameTime = 0;

  function update(timestamp) {
    if (!lastFrameTime) {
      lastFrameTime = timestamp;
      return;
    }

    const deltaMs = timestamp - lastFrameTime;
    const dt = deltaMs / 1000; // seconds
    lastFrameTime = timestamp;

    handleMovement(dt);
  }

  function handleMovement(dt) {
    let moveX = 0;
    let moveY = 0;

    if (inputState.up) moveY -= 1;
    if (inputState.down) moveY += 1;
    if (inputState.left) moveX -= 1;
    if (inputState.right) moveX += 1;

    if (moveX === 0 && moveY === 0) return;

    // Normalize diagonal movement so speed is consistent.
    const length = Math.hypot(moveX, moveY);
    if (length > 0) {
      moveX /= length;
      moveY /= length;
    }

    const distance = PLAYER_SPEED * dt;
    const dx = moveX * distance;
    const dy = moveY * distance;
    const half = PLAYER_SIZE / 2;

    // Move on X axis
    const proposedX = player.x + dx;
    if (
      !rectCollidesWithWall(
        proposedX - half,
        player.y - half,
        PLAYER_SIZE,
        PLAYER_SIZE
      )
    ) {
      player.x = proposedX;
    }

    // Move on Y axis
    const proposedY = player.y + dy;
    if (
      !rectCollidesWithWall(
        player.x - half,
        proposedY - half,
        PLAYER_SIZE,
        PLAYER_SIZE
      )
    ) {
      player.y = proposedY;
    }
  }

  function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw tiles
    for (let y = 0; y < MAP_ROWS; y += 1) {
      for (let x = 0; x < MAP_COLS; x += 1) {
        const tile = map[y][x];
        const color = COLORS[tile] || "#000000";
        ctx.fillStyle = color;
        ctx.fillRect(
          x * TILE_SIZE,
          y * TILE_SIZE,
          TILE_SIZE,
          TILE_SIZE
        );
      }
    }

    // Draw player
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(
      player.x - PLAYER_SIZE / 2,
      player.y - PLAYER_SIZE / 2,
      PLAYER_SIZE,
      PLAYER_SIZE
    );
  }

  function gameLoop(timestamp) {
    update(timestamp);
    render();
    window.requestAnimationFrame(gameLoop);
  }

  // Start the loop once everything is ready
  window.requestAnimationFrame(gameLoop);

  // ---------------------------------------------------------------------------
  // Future extension hooks:
  // - NPCs and guards with simple AI that patrol on the same grid.
  // - Interactable objects (desks, doors) using an interaction key.
  // - Tile metadata for things like cells, contraband zones, and vision cones.
})();

