(function () {
  const canvas = document.getElementById("pet");
  const context = canvas.getContext("2d");
  const sprite = new Image();

  const CELL_WIDTH = 192;
  const CELL_HEIGHT = 208;
  const FPS = 8;

  const rows = {
    idle: { row: 0, frames: 6 },
    dragRight: { row: 1, frames: 8 },
    dragLeft: { row: 2, frames: 8 },
    waving: { row: 3, frames: 4 },
    jumping: { row: 4, frames: 5 },
    failed: { row: 5, frames: 8 },
    waiting: { row: 6, frames: 6 },
    working: { row: 7, frames: 6 },
    review: { row: 8, frames: 6 }
  };

  let state = "idle";
  let frame = 0;
  let lastFrameAt = 0;
  let stateUntil = 0;
  let lastPointerX = 0;
  let lastPointerY = 0;
  let lastPointerAt = 0;
  let idleActionAt = Date.now() + 4000;
  let dragging = false;

  function setState(nextState, duration = 0) {
    if (!rows[nextState]) return;
    if (state !== nextState) {
      state = nextState;
      frame = 0;
    }
    stateUntil = duration > 0 ? Date.now() + duration : 0;
  }

  function draw(timestamp) {
    if (!sprite.complete || !sprite.naturalWidth) {
      requestAnimationFrame(draw);
      return;
    }

    const now = Date.now();
    if (stateUntil && now > stateUntil) {
      setState("idle");
    }

    if (state === "idle" && now > idleActionAt) {
      const next = Math.random() > 0.5 ? "waving" : "jumping";
      setState(next, next === "waving" ? 1200 : 1000);
      idleActionAt = now + 4500 + Math.random() * 5500;
    }

    const row = rows[state];
    if (!lastFrameAt || timestamp - lastFrameAt > 1000 / FPS) {
      frame = (frame + 1) % row.frames;
      lastFrameAt = timestamp;
    }

    context.clearRect(0, 0, CELL_WIDTH, CELL_HEIGHT);
    context.drawImage(
      sprite,
      frame * CELL_WIDTH,
      row.row * CELL_HEIGHT,
      CELL_WIDTH,
      CELL_HEIGHT,
      0,
      0,
      CELL_WIDTH,
      CELL_HEIGHT
    );

    requestAnimationFrame(draw);
  }

  canvas.addEventListener("pointerdown", (event) => {
    if (event.button === 2) return;
    dragging = true;
    canvas.setPointerCapture(event.pointerId);
    lastPointerX = event.screenX;
    lastPointerY = event.screenY;
    lastPointerAt = Date.now();
    setState("waving", 900);
  });

  canvas.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const now = Date.now();
    const dx = event.screenX - lastPointerX;
    const dy = event.screenY - lastPointerY;
    if (now - lastPointerAt < 300 && Math.abs(dx) > 2) {
      setState(dx >= 0 ? "dragRight" : "dragLeft", 500);
    }
    if (Math.abs(dx) || Math.abs(dy)) {
      window.butterDog.moveWindowBy(dx, dy);
    }
    lastPointerX = event.screenX;
    lastPointerY = event.screenY;
    lastPointerAt = now;
  });

  canvas.addEventListener("pointerup", (event) => {
    dragging = false;
    canvas.releasePointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointercancel", () => {
    dragging = false;
  });

  canvas.addEventListener("dblclick", () => {
    setState("jumping", 1200);
  });

  window.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    window.butterDog.showContextMenu();
  });

  sprite.src = "../assets/butter-dog-spritesheet.webp";
  sprite.onload = () => requestAnimationFrame(draw);
})();
