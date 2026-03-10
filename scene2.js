/**
 * Scene 2 - Prison Escape (main game)
 */
(function () {
  function init(options) {
    const canvas = options.canvas;
    const ctx = options.ctx;

    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;

    // --- Config ----------------------------------------------------------------
    const ROOM_COLS = 20;
    const ROOM_ROWS = 11;
    const TILE_SIZE = 48;
    const PLAYER_SPEED = 130;
    const PLAYER_ROTATE_SPEED = Math.PI * 1.4;

    // --- Assets ----------------------------------------------------------------
    const floorImage = new Image();
    floorImage.src = "images/dirt.png";
    const tankImage = new Image();
    tankImage.src = "images/SawTank-Sheet-export.png";
    const bigPhillyImage = new Image();
    bigPhillyImage.src = "images/bigphilly.png";
    const barsImage = new Image();
    barsImage.src = "images/bars.png";
    const heywoodImage = new Image();
    heywoodImage.src = "images/heywood.png";

    let floorLoaded = false;
    let tankLoaded = false;
    let bigPhillyLoaded = false;
    let barsLoaded = false;
    let heywoodLoaded = false;

    floorImage.onload = () => (floorLoaded = true);
    tankImage.onload = () => (tankLoaded = true);
    bigPhillyImage.onload = () => (bigPhillyLoaded = true);
    barsImage.onload = () => (barsLoaded = true);
    heywoodImage.onload = () => (heywoodLoaded = true);

    // --- Room Layout -----------------------------------------------------------
    const TILES = { FLOOR: 0, WALL: 1, EXIT: 2 };
    const EXIT_TILE_POS = { x: 18, y: 1 };
    const BIG_PHILLY_POS = { x: 1.8, y: 1.8 };
    const HEYWOOD_POS = { x: 3.5, y: 1.8 };

    const room = Array.from({ length: ROOM_ROWS }, (_, y) =>
      Array.from({ length: ROOM_COLS }, (_, x) => {
        const isBorder =
          y === 0 || y === ROOM_ROWS - 1 || x === 0 || x === ROOM_COLS - 1;
        return isBorder ? TILES.WALL : TILES.FLOOR;
      })
    );
    room[EXIT_TILE_POS.y][EXIT_TILE_POS.x] = TILES.EXIT;
    for (let y = 6; y <= 9; y += 1) {
      room[y][9] = TILES.WALL;
      room[y][11] = TILES.WALL;
    }

    const statusEl = document.getElementById("statusText");

    // --- Player ----------------------------------------------------------------
    const player = {
      x: 10.5 * TILE_SIZE,
      y: 9.5 * TILE_SIZE,
      angle: -Math.PI / 2,
      frame: 0,
      frameTimer: 0,
      isMoving: false,
    };

    const PLAYER_ANIM_FRAME_DURATION = 0.16;
    const PLAYER_COLLISION_RADIUS = 18;
    const trailMarks = [];
    const TRAIL_MARK_INTERVAL = 12;
    const TRAIL_MARK_LIFETIME = 1.8;
    let lastTrailX = player.x;
    let lastTrailY = player.y;

    // --- Input -----------------------------------------------------------------
    const input = { up: false, down: false, left: false, right: false };
    const KEY_MAP = {
      ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
      w: "up", s: "down", a: "left", d: "right",
      W: "up", S: "down", A: "left", D: "right",
    };

    const keyHandler = (e, down) => {
      const action = KEY_MAP[e.key];
      if (!action) return;
      input[action] = down;
      e.preventDefault();
    };
    window.addEventListener("keydown", (e) => keyHandler(e, true));
    window.addEventListener("keyup", (e) => keyHandler(e, false));

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

    let escaped = false;

    function stepPlayer(dt) {
      if (escaped) return;
      if (window.Dialogue?.visible?.()) return;
      let moveForward = 0;
      let rotateDir = 0;
      if (input.up) moveForward += 1;
      if (input.down) moveForward -= 1;
      if (input.left) rotateDir -= 1;
      if (input.right) rotateDir += 1;
      player.isMoving = moveForward !== 0;
      if (rotateDir !== 0) player.angle += rotateDir * PLAYER_ROTATE_SPEED * dt;
      if (!player.isMoving) return;
      const distance = PLAYER_SPEED * dt * Math.sign(moveForward);
      const dx = Math.cos(player.angle) * distance;
      const dy = Math.sin(player.angle) * distance;
      const nextX = player.x + dx;
      const nextY = player.y + dy;
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
          const now = performance.now();
          trailMarks.push({ x: player.x + perpX * offset, y: player.y + perpY * offset, angle: player.angle, t: now });
          trailMarks.push({ x: player.x - perpX * offset, y: player.y - perpY * offset, angle: player.angle, t: now });
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
      while (trailMarks.length > 0 && trailMarks[0].t < cutoff) trailMarks.shift();
    }

    function updateAnimation(dt) {
      if (!tankLoaded) return;
      player.frameTimer += dt;
      if (player.frameTimer >= PLAYER_ANIM_FRAME_DURATION) {
        player.frameTimer -= PLAYER_ANIM_FRAME_DURATION;
        player.frame = (player.frame + 1) % 2;
      }
    }

    function drawTrailMarks(now) {
      const markW = 14;
      const markH = 6;
      for (const m of trailMarks) {
        const age = (now - m.t) / 1000;
        const life = 1 - age / TRAIL_MARK_LIFETIME;
        if (life <= 0) continue;
        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(m.angle);
        ctx.globalAlpha = life * 0.5;
        ctx.fillStyle = "#0a0f0a";
        ctx.fillRect(-markW / 2, -markH / 2, markW, markH);
        ctx.restore();
      }
    }

    function drawFloor() {
      for (let y = 0; y < ROOM_ROWS; y += 1) {
        for (let x = 0; x < ROOM_COLS; x += 1) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          if (floorLoaded) {
            ctx.drawImage(floorImage, 0, 0, floorImage.width, floorImage.height, px, py, TILE_SIZE, TILE_SIZE);
          } else {
            ctx.fillStyle = "#3d2817";
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
              ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, px, py, TILE_SIZE, TILE_SIZE);
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

    function drawBigPhilly() {
      if (!bigPhillyLoaded) return;
      const maxW = TILE_SIZE * 1.2;
      const maxH = TILE_SIZE * 1.2;
      const scale = Math.min(maxW / bigPhillyImage.width, maxH / bigPhillyImage.height);
      const dw = bigPhillyImage.width * scale;
      const dh = bigPhillyImage.height * scale;
      ctx.drawImage(bigPhillyImage, BIG_PHILLY_POS.x * TILE_SIZE - dw / 2, BIG_PHILLY_POS.y * TILE_SIZE - dh / 2, dw, dh);
    }

    function drawHeywood() {
      if (!heywoodLoaded) return;
      const maxW = TILE_SIZE * 1.1;
      const maxH = TILE_SIZE * 1.1;
      const scale = Math.min(maxW / heywoodImage.width, maxH / heywoodImage.height);
      const dw = heywoodImage.width * scale;
      const dh = heywoodImage.height * scale;
      ctx.drawImage(heywoodImage, HEYWOOD_POS.x * TILE_SIZE - dw / 2, HEYWOOD_POS.y * TILE_SIZE - dh / 2, dw, dh);
    }

    function drawPlayer() {
      if (!tankLoaded) return;
      const frameCount = 2;
      const frameIndex = player.frame % frameCount;
      const frameWidth = tankImage.width / frameCount;
      const frameHeight = tankImage.height;
      const sx = frameIndex * frameWidth;
      const sy = 0;
      const dw = frameWidth;
      const dh = frameHeight;
      ctx.save();
      ctx.translate(player.x, player.y);
      ctx.rotate(player.angle);
      const pivotBack = dw * 0.25;
      ctx.drawImage(tankImage, sx, sy, frameWidth, frameHeight, -dw / 2 + pivotBack, -dh / 2, dw, dh);
      ctx.restore();
    }

    // Store scene implementation for update/render
    window._scene2Impl = {
      stepPlayer,
      updateTrailMarks,
      updateAnimation,
      drawTrailMarks,
      drawFloor,
      drawWallsAndExit,
      drawBigPhilly,
      drawHeywood,
      drawPlayer,
      canvas,
      ctx,
    };
    if (statusEl) statusEl.textContent = "Find the glowing exit tile.";
    if (window.Dialogue) {
      const script = [
        { speaker: "Floyd", text: "Takin' bets today, Red?", portrait: "heywood" },
        { speaker: "Red", text: "Smokes or coins, bettor's choice.", portrait: "bigphilly" },
        { speaker: "Floyd", text: "Smokes. Put me down for two. That little sack o' boohshi, eighth from the front. He'll be first.", portrait: "heywood" },
        { speaker: "Red", text: "All right, who's your horse?", portrait: "bigphilly" },
        { speaker: "Heywood", text: "Aw, boohshi. I'll call that action. You out some smokes, son, let me tell you!", portrait: "heywood" },
        { speaker: "Floyd", text: "Well, Heywood, you so smart, you call it!", portrait: "heywood" },
        { speaker: "Heywood", text: "I'll take the chubby fat-bah there. Fifth from the front. Put me down for a quarter deck.", portrait: "heywood" },
        { speaker: "Red", text: "I had my money on Saw Tank. A tall drink of water with a silver spoon up his ass.", portrait: "bigphilly", thought: true },
        { speaker: "Red", text: "I didn't think much of Saw the first time I laid eyes on him. Looked like a stiff breeze would blow him over.", portrait: "bigphilly", thought: true },
        { speaker: "Red", text: "The first night's the toughest, no doubt about it. When those bars slam home, that's when you know it's for real.", portrait: "bigphilly", thought: true },
        { speaker: "Red", text: "A whole life blown away in the blink of an eye. I remember my first night. Seems like a long time ago.", portrait: "bigphilly", thought: true },
      ];
      window.Dialogue.start(script, {
        onComplete: () => { if (statusEl) statusEl.textContent = "Find the exit."; },
      });
    }
  }

  function update(dt) {
    const impl = window._scene2Impl;
    if (!impl) return;
    const now = performance.now();
    impl.stepPlayer(dt);
    impl.updateAnimation(dt);
    impl.updateTrailMarks(now);
  }

  function render() {
    const impl = window._scene2Impl;
    if (!impl || !impl.ctx || !impl.canvas) return;
    const now = performance.now();
    impl.ctx.clearRect(0, 0, impl.canvas.width, impl.canvas.height);
    impl.drawFloor();
    impl.drawTrailMarks(now);
    impl.drawBigPhilly();
    impl.drawHeywood();
    impl.drawWallsAndExit();
    impl.drawPlayer();
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene2 = { init, update, render };
})();
