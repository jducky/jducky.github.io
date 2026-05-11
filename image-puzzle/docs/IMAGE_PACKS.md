# Image Packs

## 폴더 위치

이미지는 아래 폴더에 넣습니다.

```text
assets/packs/<category-name>/
```

예:

```text
assets/packs/landscape/
assets/packs/animals/
assets/packs/food/
```

## 사용 방법

1. 원하는 카테고리 폴더를 만듭니다.
2. 그 안에 이미지 파일을 넣습니다.
3. 아래 명령으로 매니페스트를 생성합니다.

```bash
python3 scripts/build_packs_manifest.py
```

4. 앱을 새로고침합니다.

## 규칙

- 카테고리 1개 = 폴더 1개
- 레벨 1개 = 이미지 1장
- 기본 퍼즐 크기 = `4x4`
- 지원 파일: `.jpg`, `.jpeg`, `.png`, `.webp`

## 참고

정적 웹 앱은 브라우저에서 폴더 목록을 직접 읽을 수 없어서 `manifest.json` 이 필요합니다.  
스크립트가 이 파일을 자동으로 만들어 줍니다.
