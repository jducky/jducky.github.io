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
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
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
