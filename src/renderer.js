const pet = document.getElementById('pet');
const sprite = document.getElementById('sprite');
const toast = document.getElementById('toast');

const CELL_WIDTH = 192;
const CELL_HEIGHT = 208;
const ATLAS_WIDTH = 1536;
const ATLAS_HEIGHT = 2288;

const animations = {
  idle: { row: 0, frames: [0, 1, 2, 3, 4, 5, 6], ms: 170 },
  runningRight: { row: 1, frames: [0, 1, 2, 3, 4, 5, 6, 7], ms: 82 },
  runningLeft: { row: 2, frames: [0, 1, 2, 3, 4, 5, 6, 7], ms: 82 },
  hoverWave: { row: 3, frames: [0, 1, 2, 3, 2, 1], ms: 140 },
  hoverJump: { row: 4, frames: [0, 1, 2, 3, 4, 3, 2, 1], ms: 105 },
  hungry: { row: 6, frames: [0, 1, 0, 1], ms: 180 },
  eating: { row: 7, frames: [0, 1, 2, 3, 4, 5, 4, 3, 2, 1], ms: 72 },
  failed: { row: 5, frames: [0, 1, 2, 3, 4, 5, 6, 7], ms: 120 }
};

const hoverAnimations = ['hoverWave', 'hoverJump'];

let currentAnimation = null;
let frameIndex = 0;
let timer = window.setInterval(tickSprite, animations.idle.ms);
let toastTimer;
let dragState;
let isPointerHovering = false;
let lastHoverAnimation = null;
let currentScale = 1;

initializeScale();
setAnimation('idle');

function tickSprite() {
  const animation = animations[currentAnimation];
  if (!animation) {
    return;
  }

  const frame = animation.frames[frameIndex % animation.frames.length];

  setSpriteCell(animation.row, frame);
  frameIndex += 1;
}

function setSpriteCell(row, column) {
  sprite.style.backgroundPosition = `${-column * CELL_WIDTH * currentScale}px ${-row * CELL_HEIGHT * currentScale}px`;
}

function setAnimation(name) {
  if (!animations[name]) {
    return;
  }

  if (currentAnimation === name) {
    return;
  }

  currentAnimation = name;
  frameIndex = 0;
  window.clearInterval(timer);
  timer = window.setInterval(tickSprite, animations[name].ms);
  tickSprite();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove('visible');
  }, 1800);
}

async function initializeScale() {
  applyPetScale(await window.butterDog.getScale());
  window.butterDog.onScaleChanged((scale) => {
    applyPetScale(scale);
  });
}

function applyPetScale(scale) {
  const numericScale = Number(scale);
  currentScale = Number.isFinite(numericScale) && numericScale > 0 ? numericScale : 1;
  document.documentElement.style.setProperty('--scale', String(currentScale));
  sprite.style.backgroundSize = `${ATLAS_WIDTH * currentScale}px ${ATLAS_HEIGHT * currentScale}px`;
  tickSprite();
}

function playRandomHoverAnimation() {
  const choices = hoverAnimations.filter((name) => name !== lastHoverAnimation);
  const pool = choices.length > 0 ? choices : hoverAnimations;
  const selected = pool[Math.floor(Math.random() * pool.length)];

  lastHoverAnimation = selected;
  setAnimation(selected);
}

function filePathsFromDrop(event) {
  return [...event.dataTransfer.files]
    .map((file) => window.butterDog.filePathFor(file))
    .filter(Boolean);
}

function setHungryState(enabled) {
  pet.classList.toggle('hungry', enabled);
  if (enabled) {
    setAnimation('hungry');
  } else if (currentAnimation === 'hungry' && !isPointerHovering) {
    setAnimation('idle');
  }
}

function playEatingFeedback() {
  pet.classList.remove('hungry');
  pet.classList.add('eating');
  setAnimation('eating');

  window.setTimeout(() => {
    pet.classList.remove('eating');
    setAnimation('idle');
  }, 1050);
}

function playFailedFeedback(message) {
  pet.classList.remove('hungry', 'eating');
  setAnimation('failed');
  showToast(message);

  window.setTimeout(() => {
    setAnimation('idle');
  }, 1100);
}

window.addEventListener('dragover', (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  setHungryState(true);
});

window.addEventListener('dragleave', (event) => {
  if (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= window.innerWidth || event.clientY >= window.innerHeight) {
    setHungryState(false);
  }
});

window.addEventListener('drop', async (event) => {
  event.preventDefault();
  const paths = filePathsFromDrop(event);

  if (paths.length === 0) {
    playFailedFeedback('没有读到文件路径');
    return;
  }

  playEatingFeedback();
  const result = await window.butterDog.trashFiles(paths);

  if (result.ok) {
    showToast(paths.length === 1 ? '吃掉 1 个文件' : `吃掉 ${paths.length} 个项目`);
    return;
  }

  const failed = result.results.filter((item) => !item.ok).length;
  playFailedFeedback(`${failed} 个项目没吃掉`);
});

pet.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) {
    return;
  }

  dragState = {
    startScreenX: event.screenX,
    startScreenY: event.screenY,
    startWindowX: window.screenX,
    startWindowY: window.screenY
  };

  pet.classList.add('dragging');
  pet.setPointerCapture(event.pointerId);
});

pet.addEventListener('pointermove', (event) => {
  if (!dragState) {
    return;
  }

  const deltaX = event.screenX - dragState.startScreenX;
  if (Math.abs(deltaX) > 4) {
    setAnimation(deltaX > 0 ? 'runningRight' : 'runningLeft');
  }

  window.butterDog.moveWindow({
    x: dragState.startWindowX + event.screenX - dragState.startScreenX,
    y: dragState.startWindowY + event.screenY - dragState.startScreenY
  });
});

pet.addEventListener('pointerup', (event) => {
  dragState = null;
  pet.classList.remove('dragging');
  pet.releasePointerCapture(event.pointerId);
  if (isPointerHovering) {
    playRandomHoverAnimation();
  } else {
    setAnimation('idle');
  }
});

pet.addEventListener('pointercancel', () => {
  dragState = null;
  pet.classList.remove('dragging');
  setAnimation('idle');
});

pet.addEventListener('pointerenter', (event) => {
  isPointerHovering = true;
  if (!dragState && !pet.classList.contains('hungry') && !pet.classList.contains('eating')) {
    playRandomHoverAnimation();
  }
});

pet.addEventListener('pointerleave', () => {
  isPointerHovering = false;
  if (!dragState && !pet.classList.contains('hungry') && !pet.classList.contains('eating')) {
    setAnimation('idle');
  }
});
