# GitHub Pages Deploy

이 프로젝트는 서버 코드가 없는 정적 사이트라서 GitHub Pages로 바로 배포할 수 있습니다.

## 포함된 설정

- [.nojekyll](/home/engis/workspace/experiments/image-puzzle/.nojekyll)
- [.github/workflows/deploy-pages.yml](/home/engis/workspace/experiments/image-puzzle/.github/workflows/deploy-pages.yml)

`main` 또는 `master` 브랜치에 push 하면 GitHub Actions가 Pages로 자동 배포합니다.

## GitHub 설정

1. GitHub 저장소의 `Settings > Pages` 로 이동합니다.
2. `Source` 를 `GitHub Actions` 로 선택합니다.
3. 기본 배포 브랜치를 `main` 또는 `master` 중 실제 사용하는 브랜치로 맞춥니다.

## 배포 경로

- 기본 진입점: [index.html](/home/engis/workspace/experiments/image-puzzle/index.html)
- 실제 앱: [jigsaw_link_puzzle_prototype.html](/home/engis/workspace/experiments/image-puzzle/jigsaw_link_puzzle_prototype.html)

`index.html` 이 앱 페이지로 즉시 이동합니다.

## 이미지 팩 반영

이미지 팩 폴더를 수정한 뒤에는 아래 스크립트를 실행해서 매니페스트를 갱신한 뒤 함께 커밋해야 합니다.

```bash
python3 scripts/build_packs_manifest.py
```

함께 커밋할 파일:

- `assets/packs/manifest.json`
- `assets/packs/<category>/...`

## 캐시 운영

이 프로젝트는 정적 자산 버전 쿼리를 사용합니다.

- HTML은 재검증 전제
- CSS / JS / manifest 는 버전 쿼리로 관리

배포 후 자산이 바뀌면 [jigsaw_link_puzzle_prototype.html](/home/engis/workspace/experiments/image-puzzle/jigsaw_link_puzzle_prototype.html) 의 `APP_ASSET_VERSION` 값을 올려야 합니다.

예:

```html
<script>window.APP_ASSET_VERSION = "20260511-2";</script>
```

이 값을 바꾸면:

- `styles.css?v=...`
- `levels.js?v=...`
- `storage.js?v=...`
- `image-utils.js?v=...`
- `game.js?v=...`
- `assets/packs/manifest.json?v=...`

이 모두 새 버전으로 다시 요청됩니다.
