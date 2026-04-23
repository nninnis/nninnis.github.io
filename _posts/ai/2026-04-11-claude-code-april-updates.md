---
layout: post
title: "Claude Code 2026년 4월 업데이트 총정리 - 토큰 절약, 성능, Advisor Tool"
date: 2026-04-11
category: claude-code
---

v2.1.91 (4월 2일) 기준 최신 변경사항 정리. 토큰 절약, 성능, 답변 품질 세 카테고리로 나눴다.

---

## 토큰 절약

### Edit 도구 old_string 최소화 (v2.1.91)

파일 편집할 때 기준 문자열(old_string)을 더 짧게 잡는다. 출력 토큰이 직접 줄어든다.

체감 가장 큰 변경. 코드 수정 많이 하는 세션에서 효과 확실하다.

### MCP 스키마 캐시 최적화 (v2.1.90)

매 턴마다 MCP 툴 스키마를 `JSON.stringify`하던 불필요한 작업 제거. 캐시 효율과 처리 속도 둘 다 개선.

### Sonnet 4.6 자체 효율 향상

Claude Code 기본 모델인 Sonnet 4.6이 이전 버전보다 적은 토큰을 소비한다. 모델 레벨 최적화.

### 웹 검색 결과 사전 필터링

웹 검색/fetch 결과가 컨텍스트에 들어오기 전에 코드로 필터링한다. 불필요한 토큰 유입 자체를 차단.

### /clear 힌트 버그 수정 (v2.1.89)

"토큰 절약하려면 /clear 하세요" 힌트가 잘못된 수치를 보여주던 버그 수정. 현재 컨텍스트 크기가 아니라 누적 세션 토큰을 보여주고 있었다.

---

## 성능 향상

### Write 도구 Diff 계산 60% 향상

탭, `&`, `$`가 포함된 대용량 파일에서 diff 계산이 60% 빨라졌다. 실제 코드 작업 속도 체감 가능.

### SSE 스트리밍 처리 개선 (v2.1.90)

대용량 스트리밍 프레임 처리 성능 개선. 장시간 세션에서 응답 속도가 안정적이다.

### MCP 비동기 연결 옵션

```bash
MCP_CONNECTION_NONBLOCKING=true
```

`-p` 모드에서 MCP 연결 대기를 완전히 건너뛴다. `--mcp-config` 서버 연결도 가장 느린 서버 대기 대신 5초로 제한.

MCP 서버 여러 개 쓰는 환경에서 세션 시작 지연이 사라진다.

### stripAnsi Bun 최적화 (v2.1.91)

Bun 런타임에서 ANSI 이스케이프 제거가 빨라졌다. 터미널 렌더링 소폭 향상.

---

## 답변 품질 향상

### /claude-api 스킬 가이던스 강화 (v2.1.91)

Claude API로 에이전트 만들 때 설계 패턴, 컨텍스트 관리, 캐싱 전략에 대한 내부 가이던스가 강화됐다.

### Compaction API (Beta)

서버 사이드에서 컨텍스트를 자동 요약한다. 사실상 무한 대화 가능. Opus 4.6에서 사용 가능.

긴 세션에서 품질 저하 없이 대화를 계속할 수 있다.

### Advisor Tool (Beta)

여기가 핵심이다. 별도 섹션으로 다룬다.

---

## Advisor Tool 상세 분석

### 동작 방식

흔히 생각하는 "Opus가 먼저 계획 → Sonnet이 실행" 구조가 **아니다.**

**역전된 오케스트레이션:**

```
Sonnet/Haiku (Executor)
  │
  │ 작업 수행 (툴 호출, 결과 처리)
  │
  ├── 판단이 어려운 분기점 도달
  │       ↓
  │   advisor() 호출 → Opus가 전체 컨텍스트 리뷰
  │       ↓
  │   Opus: 계획/수정/중단신호 반환 (400~700 tokens)
  │       ↓
  └── Sonnet/Haiku: 조언 반영 후 작업 재개
```

Sonnet이 달리다가 막힐 때만 Opus한테 물어본다. Opus는 툴을 직접 호출하거나 사용자 대면 출력을 생성하지 않는다. 오직 Executor에게 guidance만 제공.

### advisor() 호출 시점

1. **본격적인 작업 시작 전** — 글쓰기, 접근 방식 확정, 전제 구축 전
2. **작업 완료 직전** — 단, 파일 저장/커밋 등 결과물을 먼저 만들어야 함 (advisor 호출 중 세션이 종료될 수 있으니)

파일 탐색 같은 오리엔테이션은 예외. 먼저 하고 나서 advisor 호출.

### 벤치마크

| 조합 | 벤치마크 | 결과 |
|------|----------|------|
| Sonnet + Opus Advisor | SWE-bench Multilingual | 74.8% (Sonnet 단독 72.1% 대비 +2.7p) |
| Sonnet + Opus Advisor | 비용 | 작업당 11.9% 절감 |
| Haiku + Opus Advisor | BrowseComp | 41.2% (Haiku 단독 19.7%의 2배 이상) |

Opus는 consultation당 400~700 tokens만 생성. Executor가 저렴한 레이트로 전체 출력을 처리하니까 Opus 단독보다 총 비용이 훨씬 낮다.

---

## Advisor Tool vs opusplan vs Ultraplan

이 세 가지 헷갈린다. 완전히 다른 레이어다.

| 구분 | Advisor Tool | opusplan | Ultraplan |
|------|--------------|----------|-----------|
| **레이어** | API (개발자용) | Claude Code 모델 설정 | Claude Code 명령어 |
| **작동 방식** | Sonnet이 필요시 Opus 자동 호출 | 플랜=Opus, 실행=Sonnet 자동 전환 | 플랜을 클라우드 CCR에 오프로드 |
| **Opus 개입** | 동적 — Sonnet이 판단해서 필요할 때만 | 정적 — plan mode 진입 시 항상 | 통째로 — 플랜 전체를 Opus가 생성 |
| **사용자 개입** | 불필요 | 불필요 | 브라우저에서 검토/승인 |
| **터미널 블로킹** | 없음 | 있음 | 없음 (클라우드 실행) |

### 한 줄 요약

| | |
|---|---|
| **Advisor Tool** | "Sonnet이 달리다가 막히면 그때 Opus한테 전화해" (API 레벨, 동적) |
| **opusplan** | "계획은 Opus가, 코딩은 Sonnet이" (정적 역할 분리) |
| **Ultraplan** | "플랜을 클라우드에 통째로 맡기고 나는 딴 거 해" (비동기 오프로드) |

### opusplan

`/model` 명령어에서 4번 옵션. Plan mode 진입 시 Opus, 실행 모드에서 Sonnet 4.6으로 자동 전환.

### Ultraplan

`/ultraplan` 명령어. Cloud Container Runtime(CCR)에서 Opus 4.6이 최대 30분까지 깊은 추론. 여러 Opus 에이전트가 병렬로 코드베이스 분석해서 로컬 단독 대비 약 4배 빠른 플랜 생성.

로컬 터미널은 플래닝 중에도 자유롭게 사용 가능.

---

## 요약 표

| 카테고리 | 주요 변경 | 버전 |
|----------|-----------|------|
| 토큰 절약 | Edit 도구 old_string 최소화 | v2.1.91 |
| 토큰 절약 | Sonnet 4.6 자체 효율 개선 | API 릴리즈 |
| 토큰 절약 | 웹검색 결과 사전 필터링 | API 릴리즈 |
| 성능 | Write diff 계산 60% 향상 | 최신 릴리즈 |
| 성능 | MCP 스키마 JSON.stringify 제거 | v2.1.90 |
| 성능 | MCP 비동기 연결 옵션 | 이전 릴리즈 |
| 품질 | Advisor Tool 베타 | API 베타 |
| 품질 | Compaction API — 무한 세션 | API 베타 (Opus 4.6) |

---

## 참고

Advisor Tool과 Compaction API는 현재 **API 레벨 베타**다. Claude Code 터미널에서 바로 쓸 수 있는 게 아니라 API 직접 호출 시 베타 헤더를 붙여야 한다.

MCP 기반으로 뭔가 만들고 있다면 Advisor Tool이 직접 관련된다. `advisor_20260301` 툴 타입 선언 하나로 Haiku 에이전트 품질을 Opus 수준으로 끌어올릴 수 있다 — 비용은 Sonnet 이하로 유지하면서.
