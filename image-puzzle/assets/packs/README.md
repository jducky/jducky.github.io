# Image Packs

이미지 팩은 아래 구조로 넣습니다.

```text
assets/packs/
  landscape/
    image1.jpg
    image2.png
  animals/
    cat-01.jpg
  my-pack/
    sample.webp
```

이미지를 넣은 뒤 아래 스크립트를 실행하면 `manifest.json` 이 갱신됩니다.

```bash
python3 scripts/build_packs_manifest.py
```

생성 규칙:

- 하위 폴더 1개 = 카테고리 1개
- 폴더 안 이미지 1장 = 레벨 1개
- 기본 퍼즐 크기 = `4x4`
- 지원 확장자 = `.jpg`, `.jpeg`, `.png`, `.webp`

원하면 생성된 `manifest.json` 을 열어서 각 레벨의 `name`, `size` 를 수동 수정해도 됩니다.
