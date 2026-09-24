# UI/UX Harness Engineering Guide

> 목적: AI 또는 개발자가 화면을 추가·수정할 때 디자인이 화면마다 달라지지 않도록 **반응형, 타이포그래피, 컬러, 간격, 레이아웃, 컴포넌트, 상태, 접근성 규칙을 하나의 기준으로 고정**한다.
>
> 적용 범위: Responsive Web / Web App / Mobile Web / App UI 설계 및 프론트엔드 스타일 수정

> **V2 업데이트**
> - 가독성(Readability) 규칙 강화
> - 정보 밀도 및 시각적 위계 기준 추가
> - 본문 최소 크기 / 텍스트 폭 / 섹션 리듬 정의
> - 카드 남발 방지 및 White Space 우선 원칙 추가
> - AI용 Readability MUST / MUST NOT 추가


---

## 0. 최우선 원칙

### 0.1 Single Source of Truth
모든 UI 값은 아래 우선순위를 따른다.

1. Design Token
2. 공통 Component
3. Layout Rule
4. Page-specific Style
5. 예외 스타일

**페이지별 임의 값보다 공통 규칙이 항상 우선한다.**

금지:
- 같은 의미의 색상을 다른 Hex 값으로 추가
- 같은 역할의 제목에 서로 다른 font-size 사용
- 화면마다 별도 breakpoint 생성
- 기존 공통 컴포넌트가 있는데 새 컴포넌트 생성
- 반복되는 스타일을 inline style로 작성
- `!important`로 충돌을 덮어쓰기
- 같은 selector를 파일 하단에서 계속 재정의

---

## 1. 변경 원칙

UI 수정 시 아래 순서를 반드시 따른다.

### STEP 1. 기존 구조 확인
먼저 확인한다.

- 현재 페이지 구조
- 기존 Design Token
- 공통 컴포넌트
- Grid / Container
- Breakpoint
- 모바일 대응 방식
- Hover / Focus / Disabled / Selected 상태

### STEP 2. 기존 규칙 재사용
새 값을 만들기 전에 반드시 기존 Token 또는 Component로 해결 가능한지 확인한다.

### STEP 3. 최소 범위 수정
문제를 해결하는 데 필요한 최소한의 DOM/CSS만 수정한다.

### STEP 4. 전체 화면 영향 확인
수정 후 Desktop / Tablet / Mobile에서 모두 확인한다.

---

# 2. 콘텐츠 및 구조 보존 규칙

디자인 개선 작업에서는 **콘텐츠를 임의로 바꾸지 않는다.**

다음은 명시적인 요청이 없는 한 변경 금지한다.

- 문구
- 문장
- 메뉴명
- 메뉴 순서
- 정보 구조
- 콘텐츠 그룹
- 기능
- 화면 플로우
- 데이터
- 의미 구조

가능한 변경:

- CSS
- Design Token
- spacing
- typography
- color
- alignment
- width / height
- grid
- responsive layout
- class 추가
- 접근성을 위한 semantic attribute
- 필요한 최소 수준의 wrapper 추가

> 구조를 바꾸는 것이 UX적으로 더 좋아 보여도, 명시적 요청이 없다면 먼저 기존 구조 안에서 해결한다.

---

# 3. Responsive System

## 3.1 표준 Breakpoint

프로젝트 전체에서 아래 breakpoint만 사용한다.

```css
/* Mobile */
@media (max-width: 767px) {}

/* Tablet */
@media (min-width: 768px) and (max-width: 1023px) {}

/* Desktop */
@media (min-width: 1024px) {}

/* Wide Desktop */
@media (min-width: 1440px) {}
```

### 기준

| 구간 | Width | 목적 |
|---|---:|---|
| Mobile | 360–767px | 1열 중심 |
| Tablet | 768–1023px | 1~2열 |
| Desktop | 1024–1439px | 일반 PC |
| Wide | 1440px+ | 넓은 PC |

### 금지

```css
@media (max-width: 700px)
@media (max-width: 760px)
@media (max-width: 850px)
@media (max-width: 920px)
```

특정 화면을 맞추기 위해 새로운 breakpoint를 계속 추가하지 않는다.

예외가 꼭 필요하면 이유를 주석으로 남긴다.

---

## 3.2 Mobile First

기본 스타일은 Mobile을 기준으로 작성하고 큰 화면으로 확장한다.

```css
.component {
  display: block;
}

@media (min-width: 768px) {
  .component {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 3.3 최소 지원 폭

최소 지원 viewport:

```text
360px
```

360px에서 다음 문제가 없어야 한다.

- 가로 스크롤
- 버튼 잘림
- 텍스트 겹침
- 카드 overflow
- 고정 너비 때문에 화면 이탈
- 표 때문에 전체 페이지 overflow

---

# 4. Layout System

## 4.1 Container

페이지 콘텐츠는 공통 Container를 사용한다.

```css
:root {
  --container-max: 1200px;
  --page-padding-desktop: 32px;
  --page-padding-tablet: 24px;
  --page-padding-mobile: 16px;
}
```

```css
.container {
  width: 100%;
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: var(--page-padding-mobile);
}

@media (min-width: 768px) {
  .container {
    padding-inline: var(--page-padding-tablet);
  }
}

@media (min-width: 1024px) {
  .container {
    padding-inline: var(--page-padding-desktop);
  }
}
```

### 원칙

- 콘텐츠를 화면 끝에 붙이지 않는다.
- 페이지마다 `calc(100% - 28px)`, `calc(100% - 36px)` 등을 새로 만들지 않는다.
- 동일 계층 화면은 동일한 max-width를 사용한다.

---

## 4.2 Grid

권장 Grid:

```text
Desktop : 12 columns
Tablet  : 8 columns
Mobile  : 4 columns
```

일반적인 카드 목록:

```css
.card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

@media (min-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

# 5. Spacing System

## 5.1 8pt 기반

간격은 4px 보조 단위를 포함한 8pt system을 사용한다.

```css
:root {
  --space-0: 0;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;
  --space-9: 64px;
  --space-10: 80px;
}
```

### 사용 기준

| 용도 | 권장값 |
|---|---:|
| 아이콘 ↔ 텍스트 | 8px |
| 연관된 텍스트 | 4–8px |
| Form field 간격 | 16px |
| 카드 내부 padding | 16–24px |
| 카드 간격 | 16–24px |
| 섹션 내부 | 24–40px |
| 섹션 사이 | 48–80px |

금지:
- 13px
- 19px
- 27px
- 37px

특별한 이유가 없다면 임의 spacing을 만들지 않는다.

---

# 6. Typography

## 6.1 Font Family

프로젝트 기본 폰트는 **NanumSquare Neo** 하나로 통일한다.

기본값:

```css
:root {
  --font-sans:
    "NanumSquareNeo",
    "NanumSquare Neo",
    -apple-system,
    BlinkMacSystemFont,
    "Apple SD Gothic Neo",
    "Noto Sans KR",
    sans-serif;
}
```

```css
body {
  font-family: var(--font-sans);
}
```

### 금지

페이지마다 다른 font-family 선언:

```css
font-family: Pretendard;
font-family: Arial;
font-family: "Noto Sans KR";
```

한 화면에서 여러 기본 폰트를 섞지 않는다.

---


### 기본 폰트 강제 규칙

이 프로젝트의 기본 UI 폰트는 **NanumSquare Neo**다.

```css
html,
body,
button,
input,
textarea,
select {
  font-family: var(--font-sans);
}
```

- 페이지별로 Pretendard, Arial, Noto Sans KR 등을 개별 지정하지 않는다.
- 버튼, 입력창, 셀렉트 등 form control도 반드시 동일한 기본 폰트를 상속한다.
- 다른 폰트는 명시적인 디자인 목적과 요청이 있을 때만 예외로 사용한다.
- 폰트가 로드되지 않은 경우에만 system fallback을 사용한다.


## 6.2 Typography Scale

```css
:root {
  --text-xs: 12px;
  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
  --text-4xl: 40px;
}
```

권장 체계:

| Role | Size | Weight | Line-height |
|---|---:|---:|---:|
| Display | 40px | 700–800 | 1.25 |
| Page title | 32px | 700–800 | 1.3 |
| Section title | 24px | 700 | 1.4 |
| Card title | 18px | 600–700 | 1.45 |
| Body | 16px | 400–500 | 1.6 |
| Secondary | 14px | 400–500 | 1.55 |
| Caption | 12px | 400–600 | 1.5 |

### Mobile

Mobile에서는 큰 타이틀만 축소한다.

```css
.page-title {
  font-size: 28px;
}

@media (min-width: 768px) {
  .page-title {
    font-size: 32px;
  }
}
```

Body text는 지나치게 작게 축소하지 않는다.

```text
본문 최소 14px
중요 본문 권장 16px
```

---

## 6.3 Font Weight

사용 범위:

```text
400 Regular
500 Medium
600 SemiBold
700 Bold
800 ExtraBold
```

비슷한 weight를 과도하게 섞지 않는다.

---


# 6A. Readability & Information Density

> 이 프로젝트는 정보량이 많기 때문에 “예쁘게 정돈된 화면”보다 **빠르게 읽히고, 중요도가 한눈에 구분되며, 오래 읽어도 피로하지 않은 화면**을 우선한다.

## 6A.1 핵심 가독성 원칙

모든 화면은 아래 순서가 시각적으로 바로 보여야 한다.

```text
1. 지금 가장 먼저 읽어야 하는 것
2. 이해를 위해 필요한 설명
3. 필요할 때만 보는 보조 정보
```

모든 텍스트를 같은 크기·굵기·카드 스타일로 보여주지 않는다.

---

## 6A.2 정보 위계 3단계

### Level 1 — 핵심 정보
사용자가 화면에 들어왔을 때 가장 먼저 읽어야 하는 정보.

예:
- 페이지 제목
- 핵심 정의
- 중요한 질문
- 주요 상태
- Primary CTA

표현:
- 가장 큰 제목
- 높은 명도 대비
- 충분한 상하 여백
- 한 화면에 과도하게 여러 개 두지 않음

### Level 2 — 이해를 돕는 정보
핵심 내용을 설명하는 정보.

예:
- 설명문
- 특징
- 예시
- 보조 행동
- 카드 설명

표현:
- Body 크기 유지
- Level 1보다 낮은 weight
- 적절한 그룹 간격

### Level 3 — 보조 정보
필요할 때만 확인하면 되는 정보.

예:
- 출처
- 주석
- Meta 정보
- 상태 부가 설명
- 날짜 / 보조 라벨

표현:
- 작은 크기 사용 가능
- 단, 대비를 지나치게 낮추지 않음
- 핵심 정보와 충분히 분리

---

## 6A.3 Typography Readability Scale

가독성을 위해 아래 범위 안에서만 사용한다.

| Role | Desktop | Mobile | Weight | Line-height |
|---|---:|---:|---:|---:|
| Display / Hero | 40px | 32px | 700–800 | 1.2–1.3 |
| Page title | 32–36px | 28–32px | 700–800 | 1.25–1.35 |
| Section title | 24–28px | 22–24px | 700 | 1.35–1.45 |
| Card title | 17–18px | 16–18px | 600–700 | 1.4–1.5 |
| Primary body | 16px | 16px | 400–500 | 1.6–1.75 |
| Secondary body | 14–15px | 14–15px | 400–500 | 1.55–1.7 |
| Caption / Meta | 12–13px | 12–13px | 400–600 | 1.5 |

### 금지

- 본문을 13px 이하로 축소
- 모바일에서 데스크톱 내용을 단순 축소
- 12px 이하 텍스트를 설명문/본문에 사용
- 12.5px / 13.5px / 14.5px / 15.5px처럼 단계가 과도하게 쪼개진 크기
- 같은 위계의 제목이 화면마다 다른 크기

### 예외

12px 이하 텍스트는 다음에만 허용한다.

```text
Meta
Date
Badge
Status label
Table auxiliary label
```

---

## 6A.4 Text Width

페이지 전체 컨테이너 폭과 실제 텍스트를 읽는 폭을 구분한다.

```css
.readable-text {
  max-width: 680px;
}

.readable-text-wide {
  max-width: 760px;
}

.section-description {
  max-width: 640px;
}
```

### 원칙

- 긴 설명문이 1000px 이상 펼쳐지지 않게 한다.
- 제목은 필요한 경우 넓게 쓸 수 있지만, 긴 본문은 폭을 제한한다.
- 긴 줄보다 자연스럽게 줄바꿈되는 짧은 문단을 우선한다.

---

## 6A.5 Paragraph Rule

본문은 아래 기준을 따른다.

```text
문단 간격: 12–20px
본문 line-height: 1.6–1.75
한 문단: 가능하면 3–5줄 이내
```

텍스트가 길어질 경우:

```text
긴 문단 1개
↓
짧은 문단 여러 개
↓
필요한 경우 bullet / list
```

단, 콘텐츠 자체를 임의로 재작성하거나 축약하지 않는다.

---

## 6A.6 Section Rhythm

가독성 좋은 페이지는 작은 요소 간격보다 **큰 덩어리 사이의 리듬**이 명확해야 한다.

권장:

| 구간 | Desktop | Mobile |
|---|---:|---:|
| 제목 ↔ 설명 | 12–16px | 8–12px |
| 설명 ↔ 첫 콘텐츠 | 24–32px | 20–24px |
| 카드 간 | 16–24px | 12–16px |
| 섹션 내부 그룹 | 32–48px | 24–32px |
| 섹션 ↔ 섹션 | 64–96px | 48–64px |

같은 페이지에서 섹션마다 간격이 제각각이면 안 된다.

---

## 6A.7 White Space First

정보 구분은 아래 순서를 따른다.

```text
1. White Space
2. Typography
3. Divider
4. Background
5. Card
```

카드를 기본 그룹핑 수단으로 사용하지 않는다.

잘못된 패턴:

```text
카드
 └ 카드
    └ 카드
       └ 카드
```

권장:

```text
Section
 ├ Heading
 ├ Description
 ├ Divider 또는 여백
 └ 필요한 경우 Card
```

---

## 6A.8 Card Density

카드는 다음 조건을 만족할 때만 사용한다.

- 독립적인 정보 단위
- 클릭 가능한 기능 단위
- 비교 가능한 항목
- 배경과 분리해야 할 명확한 이유가 있음

카드 한 개 안에 너무 많은 정보 위계를 넣지 않는다.

권장:

```text
Title
Description
Optional Meta
Optional Action
```

하나의 카드 내부에서 제목 레벨을 여러 번 중첩하지 않는다.

---

## 6A.9 Visual Noise 제한

아래 요소가 한 화면에 동시에 많으면 가독성이 급격히 떨어진다.

- 여러 종류의 배경색
- 과도한 카드
- 많은 badge
- 많은 icon
- 여러 종류의 border
- 여러 종류의 shadow
- 강조색 남발
- 굵은 글씨 남발

### 한 섹션 권장

```text
Primary 강조색 1개
Neutral surface 1~2개
Title weight 1개
Body weight 1개
Shadow 최대 1단계
```

---

## 6A.10 Text Contrast

중요한 설명 텍스트를 너무 연한 회색으로 만들지 않는다.

권장:

```css
--color-text-primary: #18212F;
--color-text-secondary: #5E6A79;
--color-text-tertiary: #7D8797;
```

사용 기준:

```text
Primary   : 핵심 제목 / 본문
Secondary : 설명 / 보조 본문
Tertiary  : Meta / Caption
```

본문에 `--color-text-tertiary`를 사용하지 않는다.

---

## 6A.11 Readability Token

```css
:root {
  --readable-sm: 560px;
  --readable-md: 680px;
  --readable-lg: 760px;

  --body-size: 16px;
  --body-line: 1.7;

  --section-gap-mobile: 48px;
  --section-gap-tablet: 64px;
  --section-gap-desktop: 80px;

  --content-gap-sm: 12px;
  --content-gap-md: 24px;
  --content-gap-lg: 32px;
}
```

---

# 6B. Content Density Rules

## 6B.1 한 화면에 모든 정보를 보여주지 않는다

화면의 목적을 기준으로 중요도를 판단한다.

```text
Primary
Secondary
Tertiary
```

다만 기능 또는 콘텐츠 자체를 삭제하지 않는다.

디자인 차원에서 다음을 사용할 수 있다.

- Accordion
- Details
- Progressive disclosure
- Tab
- Summary + Detail
- Expand / Collapse

단, 기존 기능/정보구조 변경이 필요한 경우 임의 적용하지 않는다.

---

## 6B.2 한 덩어리의 최대 항목 수

연속해서 읽는 리스트는 가능하면:

```text
3–7개
```

를 하나의 시각적 그룹으로 본다.

항목이 많아지면:

- Sub heading
- Divider
- Group spacing

을 사용해 읽기 단위를 나눈다.

---

## 6B.3 한 화면의 강조 요소 제한

동시에 강조되는 Primary 요소는 최소화한다.

권장:

```text
Primary CTA: 1개
Primary color 강조: 1~2개
강조 카드: 1개
```

모든 카드와 버튼이 강조색이면 아무것도 강조되지 않은 것과 같다.

---

# 6C. Readability QA

작업 완료 전 아래를 확인한다.

## Typography
- [ ] 본문 기본 크기가 16px인가?
- [ ] 보조 본문도 최소 14px 이상인가?
- [ ] 설명문에 12px 이하 크기를 사용하지 않았는가?
- [ ] 동일한 위계의 제목이 같은 크기인가?
- [ ] line-height가 최소 1.55 이상인가?

## Width
- [ ] 긴 본문이 너무 넓게 펼쳐지지 않는가?
- [ ] 텍스트용 max-width가 따로 있는가?
- [ ] 모바일에서 한 줄이 너무 길거나 짧지 않은가?

## Hierarchy
- [ ] 화면에 들어왔을 때 무엇부터 읽어야 하는지 바로 알 수 있는가?
- [ ] 제목 → 설명 → 콘텐츠 순서가 명확한가?
- [ ] 중요하지 않은 정보가 핵심 정보보다 더 눈에 띄지 않는가?

## Density
- [ ] 카드가 과도하게 중첩되지 않았는가?
- [ ] 배경색을 너무 많이 사용하지 않았는가?
- [ ] badge / icon / border가 과도하지 않은가?
- [ ] 섹션 간 충분한 여백이 있는가?

## Contrast
- [ ] 핵심 설명이 연한 회색으로 되어 있지 않은가?
- [ ] 정보 중요도와 text color가 일치하는가?
- [ ] WCAG AA 수준의 대비를 확보했는가?

---

# 6D. AI Readability Rules

AI는 UI 수정 시 아래를 반드시 지킨다.

## MUST

1. 핵심 정보와 보조 정보를 시각적으로 구분한다.
2. 긴 텍스트 영역은 max-width를 제한한다.
3. 본문은 기본 16px을 우선한다.
4. 설명 텍스트는 최소 14px 이상을 유지한다.
5. 12px 이하 텍스트는 Meta 정보에만 사용한다.
6. 카드보다 여백과 타이포 위계를 먼저 사용한다.
7. 섹션 사이에 충분한 여백을 확보한다.
8. 한 화면에서 강조색 사용을 최소화한다.
9. 모바일에서 제목만 적절히 축소하고 본문은 지나치게 축소하지 않는다.
10. 기존 콘텐츠를 줄이거나 삭제해서 가독성을 해결하지 않는다.

## MUST NOT

1. 모든 정보를 카드로 감싼다.
2. 모든 설명을 회색 작은 글씨로 처리한다.
3. 모든 제목을 굵게 만들어 위계를 해결한다.
4. 12.5px / 13.5px / 14.5px 등 미세한 크기를 새로 만든다.
5. 중요하지 않은 정보까지 Primary color로 강조한다.
6. Desktop의 복잡한 레이아웃을 Mobile에서 단순 축소한다.
7. 카드 내부에 카드가 2단 이상 중첩되는 구조를 만든다.
8. 본문 폭을 페이지 전체 컨테이너 폭과 동일하게 사용한다.

---

# 6E. Reference Style Direction

이 프로젝트의 UI는 다음 방향을 기준으로 한다.

```text
밝은 배경
+
높은 텍스트 대비
+
큰 제목
+
충분한 섹션 여백
+
적은 수의 강조색
+
명확한 카드 역할
+
넓은 콘텐츠 영역과 좁은 본문 영역의 분리
+
모바일에서도 본문 크기 유지
```

지향하는 인상:

```text
깔끔함
차분함
쉽게 읽힘
정보량이 많아도 복잡하지 않음
한눈에 위계가 보임
```

피해야 하는 인상:

```text
작은 글씨가 빽빽함
모든 요소가 카드
회색 글씨가 많음
테두리가 많음
강조색이 여러 개
화면마다 제목/본문 규격이 다름
```


# 7. Color System

## 7.1 Semantic Color 사용

Hex 값을 직접 쓰지 말고 의미 기반 Token을 사용한다.

```css
:root {
  /* Brand */
  --color-primary: #4F7FD7;
  --color-primary-hover: #416FC4;
  --color-primary-soft: #EAF1FC;

  /* Text */
  --color-text-primary: #18212F;
  --color-text-secondary: #5E6A79;
  --color-text-tertiary: #7D8797;

  /* Surface */
  --color-bg: #F7F9FC;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F4F6F8;

  /* Border */
  --color-border: #DDE5EF;
  --color-border-subtle: #ECF0F5;

  /* Status */
  --color-success: #0F9B5C;
  --color-warning: #B7791F;
  --color-danger: #D6455D;
}
```

### 금지

```css
color: #4F7FD7;
background: #f7f9fc;
border: 1px solid #dde5ef;
```

대신:

```css
color: var(--color-primary);
background: var(--color-bg);
border: 1px solid var(--color-border);
```

---

## 7.2 색상 사용 비율

화면에서 색상의 역할을 구분한다.

- Primary: 핵심 행동 / 선택 / 강조
- Neutral: 대부분의 UI
- Success: 성공
- Warning: 주의
- Danger: 오류 / 삭제
- Info: 정보

브랜드 컬러를 단순 장식 목적으로 남발하지 않는다.

---

## 7.3 Contrast

WCAG AA 기준을 기본으로 한다.

```text
일반 텍스트: 최소 4.5:1
큰 텍스트: 최소 3:1
UI 요소: 최소 3:1
```

색상만으로 상태를 표현하지 않는다.

잘못된 예:

```text
빨간색 = 오류
```

권장:

```text
오류 아이콘 + 오류 문구 + 색상
```

---

# 8. Border Radius

Radius 단계도 제한한다.

```css
:root {
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 999px;
}
```

사용:

| Component | Radius |
|---|---|
| Input | 8–10px |
| Button | 8–10px |
| Card | 12–16px |
| Modal | 16–24px |
| Badge | full |

페이지마다 9px / 13px / 17px / 19px를 새로 만들지 않는다.

---

# 9. Shadow

Shadow는 깊이 표현이 필요한 경우에만 사용한다.

```css
:root {
  --shadow-sm: 0 2px 8px rgba(15, 35, 70, 0.06);
  --shadow-md: 0 8px 24px rgba(15, 35, 70, 0.10);
  --shadow-lg: 0 16px 40px rgba(15, 35, 70, 0.14);
}
```

사용 기준:

```text
sm : 기본 Card
md : Floating / Dropdown
lg : Modal
```

카드마다 다른 shadow를 만들지 않는다.

---

# 10. Component Rules

## 10.1 Button

최소 높이:

```text
Desktop / App: 40px 이상
주요 CTA: 44–48px
Mobile touch target: 최소 44 × 44px
```

종류:

```text
Primary
Secondary
Tertiary
Danger
Icon
```

각 버튼은 반드시 아래 상태를 정의한다.

```text
Default
Hover
Pressed
Focus
Disabled
Loading
```

버튼 안에 여러 CTA hierarchy를 섞지 않는다.

---

## 10.2 Input

기본 상태:

```text
Default
Hover
Focus
Filled
Error
Disabled
Read-only
```

필수 구성:

```text
Label
Input
Helper text 또는 Error
```

Placeholder를 Label 대용으로 사용하지 않는다.

---

## 10.3 Card

카드는 실제 정보 그룹을 표현할 때만 사용한다.

카드 남발 금지:

```text
페이지 전체를 카드 안에 넣고
그 카드 안에 다시 카드
그 안에 또 카드
```

우선순위:

```text
Spacing → Divider → Background → Card
```

---

## 10.4 Tabs

Tabs는 동일한 정보 위계 간 전환에만 사용한다.

모바일에서 탭이 많으면:

```css
overflow-x: auto;
white-space: nowrap;
```

줄바꿈으로 2줄 탭을 만들지 않는다.

---

## 10.5 Navigation

Desktop:
- Side Navigation 또는 Top Navigation 중 주 구조 하나를 사용
- Sidebar width는 프로젝트에서 하나의 값으로 고정

권장:

```css
--sidebar-width: 320px;
```

Mobile:
- Sidebar를 그대로 축소하지 않는다.
- Drawer 또는 Bottom Navigation 등 모바일 패턴으로 전환한다.
- Overlay 클릭 / ESC / Close button으로 닫을 수 있어야 한다.

---

# 11. App UI 추가 기준

모바일 앱 또는 앱과 유사한 Web App에서는 다음을 추가 적용한다.

## Touch Target

```text
최소 44 × 44px
권장 48 × 48px
```

## Bottom Safe Area

```css
padding-bottom: env(safe-area-inset-bottom);
```

## Top Safe Area

```css
padding-top: env(safe-area-inset-top);
```

## Bottom Navigation

- 3~5개 핵심 메뉴
- 현재 위치 명확하게 표시
- 아이콘만 사용하지 말고 가능한 경우 Label 병기

## Gesture

중요 기능을 Swipe / Long press에만 숨기지 않는다.

---

# 12. Interaction

Interaction duration:

```css
:root {
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 240ms;
}
```

권장:

```text
Hover: 120–180ms
Dropdown: 180–240ms
Modal: 180–240ms
```

과도한 Animation 금지.

Animation은 아래 목적 중 하나가 있을 때만 사용한다.

- 상태 변화 전달
- 공간 변화 설명
- 사용자 행동 피드백

---

# 13. Accessibility

모든 UI에서 기본적으로 확인한다.

### Keyboard

- Tab 이동 가능
- Focus 표시
- Enter / Space 실행
- ESC로 Modal / Drawer 닫기

### Semantic HTML

가능하면:

```html
<header>
<nav>
<main>
<section>
<article>
<button>
```

`div`에 클릭 이벤트만 붙여 버튼처럼 사용하지 않는다.

### Focus

```css
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

Focus outline을 제거하지 않는다.

---

# 14. Table / Dashboard

Table이 모바일 폭을 넘는 경우 전체 페이지를 늘리지 않는다.

```css
.table-wrapper {
  overflow-x: auto;
}
```

가능하면 모바일에서는:

```text
핵심 정보 우선 노출
보조 정보 축소 또는 상세 화면 이동
```

단, 데이터 구조 자체를 임의로 삭제하지 않는다.

---

# 15. Text Overflow

한 줄 UI:

```css
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
```

본문:

```css
overflow-wrap: break-word;
word-break: keep-all;
```

고정 높이로 텍스트를 잘라내지 않는다.

---

# 16. Icon

- 같은 프로젝트에서 하나의 Icon style을 사용한다.
- Outline / Filled 스타일을 무작위로 섞지 않는다.
- 동일 의미에는 동일 Icon을 사용한다.
- Icon size는 제한한다.

```text
16px
20px
24px
32px
```

장식용 이모지를 UI Icon 대용으로 사용하지 않는다.

---

# 17. Z-index

임의의 큰 값을 사용하지 않는다.

```css
:root {
  --z-base: 0;
  --z-sticky: 100;
  --z-dropdown: 200;
  --z-overlay: 300;
  --z-drawer: 400;
  --z-modal: 500;
  --z-toast: 600;
}
```

금지:

```css
z-index: 99999;
```

---

# 18. UI State

모든 Interactive component는 최소 다음 상태를 고려한다.

```text
Default
Hover
Focus
Active
Selected
Disabled
Loading
Error
Empty
```

특히 AI가 UI를 생성할 때 **Default 화면만 만들고 끝내지 않는다.**

---

# 19. Empty / Loading / Error

데이터 기반 화면에서는 반드시 다음 상태를 설계한다.

### Loading
- Skeleton 또는 Progress
- Layout shift 최소화

### Empty
- 데이터가 없다는 사실
- 사용자가 다음에 할 수 있는 행동

### Error
- 무엇이 실패했는지
- 사용자가 할 수 있는 다음 행동
- Retry 가능 여부

---

# 20. CSS Architecture

권장 구조:

```text
styles/
├── tokens.css
├── reset.css
├── typography.css
├── layout.css
├── components/
│   ├── button.css
│   ├── input.css
│   ├── card.css
│   ├── tabs.css
│   └── modal.css
└── pages/
    └── ...
```

우선순위:

```text
Token
↓
Base
↓
Layout
↓
Component
↓
Page
↓
Responsive
```

---

# 21. CSS 작성 금지 패턴

## 같은 selector 반복 덮어쓰기

금지:

```css
.sidebar {
  width: 296px;
}

/* ... */

.sidebar {
  width: 274px !important;
}

/* ... */

.sidebar {
  width: 340px !important;
}
```

권장:

```css
:root {
  --sidebar-width: 320px;
}

.sidebar {
  width: var(--sidebar-width);
}
```

---

## Magic Number

금지:

```css
margin-top: 37px;
padding: 19px 27px;
width: 1037px;
```

Token을 우선 사용한다.

---

## !important

`!important`는 원칙적으로 사용하지 않는다.

허용:
- 외부 라이브러리 스타일 override
- Legacy CSS migration 과정

이 경우 반드시 주석으로 이유를 남긴다.

---

# 22. AI Harness Rules

AI가 UI를 생성하거나 수정할 때 아래 지침을 최우선으로 따른다.

## MUST

1. 기존 콘텐츠와 기능을 유지한다.
2. 기존 Design Token을 먼저 찾는다.
3. 새로운 색상 / spacing / font-size를 임의로 추가하지 않는다.
4. 동일 역할의 Component는 동일 스타일을 사용한다.
5. Mobile / Tablet / Desktop을 모두 고려한다.
6. 360px viewport에서도 UI가 깨지지 않아야 한다.
7. Touch target은 최소 44px을 확보한다.
8. Hover뿐 아니라 Focus 상태도 구현한다.
9. 색상만으로 상태를 전달하지 않는다.
10. 기존 구조에서 해결 가능한 경우 DOM 구조를 변경하지 않는다.
11. 페이지별 CSS override보다 공통 규칙 수정 여부를 먼저 검토한다.
12. 수정 후 다른 화면에 영향을 주는 selector인지 확인한다.

## MUST NOT

1. 임의 breakpoint 생성
2. 임의 Hex color 생성
3. 임의 font-size 생성
4. 임의 border-radius 생성
5. 페이지별 새로운 button 디자인 생성
6. 반복되는 inline style 작성
7. `!important`로 문제를 덮어쓰기
8. 모바일에서 Desktop UI를 단순 축소
9. 고정 width로 layout 구성
10. 콘텐츠를 임의로 수정
11. 기능을 임의로 추가 또는 삭제
12. UI 문제를 해결하기 위해 IA를 임의로 변경

---

# 23. AI 작업 절차

UI 수정 요청을 받으면 아래 순서로 작업한다.

```text
1. 현재 UI 구조 분석
2. 기존 Token 확인
3. 기존 Component 확인
4. 문제 발생 원인 확인
5. 공통 규칙으로 해결 가능한지 판단
6. 최소 범위 수정
7. Responsive 확인
8. Interaction State 확인
9. Accessibility 확인
10. 다른 화면 Regression 확인
```

---

# 24. UI QA Checklist

작업 완료 전 반드시 체크한다.

## Layout

- [ ] 페이지 max-width가 통일되어 있는가?
- [ ] 좌우 padding이 breakpoint별로 동일한가?
- [ ] 불필요한 고정 width가 없는가?
- [ ] 360px에서 가로 scroll이 발생하지 않는가?
- [ ] Grid가 자연스럽게 3 → 2 → 1열로 변하는가?

## Typography

- [ ] 기본 Font Family가 하나인가?
- [ ] 동일한 heading level이 동일한 크기인가?
- [ ] 본문이 14px 이하로 과도하게 작지 않은가?
- [ ] line-height가 충분한가?

## Color

- [ ] Hex 직접 사용 대신 Token을 사용하는가?
- [ ] 동일 의미에 동일 색상을 사용하는가?
- [ ] 대비가 충분한가?

## Spacing

- [ ] 4/8px system을 따르는가?
- [ ] 비슷한 UI에 같은 padding을 사용하는가?
- [ ] 섹션 간격이 일관적인가?

## Components

- [ ] 같은 버튼이 같은 모양인가?
- [ ] Hover / Focus / Disabled 상태가 있는가?
- [ ] Touch target이 최소 44px인가?

## Responsive

- [ ] 360px 확인
- [ ] 390px 확인
- [ ] 768px 확인
- [ ] 1024px 확인
- [ ] 1440px 확인

## Accessibility

- [ ] 키보드로 조작 가능한가?
- [ ] Focus가 보이는가?
- [ ] Icon button에 accessible name이 있는가?
- [ ] 색상 외 추가적인 상태 표시가 있는가?

---

# 25. 현재 프로젝트 우선 정리 순서

기존 Legacy UI를 정리할 때는 한 번에 모든 CSS를 다시 쓰지 않는다.

다음 순서로 Migration한다.

### Phase 1 — Token 통합
- Font
- Color
- Spacing
- Radius
- Shadow
- Z-index

### Phase 2 — Responsive 통합
- Breakpoint 정리
- Container 통일
- Sidebar / Mobile Navigation 통일

### Phase 3 — Component 통합
- Button
- Tabs
- Card
- Input
- Table
- Modal
- Navigation

### Phase 4 — 페이지별 예외 제거
- 중복 selector 제거
- `!important` 제거
- Magic number 제거
- 불필요한 CSS override 제거

### Phase 5 — QA
- Desktop
- Tablet
- Mobile
- Keyboard
- Empty / Loading / Error

---

# 26. Recommended Core Tokens

프로젝트 시작점으로 아래 값을 사용한다.

```css
:root {
  /* Typography */
  --font-sans:
    "NanumSquareNeo",
    "NanumSquare Neo",
    -apple-system,
    BlinkMacSystemFont,
    "Apple SD Gothic Neo",
    "Noto Sans KR",
    sans-serif;

  --text-xs: 12px;
  --text-sm: 14px;
  --text-md: 16px;
  --text-lg: 18px;
  --text-xl: 20px;
  --text-2xl: 24px;
  --text-3xl: 32px;
  --text-4xl: 40px;

  /* Brand */
  --color-primary: #4F7FD7;
  --color-primary-hover: #416FC4;
  --color-primary-soft: #EAF1FC;

  /* Text */
  --color-text-primary: #18212F;
  --color-text-secondary: #5E6A79;
  --color-text-tertiary: #7D8797;

  /* Surface */
  --color-bg: #F7F9FC;
  --color-surface: #FFFFFF;
  --color-surface-subtle: #F4F6F8;

  /* Border */
  --color-border: #DDE5EF;
  --color-border-subtle: #ECF0F5;

  /* Status */
  --color-success: #0F9B5C;
  --color-warning: #B7791F;
  --color-danger: #D6455D;

  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 40px;
  --space-8: 48px;
  --space-9: 64px;
  --space-10: 80px;

  /* Radius */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-full: 999px;

  /* Shadow */
  --shadow-sm: 0 2px 8px rgba(15, 35, 70, 0.06);
  --shadow-md: 0 8px 24px rgba(15, 35, 70, 0.10);
  --shadow-lg: 0 16px 40px rgba(15, 35, 70, 0.14);

  /* Layout */
  --container-max: 1200px;
  --sidebar-width: 320px;

  /* Z-index */
  --z-sticky: 100;
  --z-dropdown: 200;
  --z-overlay: 300;
  --z-drawer: 400;
  --z-modal: 500;
  --z-toast: 600;

  /* Motion */
  --duration-fast: 120ms;
  --duration-base: 180ms;
  --duration-slow: 240ms;
}
```

---

# 27. Definition of Done

UI 수정은 단순히 “예쁘게 보이는 것”으로 완료하지 않는다.

아래 조건을 모두 만족해야 완료다.

```text
✓ 디자인 토큰을 사용한다.
✓ 동일 역할의 UI가 동일하게 보인다.
✓ Desktop / Tablet / Mobile에서 깨지지 않는다.
✓ 360px에서도 사용할 수 있다.
✓ 키보드 사용이 가능하다.
✓ Focus 상태가 보인다.
✓ Hover / Active / Disabled 상태가 정의되어 있다.
✓ 콘텐츠와 기능이 임의로 변경되지 않았다.
✓ 새로운 Magic Number를 만들지 않았다.
✓ 다른 페이지에 Regression이 없다.
```

---

## 최종 원칙

> **새 스타일을 추가하기 전에 기존 규칙을 찾는다.  
> 새로운 예외를 만들기 전에 공통 규칙으로 해결한다.  
> 한 화면만 예쁘게 만드는 대신 전체 서비스가 같은 시스템으로 보이게 만든다.**
