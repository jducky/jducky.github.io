const STORAGE_KEY = "jigsaw-link-mobile-progress-v1";

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return normalizeProgress(raw ? JSON.parse(raw) : null);
  } catch (error) {
    return normalizeProgress(null);
  }
}

function saveProgressState(progress) {
  const normalized = normalizeProgress(progress);
  if (writeProgressState(normalized)) {
    syncProgressShape(progress, normalized);
    return true;
  }

  const selectedId = normalized.selectedCustomImageId;
  const removableImages = normalized.customImages
    .filter((item) => item.id !== selectedId)
    .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));

  while (removableImages.length) {
    const removed = removableImages.shift();
    normalized.customImages = normalized.customImages.filter((item) => item.id !== removed.id);
    normalized.selectedCustomImageId = normalized.customImages.some((item) => item.id === selectedId)
      ? selectedId
      : (normalized.customImages[normalized.customImages.length - 1]?.id || null);
    const selectedImage = normalized.customImages.find((item) => item.id === normalized.selectedCustomImageId) || null;
    normalized.customImage = selectedImage?.dataUrl || null;
    normalized.customImageName = selectedImage?.name || null;

    if (writeProgressState(normalized)) {
      syncProgressShape(progress, normalized);
      return true;
    }
  }

  console.warn("Failed to persist progress state: storage quota exceeded");
  return false;
}

function writeProgressState(progress) {
  const persistable = {
    levels: progress.levels,
    ongoing: progress.ongoing,
    recentLevelId: progress.recentLevelId,
    customImages: progress.customImages.map((item) => ({
      id: item.id,
      name: item.name,
      dataUrl: item.dataUrl,
      createdAt: item.createdAt
    })),
    selectedCustomImageId: progress.selectedCustomImageId
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    return true;
  } catch (error) {
    return false;
  }
}

function syncProgressShape(target, source) {
  target.levels = source.levels;
  target.ongoing = source.ongoing;
  target.recentLevelId = source.recentLevelId;
  target.customImages = source.customImages.slice();
  target.selectedCustomImageId = source.selectedCustomImageId;
  target.customImage = source.customImage;
  target.customImageName = source.customImageName;
}

function normalizeProgress(progress) {
  const base = {
    levels: {},
    ongoing: null,
    recentLevelId: null,
    customImages: [],
    selectedCustomImageId: null,
    customImage: null,
    customImageName: null
  };
  const next = { ...base, ...(progress || {}) };

  if (!Array.isArray(next.customImages)) {
    next.customImages = [];
  }

  const migratedImages = next.customImages
    .filter((item) => item && item.id && item.dataUrl)
    .map((item, index) => ({
      id: item.id,
      name: item.name || `내 이미지 ${index + 1}`,
      dataUrl: item.dataUrl,
      createdAt: item.createdAt || Date.now() + index
    }));

  if (!migratedImages.length && next.customImage) {
    migratedImages.push({
      id: `custom-upload-${Date.now()}`,
      name: next.customImageName || "내 이미지 1",
      dataUrl: next.customImage,
      createdAt: Date.now()
    });
  }

  next.customImages = migratedImages;
  if (!next.customImages.some((item) => item.id === next.selectedCustomImageId)) {
    next.selectedCustomImageId = next.customImages.length ? next.customImages[next.customImages.length - 1].id : null;
  }

  const selectedImage = next.customImages.find((item) => item.id === next.selectedCustomImageId) || null;
  next.customImage = selectedImage?.dataUrl || null;
  next.customImageName = selectedImage?.name || null;
  return next;
}
