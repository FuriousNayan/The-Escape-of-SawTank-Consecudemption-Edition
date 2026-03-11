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

  const input = { up: false, down: false, left: false, right: false };
  const KEY_MAP = {
    ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
    w: "up", s: "down", a: "left", d: "right",
    W: "up", S: "down", A: "left", D: "right",
  };

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
    input.up = input.down = input.left = input.right = false;

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
        { speaker: "Red", text: "I'm the guy who can get things. Smokes, playing cards, a little rock hammer.", portrait: "bigphilly" },
        { speaker: "Saw-Tank", text: "A rock hammer?", portrait: "sawTank_face" },
        { speaker: "Red", text: "For shaping rocks. Into chess pieces or what have you. Takes a while, but it'd keep your mind occupied.", portrait: "bigphilly" },
        { speaker: "Saw-Tank", text: "I'd like one.", portrait: "sawTank_face" },
        { speaker: "Red", text: "I'll see what I can do. Could take a couple of weeks. I'm a man who likes to plan ahead.", portrait: "bigphilly" },
        { speaker: "Red", text: "Most new fish are scared. Saw Tank wasn't. He had a quiet way about him. A walk and a talk that just wasn't normal around here.", portrait: "bigphilly", thought: true },
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

    if (inRedZone()) {
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
      const barRows = 3;
      for (let y = 0; y < barRows; y++) {
        for (let x = 0; x < Math.ceil(w / TILE_SIZE) + 1; x++) {
          ctx.drawImage(barsImage, 0, 0, barsImage.width, barsImage.height, x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }

    if (bigPhillyLoaded) {
      const maxW = TILE_SIZE * 1.5;
      const maxH = TILE_SIZE * 1.5;
      const scale = Math.min(maxW / bigPhillyImage.width, maxH / bigPhillyImage.height);
      const dw = bigPhillyImage.width * scale;
      const dh = bigPhillyImage.height * scale;
      ctx.drawImage(bigPhillyImage, 0, 0, bigPhillyImage.width, bigPhillyImage.height, 640 - dw / 2, 380 - dh / 2, dw, dh);
    }

    drawPlayer();

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = "14px system-ui";
    ctx.textAlign = "center";
    ctx.fillText("Walk to Red to continue", w / 2, h - 8);
  }

  window.Scenes = window.Scenes || {};
  window.Scenes.scene4 = { init, update, render };
})();
