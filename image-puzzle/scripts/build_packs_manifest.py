#!/usr/bin/env python3
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKS_DIR = ROOT / "assets" / "packs"
MANIFEST_PATH = PACKS_DIR / "manifest.json"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
PALETTES = [
    ["#5b8def", "#8ed1fc", "#ffe29f", "#f76b1c"],
    ["#1f8f5f", "#96d98d", "#fff0b3", "#ff8b5e"],
    ["#3a4f7a", "#8fa8d6", "#f7d794", "#e67e22"],
    ["#9b4dca", "#f6a6ff", "#ffd166", "#ef476f"],
    ["#c44536", "#f7a278", "#ffe29a", "#2a9d8f"],
]


def humanize(name: str) -> str:
    return name.replace("-", " ").replace("_", " ").strip() or name


def slugify(name: str) -> str:
    return name.replace(" ", "-").replace("_", "-").lower()


def build_manifest() -> dict:
    categories = []
    category_dirs = sorted(
        [
            path for path in PACKS_DIR.iterdir()
            if path.is_dir() and not path.name.startswith(".")
        ],
        key=lambda path: path.name,
    )

    for index, category_dir in enumerate(category_dirs):
        images = sorted(
            [
                path for path in category_dir.iterdir()
                if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
            ],
            key=lambda path: path.name,
        )
        if not images:
            continue

        category_id = slugify(category_dir.name)
        levels = []
        for level_index, image_path in enumerate(images, start=1):
            levels.append({
                "id": f"{category_id}-{level_index}",
                "name": image_path.stem,
                "size": 4,
                "image": f"./assets/packs/{category_dir.name}/{image_path.name}",
            })

        categories.append({
            "id": category_id,
            "name": humanize(category_dir.name),
            "colors": PALETTES[index % len(PALETTES)],
            "levels": levels,
        })

    return {"categories": categories}


def main() -> None:
    PACKS_DIR.mkdir(parents=True, exist_ok=True)
    manifest = build_manifest()
    MANIFEST_PATH.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(f"Wrote {MANIFEST_PATH}")
    print(f"Categories: {len(manifest['categories'])}")


if __name__ == "__main__":
    main()
