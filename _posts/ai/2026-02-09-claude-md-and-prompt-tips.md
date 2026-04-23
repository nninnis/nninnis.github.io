---
layout: post
title: "CLAUDE.md 작성법과 프롬프트 팁 - 리팩토링 실전 예시"
date: 2026-02-09
category: claude-code
---

Claude Code를 설치하고 "이거 고쳐줘"라고 말하면 뭔가 해준다. 그런데 결과물이 마음에 안 들 때가 있다. 내 프로젝트 컨벤션을 무시하거나, 이미 있는 유틸 함수를 새로 만들거나.

이유는 간단하다. **Claude가 프로젝트를 모른다.**

CLAUDE.md를 제대로 쓰면 달라진다.

---

## CLAUDE.md란

프로젝트 루트에 두는 마크다운 파일이다. Claude Code가 세션 시작할 때 자동으로 읽는다.

```
프로젝트/
├── CLAUDE.md        ← 이 파일
├── src/
├── package.json
└── ...
```

프로젝트의 컨텍스트를 담는다. 구조, 컨벤션, 주의사항. 사람한테 온보딩 문서 주듯이 Claude한테 주는 문서다.

---

## 기본 구조

```markdown
# 프로젝트 개요

한 줄 설명. 무슨 프로젝트인지.

## 기술 스택

- Frontend: React 18, TypeScript, Tailwind
- Backend: Spring Boot 3.2, Java 21
- DB: PostgreSQL 15

## 프로젝트 구조

src/
├── components/   # 재사용 UI 컴포넌트
├── pages/        # 라우트별 페이지
├── hooks/        # 커스텀 훅
├── utils/        # 유틸리티 함수
└── types/        # 타입 정의

## 코드 컨벤션

- 컴포넌트: PascalCase (Button.tsx)
- 함수/변수: camelCase
- 상수: UPPER_SNAKE_CASE
- 파일당 하나의 컴포넌트

## 중요 파일

- `src/utils/api.ts`: API 호출은 여기 있는 함수 사용
- `src/hooks/useAuth.ts`: 인증 관련 로직
- `src/types/index.ts`: 공통 타입 정의

## 주의사항

- console.log 커밋 금지
- any 타입 사용 금지
- 새 의존성 추가 전 확인 필요
```

---

## 효과적인 CLAUDE.md 작성 팁

### 1. 짧게 쓴다

Claude의 컨텍스트 윈도우는 무한하지 않다. 장황하게 쓰면 중요한 게 묻힌다.

**안 좋은 예:**
```markdown
이 프로젝트는 2023년에 시작되었으며, 초기에는 JavaScript로
작성되었다가 나중에 TypeScript로 마이그레이션되었습니다.
현재는 React 18을 사용하고 있으며...
```

**좋은 예:**
```markdown
React 18 + TypeScript 프로젝트. 이커머스 백오피스.
```

### 2. 실제로 필요한 것만 넣는다

모든 폴더 구조를 다 쓸 필요 없다. Claude가 헷갈릴 만한 것, 실수할 만한 것만.

```markdown
## 헷갈리기 쉬운 것

- `api/` vs `services/`: api는 HTTP 클라이언트, services는 비즈니스 로직
- `Button` vs `BaseButton`: Button은 스타일 포함, BaseButton은 래퍼용
```

### 3. 명령형으로 쓴다

설명보다 지시가 낫다.

**설명:**
```markdown
우리 팀은 보통 함수형 컴포넌트를 사용합니다.
```

**지시:**
```markdown
클래스 컴포넌트 쓰지 마라. 함수형으로.
```

---

## 프롬프트 팁

CLAUDE.md가 기본 컨텍스트라면, 프롬프트는 실시간 지시다.

### 패턴 1: 구체적으로

**모호함:**
```
이 코드 좀 개선해줘
```

**구체적:**
```
이 함수에서 중복 API 호출 제거해줘. 캐싱 써서.
```

### 패턴 2: 참조 파일 명시

```
src/utils/format.ts 보고 같은 스타일로
src/utils/validate.ts 만들어줘
```

기존 코드를 레퍼런스로 주면 컨벤션을 맞춘다.

### 패턴 3: 제약 조건 명시

```
외부 라이브러리 추가하지 말고, 기존 코드만으로 해결해줘
```

```
테스트 코드도 같이 작성해줘. Jest + React Testing Library로.
```

### 패턴 4: 단계별 요청

큰 작업은 나눠서.

```
1단계: 현재 코드 분석하고 문제점 알려줘
2단계: 리팩토링 계획 세워줘
3단계: 승인하면 실행해줘
```

한 번에 다 하라고 하면 중간에 방향이 틀어질 수 있다.

---

## 리팩토링 실전 예시

Spring Boot 프로젝트에서 실제로 있었던 케이스.

### 문제 상황

```java
// OrderService.java
public OrderResponse createOrder(OrderRequest request) {
    // 1. 재고 확인
    Product product = productRepository.findById(request.getProductId())
        .orElseThrow(() -> new RuntimeException("상품 없음"));
    if (product.getStock() < request.getQuantity()) {
        throw new RuntimeException("재고 부족");
    }

    // 2. 주문 생성
    Order order = new Order();
    order.setProductId(request.getProductId());
    order.setQuantity(request.getQuantity());
    order.setPrice(product.getPrice() * request.getQuantity());
    order.setStatus("PENDING");
    order.setCreatedAt(LocalDateTime.now());
    orderRepository.save(order);

    // 3. 재고 차감
    product.setStock(product.getStock() - request.getQuantity());
    productRepository.save(product);

    // 4. 응답 생성
    OrderResponse response = new OrderResponse();
    response.setOrderId(order.getId());
    response.setStatus(order.getStatus());
    response.setTotalPrice(order.getPrice());
    return response;
}
```

140줄짜리 서비스에 이런 메서드가 10개. 전형적인 트랜잭션 스크립트.

### CLAUDE.md 설정

```markdown
## 코드 스타일

- 서비스 메서드는 10줄 이내 유지
- 비즈니스 로직은 도메인 객체에
- RuntimeException 대신 커스텀 예외 사용
- setter 대신 생성자/빌더 패턴

## 기존 구조

- `src/main/java/.../exception/`: 커스텀 예외 클래스들
- `src/main/java/.../domain/`: 도메인 엔티티
```

### 프롬프트

```
OrderService.createOrder 메서드 리팩토링해줘.

요구사항:
1. 도메인 로직은 Order, Product 엔티티로 이동
2. 커스텀 예외 사용 (기존 exception 패키지 참고)
3. 빌더 패턴으로 객체 생성
4. 서비스는 흐름 제어만
```

### 결과

```java
// Product.java (도메인)
public void validateStock(int quantity) {
    if (this.stock < quantity) {
        throw new InsufficientStockException(this.id, this.stock, quantity);
    }
}

public void decreaseStock(int quantity) {
    validateStock(quantity);
    this.stock -= quantity;
}

// Order.java (도메인)
public static Order create(Product product, int quantity) {
    return Order.builder()
        .productId(product.getId())
        .quantity(quantity)
        .price(product.calculatePrice(quantity))
        .status(OrderStatus.PENDING)
        .createdAt(LocalDateTime.now())
        .build();
}

public OrderResponse toResponse() {
    return OrderResponse.builder()
        .orderId(this.id)
        .status(this.status.name())
        .totalPrice(this.price)
        .build();
}

// OrderService.java (서비스)
@Transactional
public OrderResponse createOrder(OrderRequest request) {
    Product product = productRepository.findById(request.getProductId())
        .orElseThrow(() -> new ProductNotFoundException(request.getProductId()));

    product.decreaseStock(request.getQuantity());
    Order order = Order.create(product, request.getQuantity());

    return orderRepository.save(order).toResponse();
}
```

서비스 메서드가 6줄로 줄었다. 비즈니스 로직이 도메인으로 들어갔다.

---

## 정리

| 구분 | 핵심 |
|------|------|
| CLAUDE.md | 프로젝트 컨텍스트. 짧고 명확하게. 지시형으로. |
| 프롬프트 | 구체적으로, 참조 파일 명시, 제약 조건 추가 |
| 큰 작업 | 단계별로 나눠서 요청 |

CLAUDE.md 잘 써두면 매번 같은 설명 안 해도 된다. 프롬프트는 그 위에서 구체적인 지시만 하면 된다.

"알아서 해줘"보다 "이렇게 해줘"가 낫고, "이렇게 해줘"보다 "여기 보고 이렇게 해줘"가 낫다.

