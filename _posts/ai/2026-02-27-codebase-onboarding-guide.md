---
layout: post
title: "처음 보는 코드베이스 빠르게 파악하기 - AI 시대의 온보딩"
date: 2026-02-27
category: dev
---

새 회사 첫 출근. 레포 클론하고 코드를 연다. 10만 줄. 폴더 50개. 문서는 2년 전에 멈춤.

"일단 코드 좀 보세요"라는 말과 함께 방치된다.

예전엔 2주가 기본이었다. 지금은 다르다. AI 도구를 제대로 쓰면 **하루 안에** 코드베이스의 큰 그림을 잡을 수 있다.

---

## 왜 코드 파악이 어려운가

| 장애물 | 설명 |
|--------|------|
| 암묵지 | 코드에 안 적힌 "왜 이렇게 했는지" |
| 레거시 | 더 이상 안 쓰는데 남아있는 코드 |
| 일관성 부재 | 사람마다, 시기마다 다른 스타일 |
| 부실한 문서 | 있어도 outdated, 없으면 없는 대로 |

전통적 방법: 시니어 붙잡고 물어보기, 코드 따라가기, 디버거로 추적하기.

효과는 있지만 **느리다.**

---

## 5분 안에 할 것: 전체 구조 파악

### 1. 디렉토리 구조 훑기

```bash
# 1단계 깊이만
ls -la

# 2단계까지
find . -maxdepth 2 -type d | head -50

# tree가 있으면
tree -L 2 -d
```

**핵심 파일부터 찾는다:**

```bash
# 설정 파일
ls -la *.json *.yaml *.toml 2>/dev/null

# 진입점
ls -la src/index.* src/main.* app.* main.* 2>/dev/null
```

### 2. 의존성 확인

```bash
# Node.js
cat package.json | head -50

# Python
cat requirements.txt 2>/dev/null || cat pyproject.toml 2>/dev/null

# Java/Kotlin
cat build.gradle 2>/dev/null || cat pom.xml 2>/dev/null | head -100
```

의존성 목록만 봐도 뭘 하는 프로젝트인지 대략 보인다:
- `express`, `fastify` → 웹 서버
- `prisma`, `typeorm` → DB 있음
- `react`, `vue` → 프론트엔드
- `jest`, `vitest` → 테스트 있음

### 3. Git 히스토리 훑기

```bash
# 최근 활동
git log --oneline -20

# 누가 많이 커밋했나
git shortlog -sn --no-merges | head -10

# 최근 많이 수정된 파일
git log --pretty=format: --name-only -50 | sort | uniq -c | sort -rn | head -20
```

자주 수정되는 파일 = 핵심 파일.

---

## AI로 코드베이스 질문하기

여기서부터 속도가 붙는다.

### Claude Code

```bash
# 터미널에서 바로
claude "이 프로젝트가 뭐하는 프로젝트인지 설명해줘"

claude "src 폴더 구조 분석해줘. 각 폴더가 뭘 담당하는지"

claude "이 프로젝트의 데이터 흐름 설명해줘. 요청이 들어와서 응답 나가기까지"
```

### Cursor

1. `Cmd+Shift+P` → "Cursor: New Composer"
2. `@Codebase` 태그로 전체 코드베이스 참조
3. 질문:

```
@Codebase 이 프로젝트의 아키텍처를 설명해줘.
주요 모듈과 그 관계를 알려줘.
```

### 효과적인 질문 패턴

**레벨 1: 전체 구조**
```
- 이 프로젝트가 뭐하는 프로젝트야?
- 메인 기술 스택이 뭐야?
- 핵심 모듈/패키지가 뭐야?
```

**레벨 2: 흐름 이해**
```
- 사용자 로그인 흐름 따라가줘
- API 요청이 들어오면 어디서 처리돼?
- 데이터베이스 스키마 구조 알려줘
```

**레벨 3: 특정 기능**
```
- 결제 로직이 어디 있어?
- 에러 핸들링 어떻게 하고 있어?
- 인증/인가 어떤 방식이야?
```

---

## 핵심 파일 빠르게 찾기

### 패턴으로 찾기

```bash
# 라우터/컨트롤러
find . -name "*router*" -o -name "*controller*" -o -name "*handler*" | grep -v node_modules

# 서비스 레이어
find . -name "*service*" -o -name "*usecase*" | grep -v node_modules

# 모델/엔티티
find . -name "*model*" -o -name "*entity*" -o -name "*schema*" | grep -v node_modules

# 설정
find . -name "*config*" | grep -v node_modules
```

### 내용으로 찾기

```bash
# 특정 API 엔드포인트 찾기
grep -r "POST.*\/api\/users" --include="*.ts" --include="*.js"

# 환경변수 사용 위치
grep -r "process.env\." --include="*.ts" | head -20

# 데이터베이스 쿼리
grep -r "SELECT\|INSERT\|UPDATE" --include="*.ts" --include="*.java" | head -20
```

### AI에게 찾아달라고 하기

```
인증 관련 코드 어디 있어? 파일 경로랑 핵심 함수 알려줘.
```

이게 더 빠르다.

---

## 실행해보기

코드만 보는 것보다 실행이 낫다.

### 1. 로컬 실행

```bash
# README 확인
cat README.md

# 없으면 AI한테 물어보기
claude "이 프로젝트 로컬에서 실행하려면 어떻게 해?"
```

### 2. 테스트 실행

```bash
# 테스트 있는지 확인
ls -la test/ tests/ __tests__/ spec/ 2>/dev/null

# 테스트 실행
npm test
# 또는
pytest
# 또는
./gradlew test
```

테스트 코드는 **사용 예시 문서**다. 이 함수가 어떻게 쓰이는지 보여준다.

### 3. 디버거로 따라가기

가장 확실한 방법. 진입점에 브레이크포인트 걸고 요청 보내면서 따라간다.

---

## 30분 온보딩 플레이북

| 시간 | 할 일 |
|------|-------|
| 0-5분 | 디렉토리 구조, package.json/build.gradle 확인 |
| 5-10분 | AI에게 "프로젝트 개요 설명해줘" 질문 |
| 10-15분 | 핵심 파일 찾기 (라우터, 서비스, 모델) |
| 15-20분 | 로컬 실행 시도 |
| 20-25분 | 특정 기능 하나 선택해서 흐름 따라가기 |
| 25-30분 | 모르는 것 정리, 질문 목록 만들기 |

30분이면 "뭘 모르는지"를 알게 된다. 그게 시작이다.

---

## CLAUDE.md / CURSOR.md 읽기

프로젝트에 AI 설정 파일이 있으면 꼭 읽는다.

```bash
cat CLAUDE.md 2>/dev/null
cat .cursorrules 2>/dev/null
cat .cursor/rules/*.md 2>/dev/null
```

팀이 AI에게 어떤 컨텍스트를 주고 있는지 보면 프로젝트 컨벤션을 빠르게 파악할 수 있다.

없으면? **직접 만든다.** 파악한 내용을 정리하면서.

---

## 질문하는 법

시니어한테 물어볼 때도 요령이 있다.

**안 좋은 질문:**
```
이 코드 뭐예요?
```

**좋은 질문:**
```
OrderService.createOrder 보고 있는데,
여기서 재고 차감이 Product 엔티티에서 하는 게 아니라
서비스에서 직접 하고 있더라고요.
의도적으로 이렇게 한 건가요, 아니면 리팩토링 대상인가요?
```

**핵심:**
1. 먼저 코드를 봤다
2. 구체적인 위치를 말한다
3. 내 이해/가설을 밝힌다
4. 맞는지 확인한다

시니어 시간 아끼면서 정확한 답을 얻는다.

---

## 모르는 게 당연하다

10만 줄 코드베이스를 하루에 다 이해할 수는 없다. 목표는 **전문가가 되는 것**이 아니라:

- 프로젝트가 뭘 하는지 안다
- 어디서 뭘 찾아야 하는지 안다
- 모르면 어떻게 알아내는지 안다

첫 PR을 올릴 수 있으면 된다. 나머지는 일하면서 쌓인다.

---

## 정리

| 단계 | 방법 |
|------|------|
| 구조 파악 | `tree -L 2`, 의존성 파일, git log |
| 전체 이해 | AI에게 질문 (프로젝트 개요, 아키텍처) |
| 핵심 찾기 | 패턴 검색, AI 질문 |
| 검증 | 로컬 실행, 테스트 실행, 디버거 |
| 정리 | CLAUDE.md 작성, 질문 목록 |

예전엔 코드 읽는 게 기술이었다. 지금은 **질문하는 게 기술**이다.

AI한테 "이 코드 설명해줘"라고 하면 설명해준다. 2년차도 10년차 수준의 코드 파악 속도를 낼 수 있다.

단, 설명을 **검증**하는 건 본인 몫이다. AI가 틀릴 수 있다. 실행하고, 테스트 돌리고, 디버거로 확인한다.

도구가 바뀌면 일하는 방식도 바뀐다. 코드 파악도 마찬가지다.

