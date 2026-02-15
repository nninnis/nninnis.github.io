---
layout: post
title: "Claude Code 토큰 절약 실전 가이드 - 비용 절반으로 줄이기"
date: 2026-02-14
category: claude-code
---

Claude Code 쓰다 보면 어느 순간 월 청구서가 무섭다. 토큰이 뭔지도 모르게 사라진다.

이 글은 이론 없이 실전만 다룬다. 지금 바로 적용 가능한 것들.

---

## 토큰이 어떻게 소비되는지 먼저

Claude Code의 컨텍스트 윈도우는 200k 토큰. 이 안에 이것저것 다 들어간다:

- 대화 전체 히스토리
- Claude가 읽은 파일 내용
- 실행한 명령어 결과
- CLAUDE.md 전체
- MCP 서버 도구 정의
- 시스템 프롬프트

문제는 **매 메시지마다 이 전체를 처리한다**는 것. 세션 초반에 디버깅하다 나온 스택트레이스, 읽었다가 안 쓴 파일, 이미 해결된 에러 로그 — 이게 다 뒤에 오는 질문의 비용에 포함된다.

**현재 사용량 확인 방법:**

| 명령어 | 대상 | 내용 |
|--------|------|------|
| `/context` | 모든 사용자 | 컨텍스트 윈도우 사용량 상세 분류 (시스템/도구/파일/대화) |
| `/cost` | API 키 사용자 | 세션 토큰 수 + 비용 |
| `/stats` | 구독제 사용자 | 일별 사용량, 세션 히스토리, 모델 선호도 |
| `/usage` | 구독제 사용자 | 플랜 한도 및 현재 속도 제한 상태 |

Claude Max/Pro 구독제는 토큰당 과금이 아니라 월정액이라 `/cost`가 의미 없다. `/stats`와 `/usage`를 쓴다.

---

## 1. 세션 관리 3가지 명령어

### `/clear` — 주제 바꿀 때 무조건

다른 작업으로 넘어갈 때 이전 대화를 끌고 가는 건 낭비다. 인증 버그 디버깅하다가 UI 작업하면, Claude는 UI 질문 하나에도 인증 디버깅 전체를 같이 처리한다.

```
작업 A 완료 → /clear → 작업 B 시작
```

세션 기록은 남는다. 컨텍스트만 초기화된다. `/resume`으로 다시 돌아올 수 있으니 `/rename`으로 이름 붙여두면 찾기 쉽다.

**언제 쓰나:**
- 완전히 다른 기능/영역으로 이동할 때
- 같은 문제로 2번 이상 틀린 방향으로 갔을 때 (오염된 컨텍스트 초기화)
- 하루 시작할 때

### `/compact` — 컨텍스트 50% 찼을 때

대화 전체를 요약해서 압축한다. 40개 메시지 디버깅 세션이 500토큰짜리 요약으로 줄어든다.

자동 압축은 95%에서 발동하는데, 그때까지 기다리면 늦다. 50~60% 즈음에 수동으로 하면 더 많은 맥락이 보존된다.

```
/compact 코드 변경 사항과 실패한 테스트 목록 위주로 요약해줘
```

무엇을 보존할지 지시할 수 있다. 그냥 `/compact`만 해도 되지만 중요한 정보가 있으면 명시하는 게 좋다.

### `/rewind` — 잘못된 방향 즉시 차단

Claude가 엉뚱한 방향으로 가고 있다 싶으면 `Esc` 두 번. 체크포인트로 되돌아간다.

**왜 중요하냐:** 잘못된 방향으로 10턴 더 가면 그 10턴 비용이 다 낭비다. 조기에 끊는 게 최선.

---

## 2. CLAUDE.md 다이어트

CLAUDE.md는 **매 메시지마다 컨텍스트에 들어간다**. 길면 길수록 모든 작업이 비싸진다. 게다가 너무 길면 Claude가 중요한 규칙을 놓친다.

**목표: 150줄 이하.**

### 들어가야 하는 것

```markdown
## 빌드/테스트 명령어
- 빌드: `npm run build`
- 테스트: `pytest tests/ -v`
- 린트: `npm run lint:fix`

## 헷갈리기 쉬운 것
- `api/` vs `services/`: api는 HTTP 클라이언트, services는 비즈니스 로직
- `Button` vs `BaseButton`: Button은 스타일 포함, BaseButton은 래퍼만

## 금지사항
- any 타입 사용 금지
- console.log 커밋 금지
- 외부 라이브러리 추가 전 확인
```

### 빼야 하는 것

- Claude가 코드 읽으면 알 수 있는 것 → 빼라
- 표준 언어/프레임워크 컨벤션 → 빼라 (Claude가 이미 안다)
- 상세 API 문서 → 링크로 대체
- 자주 바뀌는 정보
- 프로젝트 역사, 배경 설명

**리트머스 테스트:** "이 줄 지워도 Claude가 실수를 안 할까?" → 그럼 지워라.

### 경로별 규칙으로 분리

`.claude/rules/` 폴더에 파일을 만들면 특정 경로 작업할 때만 로드된다.

```markdown
---
paths:
  - "src/api/**/*.ts"
---

# API 개발 규칙
- 모든 엔드포인트에 입력 유효성 검사 필수
- 에러 응답은 표준 형식 사용: { error: string, code: string }
```

프론트엔드 작업할 때 백엔드 규칙이 컨텍스트에 없다. 반대도 마찬가지.

### 자주 안 쓰는 절차는 Skills로

`.claude/skills/` 안에 넣으면 호출할 때만 로드된다.

```markdown
<!-- .claude/skills/deploy/SKILL.md -->
---
name: deploy
description: 스테이징/프로덕션 배포 시 사용
---

# 배포 절차
1. `npm run build` 실행
2. 테스트 통과 확인
3. ...
(상세 배포 절차 전체)
```

CLAUDE.md에는 deploy skill이 있다는 것만 알면 된다. 내용 전체가 항상 로드될 필요 없다.

---

## 3. MCP 서버 — 가장 큰 낭비 원인

실측 데이터가 충격적이다.

한 개발자가 측정한 결과: **MCP 도구들이 66,000+ 토큰을 소비** — 첫 메시지 전에. 200k 컨텍스트의 33%가 메시지 한 줄 쓰기 전에 사라진다.

다른 케이스: 20개 도구 → 14,214토큰. 8개로 줄이니 → 5,663토큰. **도구 하나에 평균 710토큰.**

MCP 서버는 도구 스키마 전체가 시스템 프롬프트에 들어간다. 사용 안 해도 항상 자리 차지한다.

### 안 쓰는 MCP 서버 비활성화

```
/mcp
```

여기서 현재 서버 목록 확인하고 안 쓰는 거 끄면 된다.

### CLI 도구 우선

MCP보다 CLI가 훨씬 효율적이다.

```bash
# MCP GitHub 서버 대신
gh pr view 123
gh issue list --state open

# MCP AWS 서버 대신
aws s3 ls s3://my-bucket
aws logs get-log-events --log-group-name /app/prod
```

CLI 도구는 실제로 실행할 때만 토큰 소비. MCP는 접속만 해도 스키마 전체가 컨텍스트에 올라간다.

### 현재 컨텍스트 사용량 확인

```
/context
```

무엇이 얼마나 먹고 있는지 보인다. MCP가 대부분인 경우가 많다.

---

## 4. 서브에이전트로 탐색 작업 격리

코드베이스 탐색, 파일 읽기, 리서치 — 이런 작업은 토큰을 많이 쓴다. 근데 결과만 알면 된다.

서브에이전트는 자기 컨텍스트 윈도우에서 작업하고 요약만 돌려준다.

```
서브에이전트로 우리 인증 시스템 분석해줘.
토큰 리프레시 로직이 어디 있는지, 재사용할 수 있는 OAuth 유틸리티가 있는지 알려줘.
```

탐색하면서 읽은 파일 수십 개 — 전부 서브에이전트 컨텍스트에서 처리. 내 세션에는 결론만 온다.

built-in **Explore** 에이전트는 Haiku 모델로 동작한다. 빠르고 저렴하다.

---

## 5. .claudeignore — 안 읽어도 되는 파일 차단

`.gitignore`처럼 동작한다. Claude가 스캔하면 안 되는 디렉토리/파일 정의.

```
# .claudeignore
node_modules/
build/
dist/
.cache/
coverage/
*.log
*.lock
*.min.js
*.min.css
__pycache__/
.pytest_cache/
```

`node_modules`는 특히 중요하다. Claude가 거기서 뭔가 찾으려 하면 토큰이 폭발한다.

---

## 6. 훅으로 출력 전처리

테스트 실패 로그, 빌드 에러, API 응답 — Claude에게 raw 데이터 그대로 주면 비효율적이다.

훅을 쓰면 Claude가 보기 전에 전처리할 수 있다.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "~/.claude/hooks/filter-output.sh"
          }
        ]
      }
    ]
  }
}
```

```bash
#!/bin/bash
# filter-output.sh
# 테스트 명령어 결과면 실패한 것만 필터링
input=$(cat)
cmd=$(echo "$input" | jq -r '.tool_input.command // empty')

if [[ "$cmd" =~ ^(npm test|pytest|go test) ]]; then
  # FAIL, ERROR, error 포함 줄만 앞뒤 5줄씩
  echo "$input" | jq -r '.content' | grep -A 5 -B 1 -E "(FAIL|ERROR|error:)" | head -100
else
  echo "$input"
fi
```

10,000줄 테스트 로그 → 실패한 100줄. 극단적인 절감이다.

---

## 7. 프롬프트 습관

비용 차이가 나는 프롬프트 패턴들.

### 파일 경로 직접 명시

```
# 나쁜 예
로그인 버그 고쳐줘

# 좋은 예
src/auth/tokenRefresh.ts 에서 세션 만료 후 로그인 실패하는 버그.
재현 테스트 먼저 작성하고 수정해줘.
```

경로 모르면 Claude가 파일 탐색부터 시작한다. 탐색 = 토큰.

### 계획 먼저, 구현 나중

`Shift+Tab`으로 plan mode 진입. 코드 건드리기 전에 접근법 합의.

계획을 수정하는 건 저렴하다. 여러 파일에 퍼진 잘못된 코드를 되돌리는 건 비싸다.

단, 단순한 수정(오타, 간단한 리네임)은 plan mode 오버헤드가 더 크다. 복잡한 작업에만 쓴다.

### 검증 기준 제공

```
validateEmail 함수 만들어줘.
테스트 케이스: user@example.com → true, invalid → false, user@.com → false
구현 후 테스트 실행해줘.
```

검증 기준이 있으면 Claude가 스스로 확인한다. 없으면 내가 결과 확인하고 수정 요청하는 왕복이 생긴다.

---

## 8. 모델 선택

태스크마다 맞는 모델이 다르다. Opus가 항상 필요하지 않다.

| 작업 | 추천 모델 |
|------|-----------|
| 파일 읽기, 탐색, 단순 질문 | Haiku |
| 대부분의 코딩 작업 | Sonnet |
| 복잡한 아키텍처 설계, 어려운 버그 | Opus |
| 설계는 Opus, 구현은 Sonnet (하이브리드) | **opusplan** |

`/model`로 세션 중에도 전환 가능. Haiku는 Opus 대비 최대 5배 저렴하다.

### opusplan — 플래닝 Opus, 실행 Sonnet

`opusplan`은 Claude Code가 공식 지원하는 하이브리드 모델 앨리어스다.

- **Plan mode 진입 시**: Claude Opus 4.6 사용 → 아키텍처 결정, 복잡한 분석, 설계
- **코드 실행 시**: Claude Sonnet으로 자동 전환 → 파일 수정, 명령어 실행

Opus의 추론 품질은 유지하면서 구현 단계에서 Sonnet 비용으로 내려온다. 순수 Opus 대비 약 60% 비용 절감 효과.

```
# 세션 중 전환
/model opusplan

# 시작부터 설정
claude --model opusplan
```

복잡한 작업 구조: `Shift+Tab`으로 plan mode 진입 → Opus가 설계 → plan mode 해제 → Sonnet이 구현.

단순한 작업에는 오버킬이다. 아키텍처 결정이나 어려운 버그 분석이 포함된 세션에서 가치가 있다.

CI/CD 파이프라인이나 스크립트에서 Claude Code 쓴다면:

```bash
claude -p "테스트 실행하고 실패한 것만 보고해줘" --model claude-haiku-...
```

---

## 9. settings.json으로 영구 설정

매번 환경변수 export하기 귀찮다면 settings.json에 박아두면 된다.

### 파일 위치

| 범위 | 경로 | 용도 |
|------|------|------|
| 개인 전역 | `~/.claude/settings.json` | 모든 프로젝트에 적용 |
| 프로젝트 공유 | `.claude/settings.json` | git에 커밋, 팀 공유 |
| 프로젝트 로컬 | `.claude/settings.local.json` | .gitignore 처리, 개인 오버라이드 |

우선순위: 로컬 프로젝트 > 공유 프로젝트 > 개인 전역

### 토큰 절약 관련 설정 예시

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "model": "opusplan",
  "env": {
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
    "MAX_THINKING_TOKENS": "8000",
    "CLAUDE_AUTOCOMPACT_PCT_OVERRIDE": "70"
  }
}
```

각 설정의 의미:

**`DISABLE_NON_ESSENTIAL_MODEL_CALLS`**
팁, 제안 등 백그라운드 모델 호출을 끈다. 소량이지만 쌓인다.

**`MAX_THINKING_TOKENS`**
Extended thinking 토큰 예산. 기본값 31,999. 복잡한 작업 아니면 줄여도 된다. `0`으로 설정하면 thinking 완전히 비활성화. Opus 4.6 사용 시엔 이 대신 `CLAUDE_CODE_EFFORT_LEVEL` 사용 권장 (`"low"` / `"medium"` / `"high"`).

**`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE`**
자동 압축 발동 기준. 기본값 95(%). 낮출수록 더 일찍 압축한다. 70 정도로 설정하면 컨텍스트가 많이 차기 전에 압축돼서 중요한 맥락이 더 잘 보존된다.

### 팀 프로젝트 공유 설정

`.claude/settings.json`을 git에 커밋하면 팀 전체에 동일한 설정이 적용된다.

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "model": "opusplan",
  "env": {
    "DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1"
  },
  "permissions": {
    "deny": ["Read(./.env)", "Bash(rm -rf *)"]
  }
}
```

`.claude/settings.local.json`은 `.gitignore`에 추가해서 개인 설정 분리.

---

## 10. 기타 소소한 것들

```bash
# CI/CD에서 구조화된 출력으로 토큰 트래킹 (API 키 사용자)
claude -p "API 엔드포인트 목록 뽑아줘" --output-format json
```

`input_tokens`, `output_tokens`, `total_cost` 메타데이터가 같이 나온다. 자동화된 작업 비용 모니터링에 유용하다 (API 키 과금 방식일 때만 의미 있음).

---

## 실질적인 절감 순위

체감 임팩트 기준으로 정리:

| 방법 | 임팩트 |
|------|--------|
| 안 쓰는 MCP 서버 비활성화 | ★★★★★ |
| `/clear` 주제 전환 시 사용 | ★★★★★ |
| 서브에이전트로 탐색 격리 | ★★★★☆ |
| `/compact` 50%에서 수동 실행 | ★★★★☆ |
| CLAUDE.md 150줄로 다이어트 | ★★★☆☆ |
| `.claudeignore` 설정 | ★★★☆☆ |
| 파일 경로 명시 프롬프트 | ★★★☆☆ |
| 훅으로 출력 전처리 | ★★★★☆ (자동화 환경) |
| 경로별 규칙 분리 | ★★☆☆☆ |
| settings.json `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` 설정 | ★★☆☆☆ |
| `DISABLE_NON_ESSENTIAL_MODEL_CALLS` | ★☆☆☆☆ |

---

MCP 서버 하나가 700토큰이다. 20개면 14,000토큰. 안 쓰는 거 정리하는 게 제일 빠른 지름길이다.

나머지는 습관이다. `/clear`, `/compact`, 경로 명시 — 이 세 가지만 잘 해도 체감이 확연히 다르다.
