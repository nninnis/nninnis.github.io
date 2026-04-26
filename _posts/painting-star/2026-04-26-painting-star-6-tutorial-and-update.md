---
layout: post
title: "Painting Star 개발기 6 — 튜토리얼 설계, 1.1.0 업데이트, 안드로이드 준비"
date: 2026-04-26
category: painting-star
description: "출시 후 첫 업데이트: 튜토리얼 시스템 설계부터 세로모드 고정, 1.1.1 심사 대기까지"
---

출시하고 나서 가장 먼저 손을 댄 건 튜토리얼이었다.

---

## 왜 튜토리얼이 필요했나

1.0.0에는 튜토리얼이 없었다. 스테이지 1~4가 사실상 가이드 역할을 하니까 충분하다고 생각했다.

틀렸다. 지인들한테 플레이해보라고 했더니 생각보다 많은 사람이 어렵다고 했다. 나한테는 당연한 규칙인데 처음 보는 사람한테는 전혀 당연하지 않았다. 색이 누적된다는 것, 한 번 지나간 칸은 다시 못 간다는 것, 별에 도달할 때 색이 정확해야 한다는 것 — 이걸 텍스트 없이 전달해야 한다.

---

## 튜토리얼 설계 원칙

텍스트 설명은 안 쓰기로 했다. 글로벌 출시 기준이기도 하고, 팝업 읽는 유저는 드물다.

대신 **고정 레벨 3단계**로 규칙을 하나씩 가르친다.

```
Tutorial 1: 2×3, 빨강 구슬 하나 → 빨강 별
            → 색이 누적된다는 것을 가르침

Tutorial 2: 2×3, 빨강 → 빨강★ → 파랑 → 보라★
            → 두 색을 섞으면 새 색이 된다는 것

Tutorial 3: 3×3, 빨강 → 빨강★ → 파랑 → 보라★ → 흰 → 라벤더★
            → 세 가지 색 혼합, 흰색의 역할
```

세 레벨 전부 같은 뱀형(snake) 경로 패턴을 쓴다. 경로 모양 자체가 일관되어야 규칙 학습에 집중할 수 있다.

### 고정 레벨 생성

랜덤 생성과 별도로 `generateTutorialLevel(n: 1 | 2 | 3)`을 `PuzzleGenerator.ts`에 추가했다. 튜토리얼은 절차적 생성이 아니라 하드코딩.

```typescript
export function generateTutorialLevel(n: 1 | 2 | 3): LevelData {
  if (n === 1) {
    // 2×3  path: (0,0)→(0,1)→(0,2)→(1,2)→(1,1)→(1,0)
    // R marble at start, r★ target at end
    const grid = makeBlankGrid(2, 3);
    grid[0][0].type = 'R'; grid[0][0].source = SOURCE_MAP['R'];
    grid[1][0].type = 'r'; grid[1][0].target = TARGET_MAP['r'];
    return {
      name: 'Tutorial 1', rows: 2, cols: 3,
      grid,
      events: ['R', 'r'],
      solutionPath: [
        {row:0,col:0},{row:0,col:1},{row:0,col:2},
        {row:1,col:2},{row:1,col:1},{row:1,col:0},
      ],
    };
  }
  // ... Tutorial 2, 3 동일 패턴
}
```

---

## 온보딩 오버레이

튜토리얼 레벨 시작 전에 한 번만 보여주는 오버레이를 넣었다. "손가락으로 드래그해서 경로를 그리세요" 류의 최소한의 조작 안내.

`localStorage`로 표시 여부를 기록한다. 한 번 보면 다시 안 뜬다.

```typescript
this.tutorialPending = !localStorage.getItem('tutorialSeen');
if (!localStorage.getItem('onboardingSeen')) this.onboardingVisible = true;
```

버전이 올라갈 때(마이너 버전 기준) 기존 유저에게도 한 번 더 보여주도록 처리했다. 업데이트로 튜토리얼이 바뀌었을 수도 있으니까.

```typescript
// 버전 변경 감지 시 seen 플래그 초기화
localStorage.removeItem('tutorialSeen');
localStorage.removeItem('onboardingSeen');
```

---

## 힌트 애니메이션 개선

기존 힌트는 스테이지 1~4에서 경로 전체를 한 번에 보여줬다. 이걸 두 가지로 나눴다.

- **auto-hint**: 드래그 시작 전에 경로 전체를 pulse로 표시 (sin 파형으로 밝기 변조)
- **버튼 힌트**: 경로를 start → end로 순차 애니메이션 후 페이드아웃

```typescript
const elapsed = this.animTimer - this.hintAnimStart;
const drawProgress = Math.min(1, elapsed / this.HINT_ANIM_DURATION);
```

드래그를 시작하는 순간 auto-hint가 사라진다. 자연스럽게 손을 뗀다.

---

## 1.1.0 앱스토어 업데이트

위 튜토리얼 시스템을 올린 게 1.1.0이다. 리뷰 통과, 앱스토어에 올라가 있다.

---

## 1.1.1: 세로모드 고정 + UX 다듬기

1.1.0 올리고 나서 바로 발견한 문제들을 수정해서 1.1.1을 만들었다. 지금 심사 대기 중이다.

### 세로모드 고정

가로로 돌리면 레이아웃이 깨진다. 처음부터 세로 전용 게임인데 이걸 강제하지 않았다.

`Info.plist`에서 지원 방향을 세로만 남겼다.

```xml
<key>UISupportedInterfaceOrientations</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
</array>
<key>UISupportedInterfaceOrientations~ipad</key>
<array>
  <string>UIInterfaceOrientationPortrait</string>
  <string>UIInterfaceOrientationPortraitUpsideDown</string>
</array>
<key>UIRequiresFullScreen</key>
<true/>
```

iPad는 UpsideDown도 허용했다. 홈 버튼 없는 iPad에서 UpsideDown이 없으면 리젝 사유가 될 수 있다.

### 배너 광고 개선

기존 배너가 스플래시(로딩) 화면에서도 뜨는 문제가 있었다. `startBanner`를 별도로 분리해서 게임 화면에 진입한 후에만 배너가 로드되도록 수정했다.

로드 실패 시 재시도 로직도 추가했다. 최대 3회, 지수 백오프는 아니고 그냥 단순 재시도.

```typescript
private retryCount = 0;
private readonly MAX_RETRY = 3;

async onBannerFailedToLoad() {
  if (this.retryCount < this.MAX_RETRY) {
    this.retryCount++;
    await this.showBanner();
  }
}
```

### 튜토리얼 UX 다듬기

- 튜토리얼 진행 중 하단 버튼(힌트, 설정 등) 숨김. 튜토리얼 중에 설정 열 이유가 없다.
- 게임 화면에서 "Tutorial" 버튼 제거. 설정 패널 안에 Help + Tutorial을 같은 row 2컬럼으로 정리.
- 힌트 카운트다운(3-2-1) 진행 중 힌트 버튼 재입력 방지. 연속 탭하면 카운트다운이 꼬였다.

---

## 지금 상태와 다음 계획

| 버전 | 상태 |
|------|------|
| 1.0.0 | 앱스토어 출시 완료 |
| 1.1.0 | 앱스토어 업데이트 완료 (튜토리얼) |
| 1.1.1 | 심사 대기 중 (세로모드 고정, UX 개선) |

1.1.1이 통과되면 당분간 iOS 업데이트는 없다. 다음 목표는 안드로이드 출시다.

안드로이드는 1.1.1 기준으로 빌드한다. Capacitor가 코드 공유를 해주기는 하는데 AdMob App ID, RevenueCat 설정, 스토어 스크린샷은 전부 따로 준비해야 한다. 그 과정을 다음 편에 쓸 예정이다.
