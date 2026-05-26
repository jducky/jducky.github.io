# Image Puzzle Packs

이 폴더는 이미지 퍼즐 게임에서 사용하는 이미지 팩과 `manifest.json`을 관리합니다.

## 폴더 구조

카테고리별로 하위 폴더를 만들고, 그 안에 퍼즐로 사용할 이미지를 넣습니다.

```text
assets/packs/
  backgrounds/
    sunset.png
    forest.png
  landscape/
    beach.jpg
    mountain.webp
  my-pack/
    sample-01.png
```

규칙은 단순합니다.

- 하위 폴더 1개 = 카테고리 1개
- 이미지 1장 = 퍼즐 레벨 1개
- 숨김 폴더(`.`로 시작)는 제외됩니다
- 지원 확장자 = `.jpg`, `.jpeg`, `.png`, `.webp`

## 추가 방법

1. `assets/packs/` 아래에 새 폴더를 만듭니다.
2. 해당 폴더 안에 이미지 파일을 넣습니다.
3. 프로젝트 루트의 `image-puzzle/`에서 아래 명령을 실행합니다.

```bash
python3 scripts/build_packs_manifest.py
```

4. 생성된 `assets/packs/manifest.json`을 확인한 뒤 앱을 새로고침합니다.

## manifest 생성 방식

스크립트는 폴더와 파일명을 읽어 아래 정보를 자동 생성합니다.

- 카테고리 `id`: 폴더명을 소문자 슬러그로 변환
- 카테고리 `name`: 폴더명을 사람이 읽기 쉬운 형태로 변환
- 카테고리 `colors`: 카테고리 순서에 따라 자동 배정
- 레벨 `id`: `<category-id>-<번호>`
- 레벨 `name`: 이미지 파일명(확장자 제외)
- 레벨 `size`: 기본값 `4`
- 레벨 `image`: 실제 이미지 상대 경로

예:

```json
{
  "id": "landscape-1",
  "name": "beach",
  "size": 4,
  "image": "./assets/packs/landscape/beach.jpg"
}
```

## 수정 팁

- 표시 이름을 더 보기 좋게 바꾸고 싶으면 `manifest.json`에서 `name`을 직접 수정하면 됩니다.
- 퍼즐 조각 수를 바꾸고 싶으면 각 레벨의 `size` 값을 수동으로 조정하면 됩니다.
- 스크립트를 다시 실행하면 자동 생성되는 필드는 덮어써지므로, 수동 수정값을 유지하려면 재생성 전에 백업하거나 스크립트 규칙을 함께 수정하는 편이 안전합니다.

## 참고

정적 웹 앱은 브라우저에서 폴더 목록을 직접 읽지 못하므로 `manifest.json`이 필요합니다. 이 파일이 실제 게임에서 불러오는 이미지 목록 역할을 합니다.
