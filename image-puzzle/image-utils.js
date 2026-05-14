function createRng(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function createLevelArtwork(level, size = 480) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const palette = CATEGORIES[categoryIndex(level.categoryId)].colors;
  const rand = createRng(level.seed);

  const gradient = ctx.createLinearGradient(0, 0, size, size);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(.45, palette[1]);
  gradient.addColorStop(1, palette[2]);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 14; i++) {
    const radius = size * (.06 + rand() * .16);
    const x = rand() * size;
    const y = rand() * size;
    const fill = ctx.createRadialGradient(x, y, 0, x, y, radius);
    fill.addColorStop(0, `${palette[3]}88`);
    fill.addColorStop(1, `${palette[3]}00`);
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = "rgba(255,255,255,.36)";
  for (let i = 0; i < 5; i++) {
    ctx.lineWidth = 2 + rand() * 4;
    ctx.beginPath();
    ctx.moveTo(rand() * size, rand() * size);
    ctx.bezierCurveTo(rand() * size, rand() * size, rand() * size, rand() * size, rand() * size, rand() * size);
    ctx.stroke();
  }

  const title = `${level.size}x${level.size}`;
  ctx.fillStyle = "rgba(255,255,255,.78)";
  ctx.font = `800 ${Math.round(size * .14)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(title, size / 2, size / 2);

  ctx.strokeStyle = "rgba(255,255,255,.42)";
  ctx.lineWidth = 1.5;
  for (let i = 1; i < level.size; i++) {
    const pos = i * (size / level.size);
    ctx.beginPath();
    ctx.moveTo(pos, 0);
    ctx.lineTo(pos, size);
    ctx.moveTo(0, pos);
    ctx.lineTo(size, pos);
    ctx.stroke();
  }

  return canvas;
}

function drawImageFromDataUrl(canvas, dataUrl) {
  drawImageFromSource(canvas, dataUrl);
}

function drawImageFromSource(canvas, source) {
  const image = new Image();
  image.onload = () => {
    const ctx = canvas.getContext("2d");
    drawCoverImage(ctx, image, canvas.width, canvas.height);
  };
  image.src = source;
}

function createCanvasFromDataUrl(dataUrl, size) {
  return createCanvasFromSource(dataUrl, size);
}

function createCanvasFromImageUrl(imageUrl, size) {
  return createCanvasFromSource(imageUrl, size);
}

async function createOptimizedImageDataUrl(file, size = 960, quality = 0.82) {
  const objectUrl = URL.createObjectURL(file);
  try {
    const canvas = await createCanvasFromSource(objectUrl, size);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function createCanvasFromSource(source, size) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      drawCoverImage(ctx, image, size, size);
      resolve(canvas);
    };
    image.onerror = reject;
    image.src = source;
  });
}

function drawCoverImage(ctx, image, width, height) {
  ctx.clearRect(0, 0, width, height);
  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const sourceSize = Math.min(sourceWidth, sourceHeight);
  const sourceX = (sourceWidth - sourceSize) / 2;
  const sourceY = (sourceHeight - sourceSize) / 2;
  ctx.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, width, height);
}
