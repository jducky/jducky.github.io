# Jigsaw Link Puzzle

모바일 우선으로 만든 정적 퍼즐 게임입니다.  
퍼즐 조각을 맞추면 인접한 정답 타일이 자동으로 연결되고, 연결된 조각은 하나의 그룹처럼 함께 움직입니다.

## 개요

이 앱은 GitHub Pages 같은 정적 환경에서 바로 실행되도록 구성되어 있습니다.

- 프레임워크 없음
- 순수 `HTML`, `CSS`, `JavaScript`
- 진행도는 `localStorage`와 `IndexedDB`에 저장
- 기본 이미지팩 + 사용자 업로드 이미지 지원

## 주요 기능

- 카테고리별 이미지 선택
- 난이도 선택
  - `3×3`부터 `8×8`까지 지원
- 링크 퍼즐 방식
  - 인접한 정답 조각은 자동 연결
  - 연결된 조각은 함께 이동
- 진행도 저장
  - 별점
  - 클리어 여부
  - 최근 플레이 상태
- 사용자 이미지 업로드
  - 개별 파일 업로드
  - 폴더 단위 업로드
- 폴더 업로드 그룹 표시
  - 메인 화면에서 폴더 그룹이 카테고리처럼 보이도록 처리

## 화면 구성

### 1. 메인 화면

- 기본 카테고리 카드 표시
- 사용자 업로드 이미지 그룹 표시
- 상단 빠른 메뉴
  - `이어`
  - `랜덤`
  - `추가`
  - `폴더`

### 2. 레벨 선택 화면

- 카테고리 또는 폴더 그룹에 들어 있는 이미지 목록 표시
- 이미지 선택 후 난이도 선택 가능

### 3. 게임 화면

- 퍼즐 보드
- 이동 / 연결 / 힌트 / 예상 별점 표시
- 셔플, 랜덤, 다음 레벨 이동
- 원본 미리보기 토글

## `추가`와 `폴더` 차이

### `추가`

- 개별 이미지 파일을 직접 업로드
- `내 이미지` 그룹에 들어감

### `폴더`

- 폴더 전체에서 이미지 파일을 읽음
- 저장 구조는 여전히 `내 이미지`
- 다만 UI에서는 폴더명 기준으로 그룹이 나뉘고, 메인 화면에서는 별도 카테고리 카드처럼 보이게 처리됨

즉, `폴더`는 진짜 독립 카테고리를 만드는 것은 아니고,  
간단한 방식으로 카테고리처럼 보이게 한 사용자 그룹 기능입니다.

## 데이터 구조

### 기본 카테고리

기본 카테고리는 이미지팩 manifest를 읽어서 생성합니다.

관련 파일:

- [levels.js](/home/engis/workspace/deploy/jducky.github.io/image-puzzle/levels.js:1)
- [assets/packs/manifest.json](/home/engis/workspace/deploy/jducky.github.io/image-puzzle/assets/packs/manifest.json:1)

앱 시작 시:

1. `manifest.json` 로드
2. 카테고리 목록 생성
3. 이미지 목록 생성
4. 각 이미지별로 `3×3 ~ 8×8` 레벨 생성

### 사용자 이미지

사용자 업로드 이미지는 다음 두 군데에 저장됩니다.

- `localStorage`
  - 진행도
  - 선택된 이미지 id
  - 업로드 이미지 메타데이터
- `IndexedDB`
  - 실제 이미지 데이터 URL

관련 파일:

- [storage.js](/home/engis/workspace/deploy/jducky.github.io/image-puzzle/storage.js:1)

저장되는 대표 필드:

- `id`
- `name`
- `createdAt`
- `sourceType`
  - `file`
  - `folder`
- `sourceGroup`
  - 폴더 업로드 시 폴더명

## 주요 파일

```text
image-puzzle/
├── index.html
├── jigsaw_link_puzzle_prototype.html
├── styles.css
├── game.js
├── levels.js
├── storage.js
├── image-utils.js
├── assets/
│   └── packs/
│       ├── manifest.json
│       └── ...
└── docs/
```

### 파일 역할

#### `index.html`

- 퍼즐 앱 진입용 리다이렉트 페이지

#### `jigsaw_link_puzzle_prototype.html`

- 실제 게임 UI 마크업

#### `styles.css`

- 전체 UI 스타일
- 모바일 화면 대응
- 홈 / 레벨 / 게임 화면 레이아웃

#### `game.js`

- 메인 앱 로직
- 화면 전환
- 퍼즐 드래그
- 링크 계산
- 업로드 / 삭제 / 진행도 반영

#### `levels.js`

- 카테고리, 이미지, 레벨 컬렉션 구성
- manifest 기반 기본 이미지팩 처리

#### `storage.js`

- `localStorage`
- `IndexedDB`
- 업로드 이미지/진행도 저장

## 이미지팩 추가 방법

새 기본 카테고리를 추가하려면 보통 코드 수정 없이 이미지팩 데이터만 넣으면 됩니다.

필요한 작업:

1. `image-puzzle/assets/packs/` 아래에 이미지 추가
2. `manifest.json`에 카테고리/레벨 정보 추가

참고 문서:

- [assets/packs/README.md](/home/engis/workspace/deploy/jducky.github.io/image-puzzle/assets/packs/README.md:1)
- [docs/IMAGE_PACKS.md](/home/engis/workspace/deploy/jducky.github.io/image-puzzle/docs/IMAGE_PACKS.md:1)

## 구현 포인트

### 링크 퍼즐 핵심 규칙

- 퍼즐 조각이 원본 기준으로 인접해 있고
- 현재 보드 위치에서도 상대 위치가 맞으면
- 같은 그룹으로 연결

연결 계산은 `game.js`의 링크 계산 로직에서 처리합니다.

### 진행도

- 별점은 이동 횟수와 힌트 사용 횟수 기반
- 클리어 상태와 최근 진행은 자동 저장

### 사용자 폴더 그룹

- 폴더 업로드 시 `sourceGroup` 저장
- 메인 화면에서 이 그룹을 가상 카테고리 카드처럼 렌더링
- 내부 구조는 여전히 `custom` 카테고리 기반

## 현재 한계

- 사용자 폴더는 진짜 독립 카테고리가 아니라 UI 그룹 수준
- 모바일 브라우저 캐시 이슈가 생길 수 있어 asset version 관리가 중요
- 퍼즐 이미지 수가 많아지면 저장 공간 제한에 영향을 받을 수 있음

## 개선 아이디어

- 사용자 폴더를 완전한 독립 카테고리로 승격
- 카테고리 썸네일 대표 이미지 지정
- 퍼즐 완료 애니메이션 강화
- 공유 가능한 진행도 내보내기
- 다국어 지원

## 관련 문서

- [docs/PRD.md](/home/engis/workspace/deploy/jducky.github.io/image-puzzle/docs/PRD.md:1)
- [docs/PRD2.md](/home/engis/workspace/deploy/jducky.github.io/image-puzzle/docs/PRD2.md:1)
- [docs/GITHUB_PAGES.md](/home/engis/workspace/deploy/jducky.github.io/image-puzzle/docs/GITHUB_PAGES.md:1)
