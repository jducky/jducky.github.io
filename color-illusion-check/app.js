const imageInput = document.getElementById("image-input");
const resetBtn = document.getElementById("reset-btn");
const cropModeBtn = document.getElementById("crop-mode-btn");
const demoBtn = document.getElementById("demo-btn");
const imageCanvas = document.getElementById("image-canvas");
const imageCtx = imageCanvas.getContext("2d");
const compareCanvas = document.getElementById("compare-canvas");
const compareCtx = compareCanvas.getContext("2d");
const cropSelection = document.getElementById("crop-selection");
const overlayStrip = document.getElementById("overlay-strip");
const overlayCanvas = document.getElementById("overlay-canvas");
const overlayCtx = overlayCanvas.getContext("2d");
const emptyState = document.getElementById("empty-state");
const canvasWrap = document.getElementById("canvas-wrap");
const cursorIndicator = document.getElementById("cursor-indicator");
const stageHelp = document.getElementById("stage-help");
const modeIndicatorTitle = document.getElementById("mode-indicator-title");
const modeIndicatorText = document.getElementById("mode-indicator-text");
const modeButtons = Array.from(document.querySelectorAll(".mode-btn"));

const state = {
  image: null,
  naturalWidth: 0,
  naturalHeight: 0,
  sourceCanvas: null,
  viewMode: "original",
  points: [],
  sampleRadius: 8,
  renderBox: null,
  cropMode: false,
  cropDrag: null,
  overlay: {
    visible: false,
    relX: 0.08,
    relY: 0.08,
    width: 0,
    height: 0,
    dragging: false,
    dragOffsetX: 0,
    dragOffsetY: 0
  }
};

const output = {
  swatchA: document.getElementById("swatch-a"),
  swatchB: document.getElementById("swatch-b"),
  hexA: document.getElementById("hex-a"),
  hexB: document.getElementById("hex-b"),
  rgbA: document.getElementById("rgb-a"),
  rgbB: document.getElementById("rgb-b"),
  distanceValue: document.getElementById("distance-value"),
  distanceText: document.getElementById("distance-text"),
  verdictValue: document.getElementById("verdict-value"),
  verdictText: document.getElementById("verdict-text")
};

function showDemoGuide() {
  state.image = null;
  state.sourceCanvas = null;
  state.points = [];
  emptyState.hidden = true;
  imageCanvas.width = 900;
  imageCanvas.height = 900;
  imageCtx.clearRect(0, 0, imageCanvas.width, imageCanvas.height);
  imageCtx.fillStyle = "#f4efdf";
  imageCtx.fillRect(0, 0, imageCanvas.width, imageCanvas.height);
  imageCtx.fillStyle = "#1f1c17";
  imageCtx.font = "700 52px Space Grotesk";
  imageCtx.fillText("1", 120, 180);
  imageCtx.fillText("2", 120, 500);
  imageCtx.font = "600 36px IBM Plex Sans KR";
  imageCtx.fillText("착시 이미지를 올린 뒤 위 얼굴을 클릭", 210, 170);
  imageCtx.fillText("아래 얼굴을 클릭하면 평균색 비교", 210, 490);
  imageCtx.strokeStyle = "#d45d39";
  imageCtx.lineWidth = 8;
  imageCtx.beginPath();
  imageCtx.arc(172, 148, 32, 0, Math.PI * 2);
  imageCtx.stroke();
  imageCtx.strokeStyle = "#127d78";
  imageCtx.beginPath();
  imageCtx.arc(172, 468, 32, 0, Math.PI * 2);
  imageCtx.stroke();
  imageCtx.fillStyle = "#625a52";
  imageCtx.font = "500 28px IBM Plex Sans KR";
  imageCtx.fillText("오른쪽 패널이 두 색을 같은 배경에서 다시 보여줍니다.", 120, 760);
  renderComparePlaceholder();
}

function renderComparePlaceholder() {
  compareCtx.clearRect(0, 0, compareCanvas.width, compareCanvas.height);
  compareCtx.fillStyle = "#d4d0c8";
  compareCtx.fillRect(0, 0, compareCanvas.width, compareCanvas.height);
  compareCtx.fillStyle = "#4a433d";
  compareCtx.font = "600 24px IBM Plex Sans KR";
  compareCtx.fillText("A와 B를 선택하면 여기에 비교 패치가 표시됩니다.", 32, 70);
  compareCtx.font = "500 18px IBM Plex Sans KR";
  compareCtx.fillText("같은 회색 배경 위에서 보면 색 차이를 더 정확히 볼 수 있습니다.", 32, 108);
}

function resetReadout() {
  output.swatchA.style.background = "";
  output.swatchB.style.background = "";
  output.hexA.textContent = "HEX -";
  output.hexB.textContent = "HEX -";
  output.rgbA.textContent = "RGB -";
  output.rgbB.textContent = "RGB -";
  output.distanceValue.textContent = "-";
  output.distanceText.textContent = "두 점을 선택하면 계산됩니다.";
  output.verdictValue.textContent = "대기 중";
  output.verdictText.textContent = "같은 배경에서 다시 보면 더 잘 드러납니다.";
  renderComparePlaceholder();
}

function loadImageFromFile(file) {
  if (!file || !file.type.startsWith("image/")) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth;
      sourceCanvas.height = image.naturalHeight;
      sourceCanvas.getContext("2d").drawImage(image, 0, 0);
      state.image = image;
      state.sourceCanvas = sourceCanvas;
      state.naturalWidth = image.naturalWidth;
      state.naturalHeight = image.naturalHeight;
      state.points = [];
      state.overlay.relX = 0.08;
      state.overlay.relY = 0.08;
      state.cropMode = false;
      state.cropDrag = null;
      emptyState.hidden = true;
      syncCropModeUi();
      resetReadout();
      renderImageCanvas();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function fitImage(width, height, canvasWidth, canvasHeight) {
  const scale = Math.min(canvasWidth / width, canvasHeight / height);
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = (canvasHeight - drawHeight) / 2;
  return { drawWidth, drawHeight, offsetX, offsetY, scale };
}

function canvasSizeFromContainer() {
  const maxWidth = imageCanvas.parentElement.clientWidth;
  const width = Math.max(320, Math.floor(maxWidth));
  const height = Math.max(360, Math.floor(Math.min(width * 1.08, window.innerHeight * 0.72)));
  return { width, height };
}

function renderImageCanvas() {
  if (!state.image) return;
  const { width, height } = canvasSizeFromContainer();
  imageCanvas.width = width;
  imageCanvas.height = height;
  imageCtx.clearRect(0, 0, width, height);
  imageCtx.fillStyle = "#e9dfcf";
  imageCtx.fillRect(0, 0, width, height);

  const box = fitImage(state.naturalWidth, state.naturalHeight, width, height);
  state.renderBox = box;
  imageCtx.drawImage(state.image, box.offsetX, box.offsetY, box.drawWidth, box.drawHeight);

  if (state.viewMode === "focus" && state.points.length) {
    imageCtx.save();
    imageCtx.fillStyle = "rgba(20, 18, 16, 0.42)";
    imageCtx.fillRect(box.offsetX, box.offsetY, box.drawWidth, box.drawHeight);
    state.points.forEach((point) => {
      const x = box.offsetX + point.x * box.scale;
      const y = box.offsetY + point.y * box.scale;
      imageCtx.save();
      imageCtx.beginPath();
      imageCtx.arc(x, y, 42, 0, Math.PI * 2);
      imageCtx.clip();
      imageCtx.drawImage(state.image, box.offsetX, box.offsetY, box.drawWidth, box.drawHeight);
      imageCtx.restore();
    });
    imageCtx.restore();
  }

  state.points.forEach((point, index) => drawMarker(point, index, box));
  positionOverlayStrip();
}

function syncCropModeUi() {
  cropModeBtn.classList.toggle("active", state.cropMode);
  canvasWrap.classList.toggle("is-crop-mode", state.cropMode);
  stageHelp.textContent = state.cropMode
    ? "크롭 오버레이 모드입니다. 이미지 위를 드래그해 잘라낸 뒤 이동할 수 있습니다."
    : "첫 클릭은 A, 두 번째 클릭은 B입니다. 다시 클릭하면 순서대로 갱신됩니다.";
  modeIndicatorTitle.textContent = state.cropMode ? "크롭 모드" : "포인트 모드";
  modeIndicatorText.textContent = state.cropMode
    ? "드래그해서 잘라낼 영역을 지정"
    : "클릭해서 A/B 색 포인트를 선택";
}

function updateCursorIndicator(event) {
  if (!state.image || !state.renderBox) {
    cursorIndicator.hidden = true;
    return;
  }
  const point = eventToImagePoint(event);
  if (!point) {
    cursorIndicator.hidden = true;
    return;
  }
  const rect = canvasWrap.getBoundingClientRect();
  cursorIndicator.hidden = false;
  cursorIndicator.style.left = `${event.clientX - rect.left}px`;
  cursorIndicator.style.top = `${event.clientY - rect.top}px`;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function buildOverlayStripFromCrop(crop) {
  if (!crop || !state.sourceCanvas || !state.renderBox) {
    overlayStrip.hidden = true;
    state.overlay.visible = false;
    return;
  }

  const cropWidth = Math.max(1, crop.width);
  const cropHeight = Math.max(1, crop.height);
  const cropX = clamp(crop.x, 0, state.naturalWidth - cropWidth);
  const cropY = clamp(crop.y, 0, state.naturalHeight - cropHeight);

  overlayCanvas.width = cropWidth;
  overlayCanvas.height = cropHeight;
  overlayCtx.clearRect(0, 0, cropWidth, cropHeight);
  overlayCtx.drawImage(
    state.sourceCanvas,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  state.overlay.width = cropWidth * state.renderBox.scale;
  state.overlay.height = cropHeight * state.renderBox.scale;
  state.overlay.relX = cropX / state.naturalWidth;
  state.overlay.relY = cropY / state.naturalHeight;
  overlayStrip.style.width = `${state.overlay.width}px`;
  overlayStrip.hidden = false;
  state.overlay.visible = true;
  positionOverlayStrip();
}

function positionOverlayStrip() {
  if (!state.overlay.visible || !state.renderBox) return;
  const correctedMaxX = Math.max(0, imageCanvas.width - state.overlay.width);
  const maxY = Math.max(0, imageCanvas.height - state.overlay.height);
  const left = clamp(
    state.renderBox.offsetX + state.renderBox.drawWidth * state.overlay.relX,
    0,
    correctedMaxX
  );
  const top = clamp(
    state.renderBox.offsetY + state.renderBox.drawHeight * state.overlay.relY,
    0,
    maxY
  );
  overlayStrip.style.left = `${left}px`;
  overlayStrip.style.top = `${top}px`;
}

function moveOverlayStrip(clientX, clientY) {
  if (!state.renderBox) return;
  const wrapRect = canvasWrap.getBoundingClientRect();
  const maxX = Math.max(0, imageCanvas.width - state.overlay.width);
  const maxY = Math.max(0, imageCanvas.height - state.overlay.height);
  const left = clamp(clientX - wrapRect.left - state.overlay.dragOffsetX, 0, maxX);
  const top = clamp(clientY - wrapRect.top - state.overlay.dragOffsetY, 0, maxY);
  overlayStrip.style.left = `${left}px`;
  overlayStrip.style.top = `${top}px`;
  state.overlay.relX = state.renderBox.drawWidth
    ? (left - state.renderBox.offsetX) / state.renderBox.drawWidth
    : 0;
  state.overlay.relY = state.renderBox.drawHeight
    ? (top - state.renderBox.offsetY) / state.renderBox.drawHeight
    : 0;
}

function canvasEventPosition(event) {
  const rect = imageCanvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left) * (imageCanvas.width / rect.width),
    y: (event.clientY - rect.top) * (imageCanvas.height / rect.height)
  };
}

function clampCanvasPosition(position) {
  if (!state.renderBox) return position;
  return {
    x: clamp(position.x, state.renderBox.offsetX, state.renderBox.offsetX + state.renderBox.drawWidth),
    y: clamp(position.y, state.renderBox.offsetY, state.renderBox.offsetY + state.renderBox.drawHeight)
  };
}

function updateCropSelectionUi(selection) {
  cropSelection.hidden = false;
  cropSelection.style.left = `${selection.left}px`;
  cropSelection.style.top = `${selection.top}px`;
  cropSelection.style.width = `${selection.width}px`;
  cropSelection.style.height = `${selection.height}px`;
}

function clearCropSelectionUi() {
  cropSelection.hidden = true;
}

function cropSelectionToImageRect(selection) {
  if (!state.renderBox) return null;
  const width = Math.round(selection.width / state.renderBox.scale);
  const height = Math.round(selection.height / state.renderBox.scale);
  const x = Math.round((selection.left - state.renderBox.offsetX) / state.renderBox.scale);
  const y = Math.round((selection.top - state.renderBox.offsetY) / state.renderBox.scale);
  if (width < 4 || height < 4) return null;
  return {
    x: clamp(x, 0, state.naturalWidth - width),
    y: clamp(y, 0, state.naturalHeight - height),
    width,
    height
  };
}

function drawMarker(point, index, box) {
  const x = box.offsetX + point.x * box.scale;
  const y = box.offsetY + point.y * box.scale;
  const label = index === 0 ? "A" : "B";
  const color = index === 0 ? "#d45d39" : "#127d78";
  imageCtx.save();
  imageCtx.strokeStyle = "#ffffff";
  imageCtx.lineWidth = 4;
  imageCtx.beginPath();
  imageCtx.arc(x, y, 10, 0, Math.PI * 2);
  imageCtx.stroke();
  imageCtx.strokeStyle = color;
  imageCtx.lineWidth = 3;
  imageCtx.beginPath();
  imageCtx.arc(x, y, 14, 0, Math.PI * 2);
  imageCtx.stroke();
  imageCtx.fillStyle = color;
  imageCtx.fillRect(x + 16, y - 20, 30, 24);
  imageCtx.fillStyle = "#fff";
  imageCtx.font = "700 14px Space Grotesk";
  imageCtx.fillText(label, x + 27, y - 4);
  imageCtx.restore();
}

function eventToImagePoint(event) {
  if (!state.image || !state.renderBox) return null;
  const rect = imageCanvas.getBoundingClientRect();
  const canvasX = (event.clientX - rect.left) * (imageCanvas.width / rect.width);
  const canvasY = (event.clientY - rect.top) * (imageCanvas.height / rect.height);
  const { offsetX, offsetY, drawWidth, drawHeight, scale } = state.renderBox;
  if (
    canvasX < offsetX || canvasX > offsetX + drawWidth ||
    canvasY < offsetY || canvasY > offsetY + drawHeight
  ) {
    return null;
  }
  return {
    x: (canvasX - offsetX) / scale,
    y: (canvasY - offsetY) / scale
  };
}

function sampleAverageColor(x, y, radius) {
  if (!state.sourceCanvas) return { r: 0, g: 0, b: 0 };
  const ctx = state.sourceCanvas.getContext("2d", { willReadFrequently: true });
  const left = Math.max(0, Math.floor(x - radius));
  const top = Math.max(0, Math.floor(y - radius));
  const size = Math.max(1, Math.min(radius * 2 + 1, state.naturalWidth - left, state.naturalHeight - top));
  const data = ctx.getImageData(left, top, size, size).data;
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += 4) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count += 1;
  }
  return {
    r: Math.round(r / count),
    g: Math.round(g / count),
    b: Math.round(b / count)
  };
}

function colorToHex(color) {
  return `#${[color.r, color.g, color.b].map((value) => value.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function rgbDistance(a, b) {
  return Math.sqrt(
    ((a.r - b.r) ** 2) +
    ((a.g - b.g) ** 2) +
    ((a.b - b.b) ** 2)
  );
}

function setPoint(point) {
  const color = sampleAverageColor(point.x, point.y, state.sampleRadius);
  const enriched = { ...point, color };
  if (state.points.length < 2) {
    state.points.push(enriched);
  } else {
    state.points.shift();
    state.points.push(enriched);
  }
  renderImageCanvas();
  renderReadout();
}

function renderReadout() {
  const [a, b] = state.points;
  if (!a) {
    resetReadout();
    return;
  }

  output.swatchA.style.background = colorToHex(a.color);
  output.hexA.textContent = `HEX ${colorToHex(a.color)}`;
  output.rgbA.textContent = `RGB ${a.color.r}, ${a.color.g}, ${a.color.b}`;

  if (!b) {
    output.swatchB.style.background = "";
    output.hexB.textContent = "HEX -";
    output.rgbB.textContent = "RGB -";
    output.distanceValue.textContent = "-";
    output.distanceText.textContent = "B 포인트를 찍으면 두 색을 비교합니다.";
    output.verdictValue.textContent = "A 선택됨";
    output.verdictText.textContent = "이제 아래쪽 얼굴 지점을 찍어 주세요.";
    renderComparePlaceholder();
    return;
  }

  output.swatchB.style.background = colorToHex(b.color);
  output.hexB.textContent = `HEX ${colorToHex(b.color)}`;
  output.rgbB.textContent = `RGB ${b.color.r}, ${b.color.g}, ${b.color.b}`;

  const distance = rgbDistance(a.color, b.color);
  output.distanceValue.textContent = distance.toFixed(1);
  output.distanceText.textContent = "0에 가까울수록 두 평균색이 비슷합니다.";

  if (distance < 12) {
    output.verdictValue.textContent = "거의 같은 색";
    output.verdictText.textContent = "주변 밝기 대비 때문에 다르게 보이는 전형적인 착시로 설명할 수 있습니다.";
  } else if (distance < 24) {
    output.verdictValue.textContent = "매우 비슷한 색";
    output.verdictText.textContent = "육안보다 수치 차이가 작다면 배경 영향이 큰 사례입니다.";
  } else {
    output.verdictValue.textContent = "차이가 보임";
    output.verdictText.textContent = "클릭 위치를 조금 조정하거나 샘플 반경을 줄여 같은 영역만 다시 찍어 보세요.";
  }

  renderCompareCanvas(a, b, distance);
}

function renderCompareCanvas(a, b, distance) {
  compareCtx.clearRect(0, 0, compareCanvas.width, compareCanvas.height);
  compareCtx.fillStyle = "#c8c5c0";
  compareCtx.fillRect(0, 0, compareCanvas.width, compareCanvas.height);

  compareCtx.fillStyle = "#403a34";
  compareCtx.font = "700 24px Space Grotesk";
  compareCtx.fillText("A", 72, 52);
  compareCtx.fillText("B", 366, 52);

  compareCtx.fillStyle = colorToHex(a.color);
  compareCtx.fillRect(50, 72, 220, 120);
  compareCtx.fillStyle = colorToHex(b.color);
  compareCtx.fillRect(344, 72, 220, 120);

  const blend = {
    r: Math.round((a.color.r + b.color.r) / 2),
    g: Math.round((a.color.g + b.color.g) / 2),
    b: Math.round((a.color.b + b.color.b) / 2)
  };
  compareCtx.fillStyle = colorToHex(blend);
  compareCtx.fillRect(220, 206, 174, 28);

  compareCtx.fillStyle = "#403a34";
  compareCtx.font = "600 18px IBM Plex Sans KR";
  compareCtx.fillText(`A ${colorToHex(a.color)}`, 50, 220);
  compareCtx.fillText(`B ${colorToHex(b.color)}`, 344, 220);
  compareCtx.fillText(`중간 기준색 ${colorToHex(blend)} / 거리 ${distance.toFixed(1)}`, 50, 248);
}

function setMode(mode) {
  state.viewMode = mode;
  modeButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === mode);
  });
  if (state.image) renderImageCanvas();
}

imageInput.addEventListener("change", (event) => {
  const file = event.target.files?.[0];
  if (file) loadImageFromFile(file);
  event.target.value = "";
});

imageCanvas.addEventListener("pointerdown", (event) => {
  if (!state.image || !state.renderBox) return;
  if (state.cropMode) {
    const start = clampCanvasPosition(canvasEventPosition(event));
    state.cropDrag = {
      pointerId: event.pointerId,
      start,
      current: start
    };
    updateCropSelectionUi({
      left: start.x,
      top: start.y,
      width: 0,
      height: 0
    });
    imageCanvas.setPointerCapture(event.pointerId);
    return;
  }

  const point = eventToImagePoint(event);
  if (!point) return;
  setPoint(point);
});

imageCanvas.addEventListener("pointermove", (event) => {
  updateCursorIndicator(event);
  if (!state.cropDrag || state.cropDrag.pointerId !== event.pointerId) return;
  const current = clampCanvasPosition(canvasEventPosition(event));
  state.cropDrag.current = current;
  updateCropSelectionUi({
    left: Math.min(state.cropDrag.start.x, current.x),
    top: Math.min(state.cropDrag.start.y, current.y),
    width: Math.abs(current.x - state.cropDrag.start.x),
    height: Math.abs(current.y - state.cropDrag.start.y)
  });
});

imageCanvas.addEventListener("pointerup", (event) => {
  if (!state.cropDrag || state.cropDrag.pointerId !== event.pointerId) return;
  const current = clampCanvasPosition(canvasEventPosition(event));
  const selection = {
    left: Math.min(state.cropDrag.start.x, current.x),
    top: Math.min(state.cropDrag.start.y, current.y),
    width: Math.abs(current.x - state.cropDrag.start.x),
    height: Math.abs(current.y - state.cropDrag.start.y)
  };
  clearCropSelectionUi();
  state.cropDrag = null;
  try {
    imageCanvas.releasePointerCapture(event.pointerId);
  } catch (error) {
    // ignore
  }
  const crop = cropSelectionToImageRect(selection);
  if (crop) {
    buildOverlayStripFromCrop(crop);
  }
});

imageCanvas.addEventListener("pointercancel", (event) => {
  if (!state.cropDrag || state.cropDrag.pointerId !== event.pointerId) return;
  state.cropDrag = null;
  clearCropSelectionUi();
});

imageCanvas.addEventListener("mouseenter", updateCursorIndicator);
imageCanvas.addEventListener("mouseleave", () => {
  cursorIndicator.hidden = true;
  clearCropSelectionUi();
});

overlayStrip.addEventListener("pointerdown", (event) => {
  state.overlay.dragging = true;
  const rect = overlayStrip.getBoundingClientRect();
  state.overlay.dragOffsetX = event.clientX - rect.left;
  state.overlay.dragOffsetY = event.clientY - rect.top;
  overlayStrip.setPointerCapture(event.pointerId);
});

overlayStrip.addEventListener("pointermove", (event) => {
  if (!state.overlay.dragging) return;
  moveOverlayStrip(event.clientX, event.clientY);
});

overlayStrip.addEventListener("pointerup", (event) => {
  state.overlay.dragging = false;
  try {
    overlayStrip.releasePointerCapture(event.pointerId);
  } catch (error) {
    // ignore
  }
});

overlayStrip.addEventListener("pointercancel", () => {
  state.overlay.dragging = false;
});

resetBtn.addEventListener("click", () => {
  state.points = [];
  overlayStrip.hidden = true;
  state.overlay.visible = false;
  resetReadout();
  if (state.image) {
    renderImageCanvas();
  } else {
    emptyState.hidden = false;
  }
});

cropModeBtn.addEventListener("click", () => {
  state.cropMode = !state.cropMode;
  state.cropDrag = null;
  clearCropSelectionUi();
  syncCropModeUi();
});

demoBtn.addEventListener("click", showDemoGuide);

modeButtons.forEach((button) => {
  button.addEventListener("click", () => setMode(button.dataset.mode));
});

window.addEventListener("resize", () => {
  if (state.image) renderImageCanvas();
});

window.addEventListener("paste", (event) => {
  const file = Array.from(event.clipboardData?.items || [])
    .find((item) => item.type.startsWith("image/"))
    ?.getAsFile();
  if (file) loadImageFromFile(file);
});

window.addEventListener("dragover", (event) => {
  event.preventDefault();
});

window.addEventListener("drop", (event) => {
  event.preventDefault();
  const file = Array.from(event.dataTransfer?.files || []).find((entry) => entry.type.startsWith("image/"));
  if (file) loadImageFromFile(file);
});

resetReadout();
syncCropModeUi();
