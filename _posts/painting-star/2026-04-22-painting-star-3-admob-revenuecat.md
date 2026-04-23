---
title: "Painting Star 개발기 3 — AdMob과 RevenueCat 연동기"
date: 2026-04-22
category: painting-star
description: "광고 수익화와 인앱결제를 붙이면서 겪은 시행착오들 — test 키 혼동, Sandbox 불통, ATT 권한 처리"
---

무료 게임 수익화는 두 가지로 귀결된다. 광고와 인앱결제. AdMob으로 광고를 붙이고, RevenueCat으로 '광고 제거' 인앱결제를 연동하기로 했다.

## AdMob 설정

`@capacitor-community/admob` 플러그인을 썼다. 배너, 전면광고, 보상형 광고 세 가지를 연동했다.

| 광고 종류 | 노출 시점 |
|---|---|
| 배너 | 항상 하단 표시 |
| 전면광고 | 클리어 10회 또는 실패 3회마다 |
| 보상형 광고 | 힌트(스테이지당 1회 무료 이후) / 퍼즐 재생성(3회 무료 이후) |

보상형 광고는 강제 노출이 아니라 사용자가 원할 때 보는 방식이라 거부감이 덜하다. 힌트와 재생성 버튼에 gold 테두리와 ▶ 배지를 붙여서 광고가 필요하다는 걸 미리 알려줬다.

### ATT 권한 처리

iOS 14부터 광고 추적 동의(ATT)를 받지 않으면 개인화 광고를 못 쓴다. AdMob 초기화 전에 반드시 요청해야 한다. 순서가 틀리면 ATT 팝업이 뜨지 않거나 무효 처리된다.

```ts
const { status } = await AppTrackingTransparency.getStatus();
if (status === 'notDetermined') {
  await AppTrackingTransparency.requestPermission();
}
await AdMob.initialize({});
```

`capacitor-plugin-app-tracking-transparency` 플러그인이 필요하고, `Info.plist`에 `NSUserTrackingUsageDescription` 키도 추가해야 한다. 이걸 빠뜨리면 App Store 심사에서 리젝된다.

### isTesting 플래그

개발 중에는 `isTesting: true`를 써야 한다. 실제 광고를 클릭해서 수익을 발생시키면 AdMob 정책 위반이다.

```ts
const options: BannerAdOptions = {
  adId: AD_IDS.banner,
  adSize: BannerAdSize.ADAPTIVE_BANNER,
  position: BannerAdPosition.BOTTOM_CENTER,
  isTesting: true, // AdMob 승인 전까지 유지
};
```

AdMob 계정 승인은 앱 출시 후 트래픽이 발생해야 이루어진다. 출시 전에는 테스트 광고만 볼 수 있다.

## RevenueCat 연동

StoreKit을 직접 다루지 않고 RevenueCat을 쓰기로 한 이유는 간단하다. 구매 복원, 영수증 검증, 기기 간 동기화를 처음부터 직접 구현하는 게 생각보다 복잡하다. RevenueCat이 이걸 대신 해준다.

### API 키 혼동

RevenueCat에는 API 키가 두 종류 있다. App Store Connect API 키(`SubscriptionKey_*.p8`)와 RevenueCat 자체 SDK 키(`appl_*`). 처음에 이 둘을 혼동해서 시간을 날렸다.

- **App Store Connect API 키**: RevenueCat 대시보드에서 앱 구성 시 등록. 인앱결제 상품 정보를 App Store에서 가져오는 데 쓰인다.
- **RevenueCat SDK 키**: 앱 코드에 박는 키. `Purchases.configure()`에 넣는 `appl_` 로 시작하는 문자열.

App Store Connect에서 키를 만들 때는 **In-App Purchase** 유형으로 만들어야 한다. 일반 API 키(`AuthKey_*.p8`)와 파일 이름 형식이 다르다. `SubscriptionKey_XXXXXXXX.p8`이면 맞는 키다.

### Sandbox 테스트 불통

인앱결제를 연동하고 실기 테스트를 해봤는데 "상품을 찾을 수 없습니다"가 계속 떴다. 로그를 보면 RevenueCat은 연결되는데 상품 목록이 비어있다.

원인을 찾는 데 시간이 걸렸다. App Store Connect에서 인앱결제 상품 상태가 `READY_TO_SUBMIT`인 상태에서는 Sandbox StoreKit이 상품을 반환하지 않는다는 게 핵심이었다. 앱을 App Store Connect에 한 번 업로드해야 상품 상태가 `WAITING_FOR_REVIEW`로 바뀌고 그때부터 Sandbox 테스트가 가능하다.

즉, 실제로 앱을 심사 제출하기 전까지는 인앱결제 Sandbox 테스트가 안 된다. 출시 전에 결제 플로우를 완전히 검증할 수 없다는 뜻이다.

### 구매 복원

RevenueCat은 `restorePurchases()`를 제공한다. Apple ID 단위로 구매 이력을 서버에서 조회해서 복원한다. 기기를 바꾸거나 앱을 재설치해도 복원된다.

```ts
const info = await Purchases.restorePurchases();
const entitlement = info.entitlements.active['remove_ads'];
if (entitlement) {
  localStorage.setItem('adsRemoved', 'true');
}
```

localStorage는 캐시 역할만 한다. 진실의 원천은 RevenueCat 서버(Apple ID 기반)다. 앱 시작 시 `getCustomerInfo()`를 호출해서 동기화한다.

## 광고 전략 설계

처음엔 전면광고 위주로 설계했다가 Rewarded Ad 중심으로 바꿨다. 이유는 세 가지다.

1. 전면광고는 타이밍이 나쁘면 사용자 경험을 깎는다
2. Rewarded Ad는 사용자가 선택한다 — 거부감이 다르다
3. 힌트/재생성 같은 "편의 기능"과 궁합이 잘 맞는다

`adsRemoved` 구매자는 전부 무제한 무료다. 광고 없이 플레이하고 싶은 사람은 한 번 구매하면 된다.

## 결과

AdMob + RevenueCat 조합은 무료 게임 수익화의 사실상 표준이다. 각각 독립적으로 초기화되고 간섭이 없다. Sandbox 테스트 제약은 불편하지만, 이건 Apple의 정책이라 어쩔 수 없다. 실제 결제 동작 확인은 앱 승인 후로 미뤘다.
