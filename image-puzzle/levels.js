const CUSTOM_CATEGORY = {
  id: "custom",
  name: "내 이미지",
  colors: ["#4e5bf2", "#7bc9ff", "#ffe08a", "#f56f52"],
  requiresUpload: true
};

let CATEGORIES = [CUSTOM_CATEGORY];
let IMAGES = [];
let LEVELS = [];
const DIFFICULTIES = [3, 4, 5, 6];
let PACK_CATEGORIES = [];

function buildCustomImages(customImages = []) {
  return customImages.map((customImage, index) => ({
    id: customImage.id,
    categoryId: CUSTOM_CATEGORY.id,
    name: customImage.name || `내 이미지 ${index + 1}`,
    image: customImage.dataUrl,
    seed: 100 + index
  }));
}

function buildPackImages(categories) {
  const images = [];
  categories.forEach((category, categoryIndex) => {
    (category.levels || []).forEach((level, levelIndex) => {
      images.push({
        id: level.id || `${category.id}-${levelIndex + 1}`,
        categoryId: category.id,
        name: level.name || `${category.name} ${levelIndex + 1}`,
        seed: level.seed || ((categoryIndex + 1) * 1000 + levelIndex + 1),
        image: level.image || null
      });
    });
  });
  return images;
}

function buildPlayLevels(images) {
  const levels = [];
  images.forEach((imageItem, imageIndex) => {
    DIFFICULTIES.forEach((size, difficultyIndex) => {
      levels.push({
        id: `${imageItem.id}-${size}`,
        imageId: imageItem.id,
        categoryId: imageItem.categoryId,
        name: imageItem.name,
        difficulty: size,
        size,
        seed: imageItem.seed + difficultyIndex + imageIndex * 10,
        image: imageItem.image || null
      });
    });
  });
  return levels;
}

async function initializeLevelData() {
  PACK_CATEGORIES = await loadPackManifest();
  rebuildLevelCollections();
}

function rebuildLevelCollections(customImages = []) {
  CATEGORIES = [CUSTOM_CATEGORY, ...PACK_CATEGORIES];
  IMAGES = [...buildCustomImages(customImages), ...buildPackImages(PACK_CATEGORIES)];
  LEVELS = buildPlayLevels(IMAGES);
}

function setCustomImages(customImages) {
  rebuildLevelCollections(customImages);
}

async function loadPackManifest() {
  try {
    const assetVersion = typeof window !== "undefined" && window.APP_ASSET_VERSION
      ? `?v=${encodeURIComponent(window.APP_ASSET_VERSION)}`
      : "";
    const response = await fetch(`./assets/packs/manifest.json${assetVersion}`, { cache: "no-store" });
    if (!response.ok) return [];
    const manifest = await response.json();
    return normalizePackCategories(manifest.categories || []);
  } catch (error) {
    return [];
  }
}

function normalizePackCategories(categories) {
  return categories
    .filter((category) => category && category.id && Array.isArray(category.levels))
    .map((category, index) => ({
      id: category.id,
      name: category.name || category.id,
      colors: normalizeCategoryColors(category.colors, index),
      levels: category.levels
        .filter((level) => level && level.image)
        .map((level, levelIndex) => ({
          id: level.id || `${category.id}-${levelIndex + 1}`,
          name: level.name || readableLevelName(level.image, levelIndex),
          size: clampLevelSize(level.size),
          image: level.image,
          seed: level.seed || ((index + 1) * 1000 + levelIndex + 1)
        }))
    }))
    .filter((category) => category.levels.length > 0);
}

function normalizeCategoryColors(colors, index) {
  const fallback = [
    ["#5b8def", "#8ed1fc", "#ffe29f", "#f76b1c"],
    ["#1f8f5f", "#96d98d", "#fff0b3", "#ff8b5e"],
    ["#3a4f7a", "#8fa8d6", "#f7d794", "#e67e22"],
    ["#9b4dca", "#f6a6ff", "#ffd166", "#ef476f"],
    ["#c44536", "#f7a278", "#ffe29a", "#2a9d8f"]
  ][index % 5];
  return Array.isArray(colors) && colors.length === 4 ? colors : fallback;
}

function readableLevelName(imagePath, levelIndex) {
  const filename = imagePath.split("/").pop() || `level-${levelIndex + 1}`;
  return filename.replace(/\.[^.]+$/, "");
}

function clampLevelSize(size) {
  if (![3, 4, 5, 6].includes(size)) return 4;
  return size;
}

function renderStars(count) {
  if (!count) return "☆☆☆";
  return "★".repeat(count) + "☆".repeat(3 - count);
}

function categoryIndex(categoryId) {
  return CATEGORIES.findIndex((category) => category.id === categoryId);
}

function imageById(imageId) {
  return IMAGES.find((image) => image.id === imageId);
}
