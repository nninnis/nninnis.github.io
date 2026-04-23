---
title: "Painting Star 개발기 2 — Capacitor로 iOS 앱 만들기"
date: 2026-04-22
category: painting-star
description: "Phaser 웹앱을 Capacitor로 감싸서 실제 iPhone에서 돌아가게 하는 과정과 삽질들"
---

웹앱을 모바일 앱으로 바꾸는 방법은 여러 가지다. React Native처럼 처음부터 모바일 전용으로 짜는 방법, Cordova/Ionic 같은 하이브리드 프레임워크를 쓰는 방법, 그리고 Capacitor. 이미 Phaser로 돌아가는 게임이 있었으니 선택지는 좁았다. Capacitor로 웹앱을 그냥 WKWebView에 올리는 것.

## Capacitor 셋업

설정 자체는 단순하다.

```bash
npm install @capacitor/core @capacitor/cli @capacitor/ios
npx cap init
npx cap add ios
```

`capacitor.config.ts`에 번들 ID와 웹 디렉토리만 지정하면 된다.

```ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hsc.colorpath',
  appName: 'Painting Star',
  webDir: 'dist',
  ios: {
    contentInset: 'always',
  },
};
```

이후 워크플로우는 항상 같다.

```bash
npm run build
npx cap sync ios
npx cap open ios   # Xcode 열림
```

`cap sync`가 `dist/`를 iOS 프로젝트 안으로 복사하고 플러그인도 업데이트한다. 코드 바꿀 때마다 이 세 줄을 실행해야 한다는 게 처음엔 불편했는데 금방 익숙해졌다.

## 번들 ID 문제

처음엔 번들 ID를 `com.hsc.colorpath`로 설정했다. 그런데 앱 이름이 'Painting Star'인데 번들 ID가 colorpath면 나중에 관리가 꼬일 것 같아서 `com.hsc.paintingstar`로 바꿨다.

번들 ID를 바꾸면 건드려야 하는 곳이 여러 군데다.

- `capacitor.config.ts`의 `appId`
- Xcode의 Signing & Capabilities → Bundle Identifier
- `Info.plist`의 `CFBundleIdentifier`
- AdMob, RevenueCat 같은 서드파티 설정

특히 AdMob `Info.plist`에 박혀 있는 `GADApplicationIdentifier`를 놓치면 광고 초기화할 때 크래시가 난다. 체크리스트 없이 감으로 바꾸다가 한 번 놓쳤다.

## 화면 크기 적응

Phaser를 초기화할 때 고정 해상도(420×740)로 시작했다. 웹에서는 CSS scale로 맞추면 되지만, 실제 기기에서는 노치와 홈 인디케이터 영역을 고려해야 한다.

Safe Area를 무시하면 버튼이 홈 인디케이터에 걸린다. `WKWebView`의 `viewport-fit=cover`와 CSS `env(safe-area-inset-*)` 변수를 조합해서 캔버스 레이아웃을 잡았다.

결국 고정 해상도를 버리고 `window.innerWidth / window.innerHeight`로 동적 계산하는 방식으로 전환했다. Phaser 게임 크기를 기기 화면에 맞게 초기화하고, 내부 UI 좌표도 전부 비율로 계산한다. 작업량이 늘어났지만 어차피 해야 하는 작업이었다.

## 스플래시 스크린

Capacitor에는 스플래시 스크린 플러그인이 있다. 2732×2732 png를 준비해서 `Assets.xcassets`에 넣으면 된다.

문제는 Xcode가 스플래시 이미지를 세 장 요구한다는 것이다 — 1x, 2x, 3x. 결국 같은 이미지를 세 벌 준비했다. 앱 심사 전에 스플래시 이미지를 제거하는 방향으로 정리했다. 앱 로딩이 빠르면 스플래시가 굳이 필요 없다.

## 실제 기기 테스트

시뮬레이터와 실제 기기는 다르다. 시뮬레이터에서 멀쩡하게 돌던 게 실제 폰에서 다르게 보이는 경우가 여러 번 있었다.

가장 크게 달랐던 건 터치 응답이다. 시뮬레이터에서는 마우스 클릭으로 테스트하니까 실제 손가락 드래그의 느낌을 알 수 없다. 경로 그리기가 핵심 인터랙션인 게임이라 실기 테스트가 필수였다. 드래그 감도와 판정 범위를 실기에서 여러 번 수정했다.

Xcode에서 실기 빌드하려면 Apple Developer Program($99/년) 가입이 필요하다. 가입 전에는 7일짜리 무료 프로비저닝으로 본인 기기에만 설치할 수 있다. 개발 중에는 이걸로 충분하다.

## AdMob 배너와 레이아웃 충돌

배너 광고가 화면 하단에 붙으면 게임 버튼과 겹친다. AdMob은 배너 크기를 비동기로 알려주는데, `BannerAdPluginEvents.SizeChanged` 이벤트로 높이를 받아서 CSS 변수로 박아두는 방식을 썼다.

```ts
AdMob.addListener(BannerAdPluginEvents.SizeChanged, (info: { height: number }) => {
  document.documentElement.style.setProperty('--banner-height', `${info.height}px`);
});
```

게임 캔버스는 `--banner-height`만큼 위쪽으로 올라간다. 배너가 없을 때(광고 제거 구매자)는 변수를 0으로 세팅하면 레이아웃이 원래대로 돌아온다. 단순한 방법인데 깔끔하게 동작했다.

## 결과

Capacitor는 웹 기술 스택을 그대로 유지하면서 네이티브 앱을 만들 수 있는 가장 마찰 없는 방법이다. 플러그인 에코시스템도 충분하고, iOS/Android 동시 타겟도 코드베이스 하나로 커버된다.

다음 단계는 이 앱에 광고와 인앱결제를 붙이는 것이었다.
