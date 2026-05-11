const screens = {
  home: document.getElementById("home-screen"),
  level: document.getElementById("level-screen"),
  game: document.getElementById("game-screen")
};

const els = {
  categoryList: document.getElementById("category-list"),
  totalStars: document.getElementById("total-stars"),
  clearedCount: document.getElementById("cleared-count"),
  recentThumbCanvas: document.getElementById("recent-thumb-canvas"),
  continueBtn: document.getElementById("continue-btn"),
  randomBtn: document.getElementById("random-btn"),
  uploadBtn: document.getElementById("upload-btn"),
  levelGrid: document.getElementById("level-grid"),
  levelTitle: document.getElementById("level-screen-title"),
  levelSubtitle: document.getElementById("level-screen-subtitle"),
  boardWrap: document.getElementById("board-wrap"),
  boardGrid: document.getElementById("board-grid"),
  board: document.getElementById("board"),
  previewCanvas: document.getElementById("preview-canvas"),
  previewToggle: document.getElementById("preview-toggle"),
  previewRow: document.getElementById("preview-row"),
  hintCanvas: document.getElementById("hint-canvas"),
  hintOverlay: document.getElementById("hint-overlay"),
  clearStars: document.getElementById("clear-stars"),
  summaryPanel: document.getElementById("summary-panel"),
  summaryTitle: document.getElementById("summary-title"),
  summaryText: document.getElementById("summary-text"),
  moveStat: document.getElementById("move-stat"),
  linkStat: document.getElementById("link-stat"),
  hintStat: document.getElementById("hint-stat"),
  starStat: document.getElementById("star-stat"),
  imageInput: document.getElementById("image-input"),
  gameTitle: document.getElementById("game-title"),
  gameSubtitle: document.getElementById("game-subtitle"),
  nextLevelBtn: document.getElementById("next-level-btn")
};

const state = {
  progress: loadProgress(),
  selectedCategoryId: "custom",
  selectedImageId: null,
  activeLevelId: null,
  sourceCanvas: null,
  puzzle: null,
  hintTimer: null
};
const CORRECT_SNAP_THRESHOLD_RATIO = 0.38;
const RELATIVE_SNAP_THRESHOLD_RATIO = 0.42;

function saveProgress() {
  saveProgressState(state.progress);
}

function customImages() {
  return state.progress.customImages || [];
}

function syncCustomImageSelection() {
  const images = customImages();
  if (!images.length) {
    state.progress.selectedCustomImageId = null;
    state.progress.customImage = null;
    state.progress.customImageName = null;
    return null;
  }

  if (!images.some((item) => item.id === state.progress.selectedCustomImageId)) {
    state.progress.selectedCustomImageId = images[images.length - 1].id;
  }

  const selected = images.find((item) => item.id === state.progress.selectedCustomImageId) || images[images.length - 1];
  state.progress.customImage = selected.dataUrl;
  state.progress.customImageName = selected.name;
  return selected;
}

function refreshCustomLevelData() {
  syncCustomImageSelection();
  if (typeof setCustomImages === "function") {
    setCustomImages(customImages());
  }
}

function availableRandomLevels() {
  return LEVELS.filter((level) => {
    if (level.categoryId !== "custom") return true;
    return customImages().length > 0;
  });
}

function levelById(levelId) {
  return LEVELS.find((level) => level.id === levelId);
}

function derivedImagesFromLevels() {
  const seen = new Set();
  return LEVELS.filter((level) => {
    const key = level.imageId || level.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).map((level, index) => ({
    id: level.imageId || level.id,
    categoryId: level.categoryId,
    name: level.name,
    image: level.image || (level.categoryId === "custom" ? state.progress.customImage : null),
    seed: level.seed || (100 + index)
  }));
}

function allImages() {
  if (typeof IMAGES !== "undefined" && Array.isArray(IMAGES) && IMAGES.length) {
    return IMAGES;
  }
  return derivedImagesFromLevels();
}

function imageRecordById(imageId) {
  if (typeof imageById === "function") {
    const image = imageById(imageId);
    if (image) return image;
  }
  return allImages().find((image) => image.id === imageId);
}

function imageLevels(imageId) {
  return LEVELS.filter((level) => (level.imageId || level.id) === imageId);
}

function categoryImages(categoryId) {
  return allImages().filter((image) => image.categoryId === categoryId);
}

function categoryLevels(categoryId) {
  return LEVELS.filter((level) => level.categoryId === categoryId);
}

function selectedCategory() {
  const categories = Array.isArray(CATEGORIES) && CATEGORIES.length ? CATEGORIES : [CUSTOM_CATEGORY];
  return categories.find((item) => item.id === state.selectedCategoryId) || categories[0];
}

function selectedImage() {
  const image = state.selectedImageId ? imageRecordById(state.selectedImageId) : null;
  return image && image.categoryId === state.selectedCategoryId ? image : null;
}

function showScreen(name) {
  Object.entries(screens).forEach(([key, node]) => {
    if (node) {
      node.classList.toggle("active", key === name);
    }
  });
}

function bindIfPresent(element, eventName, handler) {
  if (element) {
    element.addEventListener(eventName, handler);
  }
}

function syncHome() {
  const records = Object.values(state.progress.levels);
  const stars = records.reduce((sum, entry) => sum + (entry.stars || 0), 0);
  const cleared = records.filter((entry) => entry.cleared).length;
  const recent = levelById(state.progress.recentLevelId);
  els.totalStars.textContent = String(stars);
  els.clearedCount.textContent = String(cleared);
  els.continueBtn.disabled = !state.progress.ongoing;
  drawRecentThumbnail(recent);
  renderCategories();
}

function drawRecentThumbnail(level) {
  const canvas = els.recentThumbCanvas;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!level) {
    ctx.fillStyle = "#eadfce";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#8a7d72";
    ctx.font = "700 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NONE", canvas.width / 2, canvas.height / 2);
    return;
  }

  if (level.image) {
    drawImageFromSource(canvas, level.image);
    return;
  }

  const source = createLevelArtwork(level, canvas.width);
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
}

function renderCategories() {
  if (!els.categoryList) return;
  els.categoryList.innerHTML = "";
  const categories = Array.isArray(CATEGORIES) && CATEGORIES.length ? CATEGORIES : [CUSTOM_CATEGORY];
  categories.forEach((category) => {
    try {
      const categoryImageList = categoryImages(category.id);
      const cleared = categoryImageList.filter((image) =>
        imageLevels(image.id).some((level) => state.progress.levels[level.id]?.cleared)
      ).length;
      const button = document.createElement("button");
      const colors = Array.isArray(category.colors) && category.colors.length >= 4
        ? category.colors
        : ["#5b8def", "#8ed1fc", "#ffe29f", "#f76b1c"];
      button.className = "category-card hero";
      button.style.background = `linear-gradient(135deg, ${colors[0]}, ${colors[3]})`;
      const lockedByUpload = category.requiresUpload && customImages().length === 0;
      const emptyPack = !category.requiresUpload && categoryImageList.length === 0;
      button.innerHTML = `
        <div>
          <h3>${category.name || "카테고리"}</h3>
          <p>${lockedByUpload ? "이미지를 먼저 선택하세요" : emptyPack ? "이미지 팩이 비어 있습니다" : `${categoryImageList.length}개 이미지 · ${cleared}개 완료`}</p>
        </div>
        <span class="category-badge">${categoryImageList.length ? "3×3~6×6" : "0개"}</span>
      `;
      if (lockedByUpload || emptyPack) button.style.opacity = ".6";
      button.addEventListener("click", () => {
        if (lockedByUpload) {
          openImagePicker();
          return;
        }
        if (emptyPack) return;
        state.selectedCategoryId = category.id;
        state.selectedImageId = null;
        renderLevelSelect();
        showScreen("level");
      });
      els.categoryList.appendChild(button);
    } catch (error) {
      console.warn("Failed to render category", category?.id, error);
    }
  });
}

function renderLevelSelect() {
  const category = selectedCategory();
  if (!category || !els.levelGrid) return;
  const images = categoryImages(category.id);
  els.levelGrid.innerHTML = "";

  if (!images.length) {
    els.levelTitle.textContent = `${category.name} 이미지`;
    els.levelSubtitle.textContent = "이 카테고리에는 아직 이미지가 없습니다.";
    return;
  }

  const image = selectedImage();
  if (!image) {
    els.levelTitle.textContent = `${category.name} 이미지`;
    els.levelSubtitle.textContent = "이미지를 선택하면 다음 화면에서 난이도를 고를 수 있습니다.";
    images.forEach((imageItem) => {
      const levels = imageLevels(imageItem.id);
      const clearedCount = levels.filter((level) => state.progress.levels[level.id]?.cleared).length;
      const bestStars = levels.reduce((best, level) => Math.max(best, state.progress.levels[level.id]?.stars || 0), 0);
      const card = document.createElement("div");
      card.className = "level-card image-card";
      card.innerHTML = `
        <button class="image-card-main" type="button">
          <div class="level-thumb">
            <canvas width="140" height="140"></canvas>
          </div>
          <div class="level-meta">
            <strong>${imageItem.name}</strong>
            <span>${clearedCount} / ${levels.length} 난이도 완료</span>
            <div class="stars">${renderStars(bestStars)}</div>
          </div>
        </button>
        ${category.id === "custom" ? '<button class="image-delete-btn" type="button">삭제</button>' : ""}
      `;
      drawImageCardThumbnail(card.querySelector("canvas"), imageItem);
      card.querySelector(".image-card-main").addEventListener("click", () => {
        state.selectedImageId = imageItem.id;
        renderLevelSelect();
      });
      if (category.id === "custom") {
        card.querySelector(".image-delete-btn").addEventListener("click", () => {
          deleteCustomImage(imageItem.id);
        });
      }
      els.levelGrid.appendChild(card);
    });
    return;
  }

  const levels = imageLevels(image.id);
  const clearedCount = levels.filter((level) => state.progress.levels[level.id]?.cleared).length;
  const bestStars = levels.reduce((best, level) => Math.max(best, state.progress.levels[level.id]?.stars || 0), 0);
  const card = document.createElement("div");
  card.className = "level-card difficulty-card";
  card.innerHTML = `
    <div class="level-thumb">
      <canvas width="180" height="180"></canvas>
    </div>
    <div class="level-meta">
      <strong>${image.name}</strong>
      <span>${category.name} · ${clearedCount} / ${levels.length} 난이도 완료</span>
      <div class="stars">${renderStars(bestStars)}</div>
      <div class="difficulty-grid difficulty-choice-grid"></div>
    </div>
  `;
  els.levelTitle.textContent = image.name;
  els.levelSubtitle.textContent = "퍼즐 크기를 선택해서 시작합니다. 그리드는 나중에 더 확장할 수 있습니다.";
  drawImageCardThumbnail(card.querySelector("canvas"), image);
  const difficultyGrid = card.querySelector(".difficulty-grid");
  levels.forEach((level) => {
    const button = document.createElement("button");
    const record = state.progress.levels[level.id];
    button.className = `difficulty-btn difficulty-choice${record?.cleared ? " best" : ""}`;
    button.innerHTML = `
      <strong>${level.size}×${level.size}</strong>
      <span>${record?.cleared ? `${renderStars(record.stars || 0)} 완료` : "새 게임 시작"}</span>
    `;
    button.addEventListener("click", () => startLevel(level.id));
    difficultyGrid.appendChild(button);
  });
  els.levelGrid.appendChild(card);
}

function drawImageCardThumbnail(canvas, image) {
  if (image.image) {
    drawImageFromSource(canvas, image.image);
    return;
  }
  if (image.categoryId === "custom" && state.progress.customImage) {
    drawImageFromDataUrl(canvas, state.progress.customImage);
    return;
  }
  const source = createLevelArtwork({ ...image, size: 4 }, 140);
  canvas.getContext("2d").drawImage(source, 0, 0, canvas.width, canvas.height);
}

async function startLevel(levelId, resume = false) {
  const level = levelById(levelId);
  if (!level) return;
  if (level.categoryId === "custom" && customImages().length === 0) {
    openImagePicker();
    return;
  }
  state.selectedImageId = level.imageId || level.id;
  state.activeLevelId = levelId;
  state.sourceCanvas = level.categoryId === "custom" && state.progress.customImage
    ? await createCanvasFromDataUrl(state.progress.customImage, 480)
    : level.image
      ? await createCanvasFromImageUrl(level.image, 480)
      : createLevelArtwork(level, 480);
  state.puzzle = createPuzzleState(level, resume ? state.progress.ongoing : null);
  showScreen("game");
  renderGameFrame();
  requestAnimationFrame(() => {
    if (state.puzzle) layoutTiles();
  });
}

function createPuzzleState(level, ongoing) {
  const shuffleSeed = ongoing?.shuffleSeed ?? Date.now() + Math.floor(Math.random() * 100000);
  const puzzle = {
    level,
    size: level.size,
    tiles: [],
    moves: 0,
    linkedCount: 0,
    hintsUsed: 0,
    completed: false,
    nextLevelId: nextLevelFor(level.id),
    shuffleSeed
  };
  const boardPositions = [];
  for (let row = 0; row < level.size; row++) {
    for (let col = 0; col < level.size; col++) {
      boardPositions.push({ row, col });
    }
  }
  const shuffled = shuffleArray(boardPositions, shuffleSeed);
  if (!ongoing && shuffled.every((position, index) => position.row === boardPositions[index].row && position.col === boardPositions[index].col)) {
    [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
  }

  for (let row = 0; row < level.size; row++) {
    for (let col = 0; col < level.size; col++) {
      const index = row * level.size + col;
      const current = ongoing?.levelId === level.id ? ongoing.tiles[index] : shuffled[index];
      puzzle.tiles.push({
        id: index,
        correctRow: row,
        correctCol: col,
        row: current.row,
        col: current.col,
        group: index,
        element: null
      });
    }
  }

  if (ongoing?.levelId === level.id) {
    puzzle.moves = ongoing.moves || 0;
    puzzle.hintsUsed = ongoing.hintsUsed || 0;
  }

  computeLinks(puzzle);
  return puzzle;
}

function shuffleArray(items, seed) {
  const rand = createRng(seed);
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function renderGameFrame() {
  const puzzle = state.puzzle;
  const { level } = puzzle;
  els.gameTitle.textContent = level.name;
  els.gameSubtitle.textContent = `${level.size}×${level.size} · 링크 퍼즐`;
  els.boardGrid.style.setProperty("--grid-size", level.size);
  els.board.innerHTML = "";
  els.boardWrap.classList.remove("is-complete");
  els.nextLevelBtn.disabled = !puzzle.completed || !puzzle.nextLevelId;
  els.summaryPanel.classList.remove("completed");
  els.summaryPanel.classList.remove("expanded");
  els.previewToggle.textContent = "원본 보기 열기";
  els.summaryTitle.textContent = "원본 미리보기";
  els.summaryText.textContent = "힌트와 별개로 참고용 미리보기입니다. 필요할 때만 열어서 확인할 수 있습니다.";
  els.clearStars.textContent = "";
  els.clearStars.classList.remove("show");

  const sourceCtx = els.previewCanvas.getContext("2d");
  sourceCtx.clearRect(0, 0, els.previewCanvas.width, els.previewCanvas.height);
  sourceCtx.drawImage(state.sourceCanvas, 0, 0, els.previewCanvas.width, els.previewCanvas.height);
  const hintCtx = els.hintCanvas.getContext("2d");
  hintCtx.clearRect(0, 0, 480, 480);
  hintCtx.drawImage(state.sourceCanvas, 0, 0, 480, 480);

  const pieceSize = 480 / level.size;
  puzzle.tiles.forEach((tile) => {
    const tileNode = document.createElement("div");
    tileNode.className = "tile";
    tileNode.dataset.id = String(tile.id);
    const tileCanvas = document.createElement("canvas");
    tileCanvas.width = pieceSize;
    tileCanvas.height = pieceSize;
    tileCanvas.getContext("2d").drawImage(
      state.sourceCanvas,
      tile.correctCol * pieceSize,
      tile.correctRow * pieceSize,
      pieceSize,
      pieceSize,
      0,
      0,
      pieceSize,
      pieceSize
    );
    tileNode.appendChild(tileCanvas);
    tileNode.addEventListener("pointerdown", handlePointerDown);
    tile.element = tileNode;
    els.board.appendChild(tileNode);
  });

  updateStats();
  layoutTiles();
  persistOngoing();
}

function boardTileSize() {
  return els.boardWrap.clientWidth / state.puzzle.size;
}

function layoutTiles(activeDrag = null) {
  const size = boardTileSize();
  state.puzzle.tiles.forEach((tile) => {
    tile.element.style.width = `${size}px`;
    tile.element.style.height = `${size}px`;
    if (!activeDrag || !activeDrag.members.includes(tile)) {
      tile.element.style.left = `${tile.col * size}px`;
      tile.element.style.top = `${tile.row * size}px`;
    }
    tile.element.classList.toggle("correct", isCorrect(tile));
    tile.element.classList.toggle("linked", groupMembers(tile.group).length > 1);
  });
}

function updateStats() {
  const puzzle = state.puzzle;
  els.moveStat.textContent = String(puzzle.moves);
  els.linkStat.textContent = String(puzzle.linkedCount);
  els.hintStat.textContent = String(Math.max(0, 3 - puzzle.hintsUsed));
  els.starStat.textContent = renderStars(calculateStars(puzzle.moves, puzzle.hintsUsed, puzzle.size));
}

function isCorrect(tile) {
  return tile.row === tile.correctRow && tile.col === tile.correctCol;
}

function computeLinks(puzzle) {
  const parents = puzzle.tiles.map((tile) => tile.id);
  const find = (value) => {
    while (parents[value] !== value) {
      parents[value] = parents[parents[value]];
      value = parents[value];
    }
    return value;
  };
  const union = (a, b) => {
    const rootA = find(a);
    const rootB = find(b);
    if (rootA !== rootB) parents[rootB] = rootA;
  };

  puzzle.tiles.forEach((tile) => {
    puzzle.tiles.forEach((candidate) => {
      if (tile.id >= candidate.id) return;
      if (!areAdjacentInSource(tile, candidate)) return;
      if (hasMatchingRelativePosition(tile, candidate)) {
        union(tile.id, candidate.id);
      }
    });
  });

  const groupCounts = {};
  puzzle.tiles.forEach((tile) => {
    tile.group = find(tile.id);
    groupCounts[tile.group] = (groupCounts[tile.group] || 0) + 1;
  });
  puzzle.linkedCount = puzzle.tiles.filter((tile) => groupCounts[tile.group] > 1).length;
}

function groupMembers(groupId) {
  return state.puzzle.tiles.filter((tile) => tile.group === groupId);
}

function nextLevelFor(levelId) {
  const level = levelById(levelId);
  if (!level) return null;
  const imageKey = level.imageId || level.id;
  const image = imageRecordById(imageKey);
  if (!image) {
    const list = categoryLevels(level.categoryId);
    const index = list.findIndex((item) => item.id === levelId);
    return index >= 0 && index < list.length - 1 ? list[index + 1].id : null;
  }
  const images = categoryImages(level.categoryId);
  const index = images.findIndex((item) => item.id === image.id);
  if (index < 0 || index >= images.length - 1) return null;
  const nextImageLevels = imageLevels(images[index + 1].id);
  const sameSizeLevel = nextImageLevels.find((item) => item.size === level.size);
  return sameSizeLevel?.id || nextImageLevels[0]?.id || null;
}

function calculateStars(moves, hintsUsed, size) {
  if (hintsUsed >= 3) return 1;
  const optimal = size * size;
  if (hintsUsed === 0 && moves <= optimal * 1.7) return 3;
  if (hintsUsed <= 2 && moves <= optimal * 2.4) return 2;
  return 1;
}

function handlePointerDown(event) {
  if (state.puzzle.completed) return;
  const tileId = Number(event.currentTarget.dataset.id);
  const tile = state.puzzle.tiles.find((item) => item.id === tileId);
  const members = groupMembers(tile.group);
  const size = boardTileSize();
  const rect = els.boardWrap.getBoundingClientRect();
  const offsetX = event.clientX - rect.left - tile.col * size;
  const offsetY = event.clientY - rect.top - tile.row * size;

  state.puzzle.drag = {
    tile,
    members,
    offsetX,
    offsetY,
    originRow: tile.row,
    originCol: tile.col
  };

  members.forEach((item) => {
    item.element.classList.add("selected");
    item.element.style.zIndex = "20";
  });

  event.currentTarget.setPointerCapture(event.pointerId);
}

function handlePointerMove(event) {
  const drag = state.puzzle?.drag;
  if (!drag) return;
  const size = boardTileSize();
  const rect = els.boardWrap.getBoundingClientRect();
  const baseX = event.clientX - rect.left - drag.offsetX;
  const baseY = event.clientY - rect.top - drag.offsetY;

  drag.members.forEach((tile) => {
    const deltaRow = tile.row - drag.tile.row;
    const deltaCol = tile.col - drag.tile.col;
    tile.element.style.left = `${baseX + deltaCol * size}px`;
    tile.element.style.top = `${baseY + deltaRow * size}px`;
  });
}

function handlePointerUp(event) {
  const drag = state.puzzle?.drag;
  if (!drag) return;

  const size = boardTileSize();
  const rect = els.boardWrap.getBoundingClientRect();
  const baseX = event.clientX - rect.left - drag.offsetX;
  const baseY = event.clientY - rect.top - drag.offsetY;
  const snapTarget = getSnapTarget(drag, baseX, baseY, size);
  const targetCol = snapTarget.col;
  const targetRow = snapTarget.row;
  const diffRow = targetRow - drag.tile.row;
  const diffCol = targetCol - drag.tile.col;
  let moved = false;

  if (diffRow !== 0 || diffCol !== 0) {
    const projected = drag.members.map((tile) => ({
      tile,
      row: tile.row + diffRow,
      col: tile.col + diffCol
    }));
    const withinBounds = projected.every((item) => item.row >= 0 && item.row < state.puzzle.size && item.col >= 0 && item.col < state.puzzle.size);
    const overlappingTiles = getUniqueTiles(
      projected
        .map((item) => tileAt(item.row, item.col))
        .filter((tile) => tile && !drag.members.includes(tile))
    );

    if (withinBounds) {
      if (overlappingTiles.length === 0) {
        projected.forEach((item) => {
          item.tile.row = item.row;
          item.tile.col = item.col;
        });
        moved = true;
      } else if (tryMoveDraggedGroup(drag.members, projected, overlappingTiles)) {
        moved = true;
      }
    }
  }

  drag.members.forEach((item) => {
    item.element.classList.remove("selected");
    item.element.style.zIndex = "1";
  });
  state.puzzle.drag = null;

  if (moved) {
    state.puzzle.moves += 1;
    computeLinks(state.puzzle);
    updateStats();
    if (state.puzzle.linkedCount > 0) vibrate(14);
    persistOngoing();
  }

  layoutTiles();
  checkCompletion();
}

function tileAt(row, col) {
  return state.puzzle.tiles.find((tile) => tile.row === row && tile.col === col);
}

function getUniqueTiles(tiles) {
  return Array.from(new Map(tiles.map((tile) => [tile.id, tile])).values());
}

function getSnapTarget(drag, baseX, baseY, size) {
  const defaultCol = clamp(Math.round(baseX / size), 0, state.puzzle.size - 1);
  const defaultRow = clamp(Math.round(baseY / size), 0, state.puzzle.size - 1);
  const relativeTarget = getRelativeSnapTarget(drag, baseX, baseY, size);

  if (relativeTarget) {
    return relativeTarget;
  }

  if (drag.members.length !== 1) {
    return { row: defaultRow, col: defaultCol };
  }

  const correctX = drag.tile.correctCol * size;
  const correctY = drag.tile.correctRow * size;
  const distance = Math.hypot(baseX - correctX, baseY - correctY);
  const threshold = size * CORRECT_SNAP_THRESHOLD_RATIO;

  if (distance <= threshold) {
    return { row: drag.tile.correctRow, col: drag.tile.correctCol };
  }

  return { row: defaultRow, col: defaultCol };
}

function getRelativeSnapTarget(drag, baseX, baseY, size) {
  let bestTarget = null;
  let bestDistance = Infinity;

  drag.members.forEach((member) => {
    state.puzzle.tiles.forEach((candidate) => {
      if (drag.members.includes(candidate)) return;
      if (!areAdjacentInSource(member, candidate)) return;

      const requiredMemberRow = candidate.row + (member.correctRow - candidate.correctRow);
      const requiredMemberCol = candidate.col + (member.correctCol - candidate.correctCol);
      const requiredBaseRow = requiredMemberRow - (member.row - drag.tile.row);
      const requiredBaseCol = requiredMemberCol - (member.col - drag.tile.col);
      const desiredX = requiredBaseCol * size;
      const desiredY = requiredBaseRow * size;
      const distance = Math.hypot(baseX - desiredX, baseY - desiredY);

      if (distance > size * RELATIVE_SNAP_THRESHOLD_RATIO) return;
      if (distance >= bestDistance) return;

      bestDistance = distance;
      bestTarget = {
        row: clamp(requiredBaseRow, 0, state.puzzle.size - 1),
        col: clamp(requiredBaseCol, 0, state.puzzle.size - 1)
      };
    });
  });

  return bestTarget;
}

function areAdjacentInSource(a, b) {
  return Math.abs(a.correctRow - b.correctRow) + Math.abs(a.correctCol - b.correctCol) === 1;
}

function hasMatchingRelativePosition(a, b) {
  return (a.row - b.row) === (a.correctRow - b.correctRow)
    && (a.col - b.col) === (a.correctCol - b.correctCol);
}

function swapTiles(a, b) {
  const nextRow = a.row;
  const nextCol = a.col;
  a.row = b.row;
  a.col = b.col;
  b.row = nextRow;
  b.col = nextCol;
}

function cellKey(row, col) {
  return `${row}:${col}`;
}

function compareCells(a, b) {
  return a.row - b.row || a.col - b.col;
}

function compareTilesByPosition(a, b) {
  return a.row - b.row || a.col - b.col;
}

function tryMoveDraggedGroup(groupTiles, projected, overlappingTiles) {
  const blockerGroups = getBlockingGroups(overlappingTiles, groupTiles);
  const blockerTiles = blockerGroups.flat();
  const blockerTileIds = new Set(blockerTiles.map((tile) => tile.id));
  const stationaryTiles = state.puzzle.tiles.filter((tile) => !groupTiles.includes(tile) && !blockerTileIds.has(tile.id));
  const reservedCells = new Set(projected.map((item) => cellKey(item.row, item.col)));

  if (stationaryTiles.some((tile) => reservedCells.has(cellKey(tile.row, tile.col)))) {
    return false;
  }

  const freeCells = getFreeCells(reservedCells, stationaryTiles);
  const groupPlan = findGroupRelocationPlan(blockerGroups, freeCells);
  const fallbackPlan = groupPlan || findTileRelocationPlan(blockerTiles, freeCells);

  if (!fallbackPlan) {
    return false;
  }

  projected.forEach((item) => {
    item.tile.row = item.row;
    item.tile.col = item.col;
  });

  fallbackPlan.forEach((position, tileId) => {
    const tile = state.puzzle.tiles.find((item) => item.id === tileId);
    tile.row = position.row;
    tile.col = position.col;
  });

  return true;
}

function getBlockingGroups(overlappingTiles, draggedTiles) {
  const draggedIds = new Set(draggedTiles.map((tile) => tile.id));
  const blockerGroupIds = getUniqueTiles(overlappingTiles).map((tile) => tile.group);
  return Array.from(new Set(blockerGroupIds)).map((groupId) =>
    groupMembers(groupId).filter((tile) => !draggedIds.has(tile.id))
  );
}

function getFreeCells(reservedCells, stationaryTiles) {
  const blocked = new Set([
    ...reservedCells,
    ...stationaryTiles.map((tile) => cellKey(tile.row, tile.col))
  ]);
  const cells = [];
  for (let row = 0; row < state.puzzle.size; row++) {
    for (let col = 0; col < state.puzzle.size; col++) {
      const key = cellKey(row, col);
      if (!blocked.has(key)) {
        cells.push({ row, col });
      }
    }
  }
  return cells;
}

function findGroupRelocationPlan(groups, freeCells) {
  const sortedGroups = groups
    .filter((group) => group.length > 0)
    .sort((a, b) => b.length - a.length);
  const freeSet = new Set(freeCells.map((cell) => cellKey(cell.row, cell.col)));
  const plan = new Map();

  function backtrack(index) {
    if (index >= sortedGroups.length) return true;
    const group = sortedGroups[index];
    const placements = getGroupPlacementCandidates(group, freeSet);

    for (const placement of placements) {
      placement.forEach((position) => freeSet.delete(cellKey(position.row, position.col)));
      placement.forEach((position, tileId) => plan.set(tileId, position));
      if (backtrack(index + 1)) return true;
      placement.forEach((position) => freeSet.add(cellKey(position.row, position.col)));
      placement.forEach((_, tileId) => plan.delete(tileId));
    }
    return false;
  }

  return backtrack(0) ? plan : null;
}

function getGroupPlacementCandidates(group, freeSet) {
  const anchor = group.slice().sort(compareTilesByPosition)[0];
  const offsets = group.map((tile) => ({
    tileId: tile.id,
    rowOffset: tile.row - anchor.row,
    colOffset: tile.col - anchor.col
  }));
  const candidates = [];

  for (let row = 0; row < state.puzzle.size; row++) {
    for (let col = 0; col < state.puzzle.size; col++) {
      const placement = new Map();
      let valid = true;
      let distanceScore = 0;

      for (const offset of offsets) {
        const nextRow = row + offset.rowOffset;
        const nextCol = col + offset.colOffset;
        if (nextRow < 0 || nextRow >= state.puzzle.size || nextCol < 0 || nextCol >= state.puzzle.size) {
          valid = false;
          break;
        }
        if (!freeSet.has(cellKey(nextRow, nextCol))) {
          valid = false;
          break;
        }
        placement.set(offset.tileId, { row: nextRow, col: nextCol });
      }

      if (!valid) continue;

      group.forEach((tile) => {
        const next = placement.get(tile.id);
        distanceScore += Math.abs(tile.row - next.row) + Math.abs(tile.col - next.col);
      });
      candidates.push({ placement, distanceScore });
    }
  }

  return candidates
    .sort((a, b) => a.distanceScore - b.distanceScore)
    .map((entry) => entry.placement);
}

function findTileRelocationPlan(tiles, freeCells) {
  if (tiles.length > freeCells.length) return null;

  const sortedTiles = tiles.slice().sort(compareTilesByPosition);
  const sortedCells = freeCells
    .slice()
    .sort((a, b) => {
      const aScore = nearestDistanceScore(a, sortedTiles);
      const bScore = nearestDistanceScore(b, sortedTiles);
      return aScore - bScore || compareCells(a, b);
    });

  const plan = new Map();
  sortedTiles.forEach((tile, index) => {
    plan.set(tile.id, { row: sortedCells[index].row, col: sortedCells[index].col });
  });
  return plan;
}

function nearestDistanceScore(cell, tiles) {
  return Math.min(...tiles.map((tile) => Math.abs(tile.row - cell.row) + Math.abs(tile.col - cell.col)));
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function checkCompletion() {
  if (!state.puzzle.tiles.every(isCorrect)) return;
  state.puzzle.completed = true;
  completeLevel();
}

function completeLevel() {
  const stars = calculateStars(state.puzzle.moves, state.puzzle.hintsUsed, state.puzzle.size);
  const record = state.progress.levels[state.activeLevelId] || {};
  state.progress.levels[state.activeLevelId] = {
    cleared: true,
    stars: Math.max(record.stars || 0, stars),
    bestMoves: record.bestMoves ? Math.min(record.bestMoves, state.puzzle.moves) : state.puzzle.moves
  };
  state.progress.recentLevelId = state.activeLevelId;
  state.progress.ongoing = null;
  saveProgress();
  syncHome();
  renderLevelSelect();

  els.summaryPanel.classList.add("completed");
  els.boardWrap.classList.add("is-complete");
  els.summaryTitle.textContent = "완성";
  els.summaryText.textContent = `이동 ${state.puzzle.moves}회 · 힌트 ${state.puzzle.hintsUsed}회 · 연결 ${state.puzzle.linkedCount}개`;
  els.clearStars.textContent = renderStars(stars);
  els.clearStars.classList.add("show");
  els.nextLevelBtn.disabled = !state.puzzle.nextLevelId;
  vibrate([24, 40, 24]);
}

function persistOngoing() {
  if (!state.puzzle || state.puzzle.completed) return;
  state.progress.ongoing = {
    levelId: state.activeLevelId,
    moves: state.puzzle.moves,
    hintsUsed: state.puzzle.hintsUsed,
    shuffleSeed: state.puzzle.shuffleSeed,
    tiles: state.puzzle.tiles.map((tile) => ({ row: tile.row, col: tile.col }))
  };
  state.progress.recentLevelId = state.activeLevelId;
  saveProgress();
  syncHome();
}

function resetCurrentLevel() {
  startLevel(state.activeLevelId, false);
}

function showHint() {
  if (!state.puzzle || state.puzzle.hintsUsed >= 3 || state.puzzle.completed) return;
  state.puzzle.hintsUsed += 1;
  updateStats();
  persistOngoing();
  els.hintOverlay.classList.add("show");
  clearTimeout(state.hintTimer);
  state.hintTimer = setTimeout(() => {
    els.hintOverlay.classList.remove("show");
  }, 1500);
}

function togglePreviewPanel() {
  if (state.puzzle?.completed) return;
  const expanded = els.summaryPanel.classList.toggle("expanded");
  els.previewToggle.textContent = expanded ? "원본 보기 닫기" : "원본 보기 열기";
}

function vibrate(pattern) {
  if (navigator.vibrate) navigator.vibrate(pattern);
}

function goToNextLevel() {
  if (!state.puzzle.nextLevelId) return;
  startLevel(state.puzzle.nextLevelId, false);
}

function startRandomLevel() {
  const levels = availableRandomLevels();
  if (!levels.length) return;
  const randomLevel = levels[Math.floor(Math.random() * levels.length)];
  state.selectedCategoryId = randomLevel.categoryId;
  state.selectedImageId = randomLevel.imageId || randomLevel.id;
  startLevel(randomLevel.id, false);
}

function resetCategoryProgress() {
  const categoryId = state.selectedCategoryId;
  categoryLevels(categoryId).forEach((level) => delete state.progress.levels[level.id]);
  if (state.progress.ongoing && levelById(state.progress.ongoing.levelId)?.categoryId === categoryId) {
    state.progress.ongoing = null;
  }
  saveProgress();
  syncHome();
  renderLevelSelect();
}

function openImagePicker() {
  els.imageInput.click();
}

function playCurrentCustomImage() {
  const selectedImage = syncCustomImageSelection();
  if (!selectedImage) {
    openImagePicker();
    return;
  }
  state.selectedCategoryId = "custom";
  state.selectedImageId = selectedImage.id;
  renderLevelSelect();
  showScreen("level");
}

function deleteCustomImage(imageId) {
  const targetImageId = imageId || syncCustomImageSelection()?.id;
  if (!targetImageId) return;
  state.progress.customImages = customImages().filter((item) => item.id !== targetImageId);
  imageLevels(targetImageId).forEach((level) => delete state.progress.levels[level.id]);
  if (state.progress.ongoing && levelById(state.progress.ongoing.levelId)?.imageId === targetImageId) {
    state.progress.ongoing = null;
  }
  refreshCustomLevelData();
  state.selectedImageId = state.selectedCategoryId === "custom" ? null : state.selectedImageId;
  if (state.selectedCategoryId === "custom") {
    state.selectedCategoryId = CATEGORIES.find((category) => category.id !== "custom")?.id || "custom";
    if (customImages().length) {
      state.selectedCategoryId = "custom";
    }
  }
  saveProgress();
  syncHome();
  renderLevelSelect();
  showScreen("home");
}

function handleImageSelection(event) {
  const [file] = event.target.files || [];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const customImageId = `custom-upload-${Date.now()}`;
    state.progress.customImages = [
      ...customImages(),
      {
        id: customImageId,
        name: file.name,
        dataUrl: reader.result,
        createdAt: Date.now()
      }
    ];
    state.selectedCategoryId = "custom";
    state.progress.selectedCustomImageId = customImageId;
    state.selectedImageId = customImageId;
    if (state.progress.ongoing && levelById(state.progress.ongoing.levelId)?.categoryId === "custom") {
      state.progress.ongoing = null;
    }
    refreshCustomLevelData();
    saveProgress();
    syncHome();
    renderLevelSelect();
    showScreen("level");
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

function attachGlobalEvents() {
  document.addEventListener("pointermove", handlePointerMove);
  document.addEventListener("pointerup", handlePointerUp);
  window.addEventListener("resize", () => {
    if (state.puzzle) layoutTiles();
  });
  window.addEventListener("beforeunload", persistOngoing);

  bindIfPresent(els.uploadBtn, "click", openImagePicker);
  bindIfPresent(els.randomBtn, "click", startRandomLevel);
  bindIfPresent(els.imageInput, "change", handleImageSelection);
  bindIfPresent(els.continueBtn, "click", () => {
    if (!state.progress.ongoing) return;
    const ongoingLevel = levelById(state.progress.ongoing.levelId);
    if (!ongoingLevel) {
      state.progress.ongoing = null;
      saveProgress();
      syncHome();
      return;
    }
    state.selectedCategoryId = ongoingLevel.categoryId;
    state.selectedImageId = ongoingLevel.imageId || ongoingLevel.id;
    startLevel(state.progress.ongoing.levelId, true);
  });
  bindIfPresent(document.getElementById("back-home-btn"), "click", () => {
    if (state.selectedImageId) {
      state.selectedImageId = null;
      renderLevelSelect();
      return;
    }
    syncHome();
    showScreen("home");
  });
  bindIfPresent(document.getElementById("reset-category-btn"), "click", resetCategoryProgress);
  bindIfPresent(document.getElementById("game-back-btn"), "click", () => {
    persistOngoing();
    state.selectedImageId = state.puzzle?.level?.imageId || state.selectedImageId;
    renderLevelSelect();
    showScreen("level");
  });
  bindIfPresent(document.getElementById("restart-btn"), "click", resetCurrentLevel);
  bindIfPresent(document.getElementById("shuffle-btn"), "click", resetCurrentLevel);
  bindIfPresent(document.getElementById("hint-btn"), "click", showHint);
  bindIfPresent(els.previewToggle, "click", togglePreviewPanel);
  bindIfPresent(els.hintOverlay, "click", () => els.hintOverlay.classList.remove("show"));
  bindIfPresent(els.nextLevelBtn, "click", goToNextLevel);
}

async function boot() {
  await initializeLevelData();
  refreshCustomLevelData();
  attachGlobalEvents();
  syncHome();
}

boot();
