ENGIS 홈페이지 만들기

## 1. 기술 스택 확정

추천:

```txt
React + Vite
Tailwind CSS
Framer Motion은 제외 또는 최소 사용
React Router
정적 배포: Cloudflare Pages / GitHub Pages / Vercel
```

Codex는 코드 작성·수정·리팩터링에 활용하면 됩니다. OpenAI도 API/에이전트 개발 환경을 제공하고 있어 코드 기반 작업 자동화에 적합합니다. ([OpenAI][1])

## 2. 먼저 만들 페이지

처음부터 전체 사이트 말고 **메인페이지 1장**부터 만드세요.

구성:

```txt
1. Header
2. Hero
3. 사업분야 카드 4개
4. 주요 프로젝트 카드
5. 기술 소개 섹션
6. 파트너/고객 로고
7. Footer
```

## 3. Codex에 줄 첫 번째 지시문

```txt
React + Vite + Tailwind CSS로 회사 홈페이지 메인페이지를 만들어줘.

디자인 방향:
- Airtable 스타일 참고
- 무난하고 미니멀한 B안
- 흰 배경 중심
- 큰 여백
- 검정/진녹색/테라코타/크림 컬러 사용
- 지도, 복잡한 애니메이션, 3D 효과 제외
- 카드형 사업영역 강조
- 공공기관/기술기업 느낌

섹션:
1. Header
2. Hero
3. ServiceCards
4. ProjectCards
5. TechSection
6. PartnerLogos
7. Footer

컴포넌트 단위로 분리:
- Header.jsx
- Hero.jsx
- ServiceCard.jsx
- ProjectCard.jsx
- TechAccordion.jsx
- Footer.jsx

반응형까지 적용해줘.
```

## 4. 폴더 구조

```txt
engis-homepage/
├─ src/
│  ├─ components/
│  │  ├─ Header.jsx
│  │  ├─ Hero.jsx
│  │  ├─ ServiceCard.jsx
│  │  ├─ ProjectCard.jsx
│  │  ├─ TechAccordion.jsx
│  │  └─ Footer.jsx
│  ├─ data/
│  │  └─ siteContent.js
│  ├─ App.jsx
│  └─ index.css
├─ package.json
└─ tailwind.config.js
```

## 5. 콘텐츠 데이터는 분리

`siteContent.js`에 텍스트를 넣어두면 나중에 수정하기 쉽습니다.

```js
export const services = [
  {
    title: "AI 데이터 분석",
    desc: "환경·기상·위성 데이터를 AI로 분석합니다.",
    tone: "coral",
  },
  {
    title: "공간정보 플랫폼",
    desc: "GIS 기반 데이터 통합·관리 플랫폼을 구축합니다.",
    tone: "forest",
  },
  {
    title: "디지털 트윈",
    desc: "현실 공간을 디지털 환경에서 구현합니다.",
    tone: "cream",
  },
  {
    title: "공공 SI / 컨설팅",
    desc: "공공기관 디지털 전환을 지원합니다.",
    tone: "navy",
  },
];
```

## 6. 개발 순서

```txt
1단계: Vite + Tailwind 기본 세팅
2단계: Header / Hero 구현
3단계: 사업분야 카드 구현
4단계: 프로젝트 카드 구현
5단계: Footer 구현
6단계: 모바일 반응형 정리
7단계: 문구/이미지 교체
8단계: 배포
```

## 7. Codex 작업 방식

한 번에 “홈페이지 다 만들어줘”보다 이렇게 나눠서 시키는 게 좋습니다.

```txt
먼저 Header와 Hero만 구현해줘.
```

그다음:

```txt
시안 B처럼 사업분야 카드 4개를 2x2 그리드로 추가해줘.
```

그다음:

```txt
프로젝트 카드 섹션과 기술 아코디언 섹션을 추가해줘.
```

## 8. 개발 기준

이번 홈페이지는 이 기준으로 가면 좋습니다.

```txt
멋진 효과보다 신뢰감
화려한 지도보다 정돈된 카드
강한 그래픽보다 좋은 여백
기술 설명보다 사업 이해
```

첨부한 Airtable 분석 파일의 핵심도 **화이트 캔버스, 진한 잉크색 타이포, 큰 여백, 시그니처 컬러 카드** 중심입니다. 

[1]: https://openai.com/api/?utm_source=chatgpt.com "API Platform"
