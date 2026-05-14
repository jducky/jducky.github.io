const STORAGE_KEY = "jigsaw-link-mobile-progress-v1";
const CUSTOM_IMAGE_DB_NAME = "jigsaw-link-mobile-assets";
const CUSTOM_IMAGE_STORE_NAME = "custom-images";
const CUSTOM_IMAGE_DB_VERSION = 1;

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
  const persistable = {
    levels: normalized.levels,
    ongoing: normalized.ongoing,
    recentLevelId: normalized.recentLevelId,
    customImages: normalized.customImages.map((item) => ({
      id: item.id,
      name: item.name,
      createdAt: item.createdAt,
      sourceType: item.sourceType || "file",
      sourceGroup: item.sourceGroup || null
    })),
    selectedCustomImageId: normalized.selectedCustomImageId
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
    syncProgressShape(progress, normalized);
    return true;
  } catch (error) {
    console.warn("Failed to persist progress state", error);
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
    .filter((item) => item && item.id)
    .map((item, index) => ({
      id: item.id,
      name: item.name || `내 이미지 ${index + 1}`,
      dataUrl: item.dataUrl || null,
      createdAt: item.createdAt || Date.now() + index,
      sourceType: item.sourceType || "file",
      sourceGroup: item.sourceGroup || null
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

function openCustomImageDb() {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB is unavailable"));
      return;
    }

    const request = indexedDB.open(CUSTOM_IMAGE_DB_NAME, CUSTOM_IMAGE_DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(CUSTOM_IMAGE_STORE_NAME)) {
        db.createObjectStore(CUSTOM_IMAGE_STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error("Failed to open IndexedDB"));
  });
}

function withCustomImageStore(mode, callback) {
  return openCustomImageDb().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction(CUSTOM_IMAGE_STORE_NAME, mode);
    const store = transaction.objectStore(CUSTOM_IMAGE_STORE_NAME);
    let result;

    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error || new Error("IndexedDB transaction failed"));
    };
    transaction.onabort = () => {
      db.close();
      reject(transaction.error || new Error("IndexedDB transaction aborted"));
    };

    result = callback(store, transaction);
  }));
}

function listCustomImageRecords() {
  return withCustomImageStore("readonly", (store) => new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => {
      const records = Array.isArray(request.result) ? request.result.slice() : [];
      records.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
      resolve(records);
    };
    request.onerror = () => reject(request.error || new Error("Failed to load custom images"));
  }));
}

function saveCustomImageRecord(record) {
  return withCustomImageStore("readwrite", (store) => new Promise((resolve, reject) => {
    const request = store.put(record);
    request.onsuccess = () => resolve(record);
    request.onerror = () => reject(request.error || new Error("Failed to store custom image"));
  }));
}

function deleteCustomImageRecord(imageId) {
  return withCustomImageStore("readwrite", (store) => new Promise((resolve, reject) => {
    const request = store.delete(imageId);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error || new Error("Failed to delete custom image"));
  }));
}

async function hydrateCustomImageProgress(progress) {
  const normalized = normalizeProgress(progress);
  const legacyImages = normalized.customImages.filter((item) => item.dataUrl);

  if (legacyImages.length) {
    for (const image of legacyImages) {
      await saveCustomImageRecord({
        id: image.id,
        name: image.name,
        dataUrl: image.dataUrl,
        createdAt: image.createdAt,
        sourceType: image.sourceType || "file",
        sourceGroup: image.sourceGroup || null
      });
    }
  }

  const records = await listCustomImageRecords();
  const next = normalizeProgress({
    ...normalized,
    customImages: records,
    customImage: null,
    customImageName: null
  });

  syncProgressShape(progress, next);
  saveProgressState(progress);
  return next;
}
