---
layout: post
title: "Painting Star 개발기 5 — 리젝, 원인 분석, 재심사 통과"
date: 2026-04-23
category: painting-star
description: "ATT 구현 오류로 앱스토어 리젝당한 과정과 AppDelegate 레벨에서 해결한 방법"
---

심사 제출하고 다음날 리젝 메일이 왔다. 예상은 했다.

---

## 리젝 사유

Apple이 준 사유는 **Guideline 5.1.2 — Legal — Privacy — Data Use and Sharing**이었다.

요약하면 이렇다:

> ATT(App Tracking Transparency) 권한 요청이 광고 SDK 초기화보다 먼저 이뤄져야 한다.

내 코드는 ATT 요청을 JavaScript(WebView) 레벨에서 처리하고 있었다. 문제는 AdMob 네이티브 SDK가 WebView보다 먼저 초기화될 수 있다는 것. 타이밍이 보장이 안 된다.

Apple 가이드라인은 명확하다. 광고 SDK가 뜨기 전에 ATT가 먼저여야 한다.

---

## 원인

`AdManager.ts`에 이런 코드가 있었다.

```typescript
async initialize() {
  await this.requestTrackingAuthorization(); // JS 레벨 ATT
  await AdMob.initialize({ testingDevices: [] });
}
```

JS에서 ATT를 요청하고, 그 다음 AdMob을 초기화하는 흐름이다. 얼핏 보면 맞아 보이는데 문제가 있다.

Capacitor WebView가 뜨는 시점에 이미 네이티브 AdMob SDK가 초기화를 시작할 수 있다. JS는 WebView가 완전히 로드된 다음에야 실행된다. 순서가 꼬인다.

---

## 해결

네이티브 레벨에서 처리해야 한다. `AppDelegate.swift`에 직접 넣었다.

```swift
import AppTrackingTransparency

func applicationDidBecomeActive(_ application: UIApplication) {
    if #available(iOS 14, *) {
        ATTrackingManager.requestTrackingAuthorization { status in
            // 결과와 무관하게 AdMob은 이후에 초기화됨
        }
    }
}
```

`applicationDidBecomeActive`는 앱이 포그라운드로 올라오는 시점에 호출된다. WebView 로드나 AdMob 초기화보다 먼저 실행된다. 이게 Google이 공식 권장하는 방식이다.

`Info.plist`에 `NSUserTrackingUsageDescription`은 이미 있었으니 그대로 뒀다.

JS 쪽 ATT 로직은 삭제하지 않고 상태 확인만 하도록 남겼다. 네이티브가 이미 처리했으니 중복 요청은 안 된다.

---

## 재제출 프로세스

### 빌드 번호 올리기

같은 버전으로 재제출하려면 빌드 번호를 올려야 한다.

Xcode → TARGETS → App → General → Identity
- Version: `1.0` 유지
- Build: `1` → `2`

그다음 Product → Archive → Distribute App.

### Review Notes 작성

재제출할 때 Review Notes를 꼭 썼다. 심사관한테 뭘 수정했는지 설명하는 칸이다. 안 써도 되지만 쓰는 게 낫다.

```
The App Tracking Transparency permission dialog appears immediately
when the app becomes active for the first time, before any ads are loaded.

Implementation: ATT is requested in applicationDidBecomeActive in
AppDelegate.swift using ATTrackingManager.requestTrackingAuthorization,
before the AdMob SDK initialization.
```

기술적으로 정확하게 쓴다. 심사관도 사람이고, 무엇을 수정했는지 명확히 알면 통과가 빠르다.

---

## 심사 통과

재제출 후 약 24시간 만에 통과됐다.

리젝 받고 원인 파악해서 수정하고 재제출까지 하루도 안 걸렸다. Apple이 리젝 사유를 구체적으로 알려주기 때문에 방향은 명확하다. 겁먹을 필요 없다. 틀리면 수정하면 된다.

---

## 심사 통과 후: isTesting 제거

심사 중에는 `AdManager.ts`에 `isTesting: true`가 세 군데 있었다. 심사관한테 테스트 배너 보이면 안 되니까 켜뒀던 거다.

통과하자마자 전부 제거하고 Build 3으로 다시 올렸다.

```typescript
// 제거 전
await AdMob.showBanner({
  adId: BANNER_ID,
  isTesting: true, // ← 이거
});

// 제거 후
await AdMob.showBanner({
  adId: BANNER_ID,
});
```

실제 광고가 붙기 시작한 건 이 버전부터다.
