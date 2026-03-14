# CLAUDE.md - Project Context

## Project Overview
- Jekyll 기반 GitHub Pages 블로그 (nninnis.github.io)
- 저자: nninnis (현업 개발자, Spring/Java 백엔드 + 인디게임 개발 병행)
- 주제: Claude Code 실전 사용법, AI 코딩 도구, 개발 방법론, 직접 만든 미니게임
- 언어: 한국어 (비격식체 -다/-한다 체)
- 테마: 커스텀 (다크/라이트 토글 지원)

## Tech Stack
- Jekyll static site generator
- GitHub Pages 호스팅
- Plugins: jekyll-feed, jekyll-seo-tag
- permalink: pretty

## Project Structure
```
_config.yml          - Jekyll 설정 (title: nninnis, description: 개발 기록)
_layouts/
  default.html       - 기본 레이아웃 (테마 토글 포함, 시스템 다크모드 감지)
  post.html          - 포스트 레이아웃 (nav: home/about/archive, 날짜/카테고리)
_posts/              - 블로그 포스트 (markdown)
assets/
  main.css           - 전체 스타일
  images/            - 게임 컨셉아트 등 이미지
games/
  light-collector/   - Light Collector 게임 (힐링 슈팅, HTML5 Canvas)
  color-path/        - Color Path Puzzle 게임 (색 혼합 경로 퍼즐)
  wowlike-proto/     - WOWLIKE PROTO 게임 (WoW 전투 시스템 idle RPG)
```

## Blog Identity & Tone

### 저자 프로필
- 한국 현업 웹개발자 (Java/Spring + IntelliJ 주력)
- Claude Code 헤비 유저 (Cursor도 병행)
- 언리얼 엔진 인디게임 개발 진행 중 (HTML/JS 프로토타이핑 → UE 이식)
- AI 도구를 단순 보조가 아닌 도메인별 파트너로 활용 (Claude: 코드, Gemini: 아트, Meshy: 3D)

### 문체 & 논조
- **비격식 한국어**: "-다", "-한다" 체. 경어 없음
- **짧고 직접적인 문장**: 긴 설명보다 간결한 단문 선호
- **1인칭 실전 경험**: "나는 IntelliJ를 쓴다", "내가 실제로 쓰는 방식" 등 개인 경험 녹임
- **냉소 없는 비판적 시각**: 통념 vs 데이터 대조 (예: "AI 쓰면 빨라진다" vs METR 연구)
- **실용주의**: 이론 최소화, 지금 바로 적용 가능한 내용 위주
- **데이터 기반**: 주장에 연구/설문 출처 제시 (Stack Overflow, METR, GitGuardian 등)
- **인트로 짧음**: 1~3문장으로 문제 제기 또는 주제 직접 제시
- **명령형 지시**: 설명보다 지시형 문장 선호 ("쓴다", "한다", "빼라", "써라")

### 감성 & 철학
- 도구에 대한 실용적 태도: 좋은 건 좋다고, 나쁜 건 나쁘다고 솔직하게
- "알아서 해줘"보다 "이렇게 해줘"가 낫고, "이렇게 해줘"보다 "여기 보고 이렇게 해줘"가 낫다
- 검증하고, 이해하고, 판단하라 — 바이브에 몸 맡기지 말 것
- 게임 개발: 양산형 공식을 따르지 않는 전략적 깊이 추구

## Post Structure Convention

### Frontmatter
```yaml
---
layout: post
title: "제목"
date: 2026-02-01
category: claude-code  # claude-code | ai | dev | game
---
```
- game 포스트는 `description` 필드도 추가 (SEO)

### 포스트 구조 패턴
1. **인트로** (1~3문장): 문제 제기 또는 직접 주제 제시
2. **`---` 구분선**: 섹션 전환 시 수평선으로 리듬 부여
3. **`##` 소제목**: 굵은 요약, 행동 중심 네이밍
4. **코드 블록**: 실전 예시 풍부하게 (bash, java, yaml, markdown 등)
5. **표**: 비교/요약에 markdown 표 자주 활용
6. **인용문 (`>`)**: 외부 발언/연구 결과 인용
7. **마무리**: 짧은 결론 또는 핵심 한 줄 요약
8. **출처 섹션**: 데이터/연구 인용 시 `## 출처` 섹션

### 카테고리별 특성
- `claude-code`: 설치/설정법, 실전 팁, 비용 절약 — 실용 가이드 성격
- `ai`: AI 트렌드 비판적 분석, 보안, 개발자 생존법 — 데이터 인용 많음
- `dev`: 개발 방법론, 온보딩, 도구 활용 — 실무 중심
- `game`: 직접 만든 게임 소개 + iframe 임베딩 + 개발 의도/배경 설명

## Design Philosophy

### 미니멀리즘
- 불필요한 시각 요소 없음. 텍스트와 코드 블록 중심
- 화려한 그래픽 대신 타이포그래피 가독성에 집중
- 컬러: 다크/라이트 두 가지 모드만. 시스템 preference 자동 감지 + 수동 토글
- 레이아웃: 단일 컬럼, 좌우 여백, 명확한 위계 (nav > article > footer)

### 컴포넌트 구성
- nav: home / about / archive 세 링크만
- 날짜 형식: YYYY.MM.DD
- 포스트 하단: 이전/다음 글 네비게이션
- 게임 포스트: iframe으로 인터랙티브 콘텐츠 임베딩 (전체화면 링크 포함)

## Key Decisions & Patterns

### Game Embedding
- 게임은 iframe으로 블로그 포스트에 임베딩 (CSS 격리 목적)
- 게임의 aggressive CSS (global resets, 100vw/100vh, overflow:hidden, position:fixed)가 블로그 레이아웃을 깨뜨리므로 iframe 필수
- 반응형 iframe: padding-top % 트릭으로 비율 유지 (light-collector: 75%, wowlike: 65%)
- 전체화면 링크 패턴: `<a href="/games/[name]/" target="_blank">전체 화면으로 플레이 &rarr;</a>`

### Mobile/Touch Handling (Light Collector 기준)
- iOS Safari에서 iframe 내 `pointerdown` 이벤트가 불안정 → `touchstart` 사용 필수
- Touch 디바이스 감지: `"ontouchstart" in window`
- 모바일 조작: 드래그로 상대 이동 (delta 기반), 손 떼면 발사
  - `lastTouchX`로 이전 터치 위치 추적, `dx = currentX - lastTouchX`로 이동량 계산
  - 터치 시 플레이어 순간이동 방지 (touchstart에서는 위치만 기록, 이동 없음)
- Touch ID 추적 (`moveTouchId`, `Touch.identifier`)
- UI 오버레이(mainUI z-index:20, overlay z-index:30)가 canvas 터치를 가로채는 문제 → 오버레이에도 touch 핸들러 추가

### Projectile (Wave) System (Light Collector)
- 별 모양 발사체: `drawStar()` 헬퍼로 5-point star 렌더링 (3레이어: glow + outer star + core)
- 모바일 발사체 1.5배 확대 (시각 크기 + 히트박스): `isTouchDevice ? 1.5 : 1` 스케일 적용
- 히트박스: 모바일 `r: 11`, 데스크톱 `r: 7`

### CSS/UI
- 게임 HUD: position:fixed, z-index:10
- mainUI (시작 화면): z-index:20, pointer-events:auto
- overlay (게임오버): z-index:30

## Known Issues & Solutions
1. **iOS Safari iframe 터치**: `pointerdown` 대신 `touchstart` 사용
2. **UI 오버레이 터치 차단**: mainUI, overlay에 별도 touchstart 핸들러 추가
3. **모바일 터치 순간이동 방지**: delta 기반 상대 이동 (`lastTouchX` 추적, touchstart에서 위치만 기록)
4. **게임 CSS 블로그 오염**: iframe 임베딩으로 격리
5. **모바일 난이도 조정**: 발사체 시각/히트박스 1.5배 확대로 모바일 조작 보완

## Commit Convention
- 커밋 메시지: 영문, 간결한 1-2문장
- Co-Authored-By: Claude 포함
- 커밋/푸시는 사용자 명시적 요청 시에만 수행
