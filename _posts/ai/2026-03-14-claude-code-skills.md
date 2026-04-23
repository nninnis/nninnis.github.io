---
layout: post
title: "Claude Code Skills - Claude를 확장하는 SKILL.md 완전 가이드"
date: 2026-03-14
category: claude-code
---

Claude Code에는 `/` 로 시작하는 커맨드들이 있다. `/simplify`, `/batch` 같은 것들. 그리고 직접 만들 수 있다.

이게 **Skills**다.

`SKILL.md` 파일 하나로 Claude의 행동 방식을 확장한다. 반복 프롬프트를 커맨드로 만드는 수준이 아니다. Claude가 스스로 판단해서 skill을 꺼내 쓰게 만들거나, 격리된 subagent에서 실행하거나, 스크립트를 번들해서 돌릴 수 있다.

---

## 기본 개념

Skill은 `.claude/skills/<이름>/SKILL.md` 파일이다.

```
.claude/
└── skills/
    └── review/
        └── SKILL.md    ← /review 커맨드가 된다
```

파일 구조를 보면 알 수 있듯이, skill은 **디렉토리** 단위다. `SKILL.md`가 진입점이고, 같은 디렉토리에 지원 파일을 둘 수 있다.

```
review/
├── SKILL.md           # 필수. 주요 지침
├── checklist.md       # 필요할 때 읽는 참조 파일
└── scripts/
    └── lint.sh        # Claude가 실행할 수 있는 스크립트
```

---

## SKILL.md 구조

파일은 두 부분으로 나뉜다.

```yaml
---
name: review
description: 코드 리뷰. PR 변경사항 검토할 때 사용.
---

현재 변경된 코드를 리뷰해줘.

- 버그 가능성
- 성능 문제
- 보안 취약점

심각도(낮음/중간/높음)와 함께 알려줘.
```

상단 `---` 사이가 **YAML frontmatter**다. Claude에게 이 skill이 무엇인지, 언제 쓰는지 알려준다.

그 아래가 실제 프롬프트다. `/review` 를 입력하면 이 내용이 Claude에게 전달된다.

---

## Skills가 위치하는 곳

| 위치 | 경로 | 적용 범위 |
|------|------|----------|
| 개인 | `~/.claude/skills/<이름>/SKILL.md` | 내 모든 프로젝트 |
| 프로젝트 | `.claude/skills/<이름>/SKILL.md` | 이 프로젝트만 |
| Enterprise | 관리 설정 | 조직 전체 |

우선순위: Enterprise > 개인 > 프로젝트. 같은 이름이면 위 순서대로 덮어씌운다.

Git에 커밋하면 팀 공유된다.

> 예전에 쓰던 `.claude/commands/파일명.md` 형식도 계속 작동한다. 하지만 Skills가 더 많은 기능을 지원하므로 Skills로 쓰는 걸 권장한다.

---

## Skills의 핵심: 두 가지 호출 방식

여기가 중요하다. Skills는 두 가지 방식으로 실행된다.

### 1. 직접 호출 (사용자 → `/skill-name`)

```
/review
/deploy production
/test UserService
```

사용자가 명시적으로 실행한다.

### 2. 자동 호출 (Claude가 판단해서 로드)

`description`을 보고 Claude가 스스로 판단한다.

```yaml
---
name: explain-code
description: 코드 작동 방식을 시각적 다이어그램과 유추로 설명. "이게 어떻게 작동해?", "설명해줘" 같은 질문에 사용.
---
```

이 skill이 있으면 사용자가 "이 함수가 어떻게 작동하는 거야?"라고 물어볼 때 Claude가 자동으로 이 skill을 꺼낸다. `/explain-code` 안 입력해도.

---

## Frontmatter 필드 정리

```yaml
---
name: deploy
description: 운영 배포 실행
disable-model-invocation: true
allowed-tools: Bash, Read
model: claude-opus-4-6
context: fork
agent: Explore
argument-hint: "[환경명]"
user-invocable: true
---
```

| 필드 | 기본값 | 설명 |
|------|--------|------|
| `name` | 디렉토리명 | 슬래시 커맨드 이름 |
| `description` | 첫 문단 | Claude가 자동 호출 여부 판단에 사용. 적을수록 손해 |
| `disable-model-invocation` | `false` | `true`면 Claude 자동 호출 없음. 사용자만 실행 가능 |
| `user-invocable` | `true` | `false`면 `/` 메뉴에서 숨김. Claude만 사용 가능 |
| `allowed-tools` | - | 이 skill 실행 중 승인 없이 쓸 수 있는 도구 |
| `model` | 기본 모델 | 이 skill 전용 모델 지정 |
| `context` | - | `fork`로 설정 시 격리된 subagent에서 실행 |
| `agent` | `general-purpose` | `context: fork`일 때 사용할 subagent 유형 |
| `argument-hint` | - | 자동완성에 표시되는 인자 힌트 |

---

## 호출 제어: 누가 실행하나

`disable-model-invocation`과 `user-invocable` 두 필드로 제어한다.

| 설정 | 사용자 호출 | Claude 자동 호출 | 컨텍스트 로드 |
|------|:-----------:|:----------------:|:-------------:|
| (기본값) | O | O | 설명 항상, 내용은 호출 시 |
| `disable-model-invocation: true` | O | X | 설명도 없음, 호출 시에만 |
| `user-invocable: false` | X | O | 설명 항상, 내용은 호출 시 |

### 언제 어떻게 쓰나

**`disable-model-invocation: true`** — 배포, 커밋, 슬랙 메시지 전송처럼 부작용이 있는 작업. Claude가 "코드가 준비된 것 같으니 배포할게요"라고 멋대로 실행하면 안 된다.

```yaml
---
name: deploy
description: 운영 서버 배포
disable-model-invocation: true
---

$ARGUMENTS 환경에 배포한다:
1. 테스트 실행
2. 빌드
3. 배포
4. 헬스체크 확인
```

**`user-invocable: false`** — 배경 지식 성격의 skill. 사용자가 직접 실행할 이유는 없지만 Claude는 참고해야 할 때.

```yaml
---
name: legacy-context
description: 레거시 결제 모듈 작동 방식. 결제 관련 코드 수정 시 참고.
user-invocable: false
---

이 결제 모듈은 2019년에 작성되어...
(레거시 시스템 설명)
```

---

## 인자 전달

### 기본: $ARGUMENTS

```yaml
---
name: fix-issue
description: GitHub 이슈 번호로 수정
disable-model-invocation: true
---

GitHub 이슈 $ARGUMENTS를 수정해줘.

1. 이슈 내용 읽기
2. 요구사항 파악
3. 수정 구현
4. 테스트 작성
5. 커밋
```

```
/fix-issue 1234
```

`$ARGUMENTS` 자리에 `1234`가 들어간다.

### 위치별 인자: $ARGUMENTS[N] / $N

```yaml
---
name: migrate
description: 컴포넌트 프레임워크 마이그레이션
---

$0 컴포넌트를 $1에서 $2로 마이그레이션해줘.
기존 동작과 테스트를 유지해.
```

```
/migrate SearchBar React Vue
```

`$0` = `SearchBar`, `$1` = `React`, `$2` = `Vue`.

### 내장 변수

| 변수 | 설명 |
|------|------|
| `$ARGUMENTS` | 전달된 모든 인자 |
| `$ARGUMENTS[N]` | N번째 인자 (0부터 시작) |
| `$N` | `$ARGUMENTS[N]` 약자 |
| `${CLAUDE_SESSION_ID}` | 현재 세션 ID |
| `${CLAUDE_SKILL_DIR}` | 이 SKILL.md 파일이 있는 디렉토리 경로 |

`${CLAUDE_SKILL_DIR}`은 스크립트 참조할 때 유용하다.

```yaml
python ${CLAUDE_SKILL_DIR}/scripts/analyze.py
```

현재 작업 디렉토리가 어디든 skill에 번들된 스크립트를 정확히 가리킨다.

---

## 동적 컨텍스트 주입

`` !`명령어` `` 구문을 쓰면 skill 실행 전에 shell 명령어가 먼저 돌고, 그 출력이 자리에 삽입된다.

```yaml
---
name: pr-summary
description: PR 변경사항 요약
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## PR 정보
- 변경 내용: !`gh pr diff`
- 코멘트: !`gh pr view --comments`
- 변경 파일: !`gh pr diff --name-only`

위 PR을 요약해줘. 주요 변경사항, 리뷰어가 집중해야 할 부분 포함.
```

Claude가 보기 전에 `gh pr diff`가 실행되고, 실제 diff 내용이 자리에 채워진다. Claude는 최종 결과만 받는다.

실시간 데이터가 필요한 skill에서 강력하다.

---

## Subagent 실행: context: fork

`context: fork`를 쓰면 skill이 격리된 subagent에서 실행된다. 현재 대화 기록에 접근하지 않는다. 독립적인 작업에 적합하다.

```yaml
---
name: deep-research
description: 특정 주제 심층 분석
context: fork
agent: Explore
---

$ARGUMENTS를 철저히 분석해줘:

1. Glob, Grep으로 관련 파일 찾기
2. 코드 읽고 분석
3. 구체적인 파일 경로와 함께 결과 정리
```

실행되면:
1. 새로운 격리 컨텍스트 생성
2. subagent가 skill 내용을 프롬프트로 받음
3. `agent` 필드로 지정한 타입의 에이전트가 실행 (기본: `general-purpose`)
4. 결과가 메인 대화로 반환

`agent` 옵션: `Explore` (읽기 전용 탐색), `Plan` (계획 수립), `general-purpose`, 또는 `.claude/agents/`에 정의한 커스텀 subagent.

---

## 지원 파일 추가

SKILL.md 하나에 모든 내용을 다 넣을 필요 없다. 상세 내용은 별도 파일로 분리하고, SKILL.md에서 참조한다.

```
review/
├── SKILL.md
├── checklist.md        # 상세 체크리스트
├── examples/
│   └── good-review.md  # 좋은 리뷰 예시
└── scripts/
    └── count-issues.sh # Claude가 실행할 스크립트
```

`SKILL.md`에서 참조:

```markdown
상세 체크리스트는 [checklist.md](checklist.md) 참고.
예시 리뷰는 [examples/good-review.md](examples/good-review.md) 참고.
```

SKILL.md는 **500줄 이하**로 유지하는 걸 권장한다. 상세 내용은 별도 파일로.

---

## 번들 Skills

Claude Code에 기본 탑재된 skills다.

| 커맨드 | 설명 |
|--------|------|
| `/simplify` | 최근 변경 파일을 3개 에이전트가 병렬로 검토. 코드 재사용, 품질, 효율성 관점 |
| `/batch <지시>` | 코드베이스 전체 대규모 변경을 병렬 처리. 5~30개 단위로 분해 후 각 단위별 에이전트 생성 |
| `/debug [설명]` | 현재 세션 디버그 로그 분석 |
| `/loop [간격] <프롬프트>` | 세션이 열려있는 동안 지정 간격으로 반복 실행 |
| `/claude-api` | 프로젝트 언어에 맞는 Claude API 레퍼런스 로드 |

`/batch`가 특히 강력하다. `/batch migrate src/ from Solid to React` 한 줄로 코드베이스 전체를 병렬 마이그레이션한다.

---

## 실전 예시

### 1. 코드 리뷰 표준화

```yaml
---
name: review
description: 코드 리뷰. PR 변경사항 검토할 때 사용.
---

현재 변경된 코드를 리뷰해줘. 다음 기준으로:

**필수 체크:**
- SQL 인젝션, XSS 등 보안 취약점
- null/undefined 처리 누락
- 트랜잭션 필요 여부

**코드 품질:**
- 단일 책임 원칙
- 중복 코드
- 이름이 의도를 드러내는지

각 항목 Pass/Fail. Fail이면 파일명:줄번호와 수정 방향.
```

### 2. GitHub 이슈 자동 수정

```yaml
---
name: fix-issue
description: GitHub 이슈 번호로 버그 수정
disable-model-invocation: true
argument-hint: "<issue-number>"
---

GitHub 이슈 #$ARGUMENTS를 수정해줘.

이슈 내용: !`gh issue view $ARGUMENTS`

1. 이슈 재현 방법 파악
2. 원인 코드 찾기
3. 수정 구현
4. 테스트 작성
5. "Fix #$ARGUMENTS" 형식으로 커밋
```

```
/fix-issue 1234
```

`gh issue view 1234` 출력이 자동으로 삽입된 채로 Claude가 작업한다.

### 3. 레거시 모듈 컨텍스트 (배경 지식)

```yaml
---
name: payment-legacy
description: 레거시 결제 모듈 컨텍스트. 결제 코드 수정, 분석할 때 참고.
user-invocable: false
---

## 레거시 결제 모듈 배경

이 모듈은 2018년 외부 업체가 작성했다. 다음을 알아야 한다:

- `PG_CALLBACK_KEY` 환경변수가 없으면 조용히 실패한다
- `OrderStatus.SETTLED`는 내부 상태고, 외부 PG사의 `COMPLETED`와 다르다
- `retryPayment()`는 멱등성이 없다. 중복 호출 주의

수정 시 `PaymentServiceTest.java`의 통합 테스트 반드시 돌릴 것.
```

사용자는 `/payment-legacy` 못 부른다. Claude가 결제 관련 코드 작업할 때 자동으로 참고한다.

### 4. PR 요약 (동적 컨텍스트 + Subagent)

```yaml
---
name: pr-summary
description: PR 변경사항 요약. 리뷰 전 파악할 때 사용.
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## PR 정보

변경 diff:
!`gh pr diff`

PR 설명 및 코멘트:
!`gh pr view --comments`

## 작업

이 PR을 요약해줘:
1. 핵심 변경사항 (3줄 이내)
2. 리뷰어가 주의해야 할 부분
3. 테스트 커버리지 확인 여부
```

### 5. 코드베이스 시각화 (스크립트 번들)

```yaml
---
name: visualize
description: 코드베이스 파일 구조를 인터랙티브 HTML 트리로 시각화
allowed-tools: Bash(python *)
---

다음 스크립트를 실행해줘:

```bash
python ${CLAUDE_SKILL_DIR}/scripts/visualize.py .
```

`codebase-map.html`이 생성되고 브라우저에서 열린다.
```

스크립트는 `scripts/visualize.py`에 넣어두면 된다. `${CLAUDE_SKILL_DIR}`이 항상 올바른 경로를 가리킨다.

### 6. 인수인계 문서 생성

담당자가 바뀔 때 현재 시스템 상태를 정리하는 문서를 반자동으로 만든다.

```yaml
---
name: handover
description: 인수인계 문서 생성. 담당 업무, 시스템 현황, 주요 이슈 정리.
disable-model-invocation: true
context: fork
agent: Explore
---

현재 프로젝트 상태를 기반으로 인수인계 문서를 작성해줘.

코드베이스에서 파악할 것:
- 전체 구조 및 주요 모듈 역할
- 외부 시스템 연동 현황 (API, DB, 배치 등)
- 환경별 설정 차이 (개발/스테이징/운영)
- 알려진 기술 부채 또는 주의 사항

문서 형식:
## 시스템 개요
## 주요 모듈 설명
## 운영 환경 정보
## 정기 작업 목록
## 알려진 이슈 및 주의사항
## 참고 문서

추측 포함 시 "(추정)" 표시.
```

코드베이스를 Explore 에이전트가 탐색하고, 실제 코드 기반으로 작성한다. 비어있는 항목은 직접 채워넣으면 된다.

### 7. 장애 처리 보고서

장애 발생 후 보고서 초안을 빠르게 뽑는다.

```yaml
---
name: incident-report
description: 장애 처리 보고서 작성
disable-model-invocation: true
argument-hint: "<장애 내용 요약>"
---

다음 장애에 대한 처리 보고서를 작성해줘.

장애 내용: $ARGUMENTS

현재 시간: !`date "+%Y-%m-%d %H:%M"`
최근 배포 이력: !`git log --oneline -10`

보고서 형식:
## 장애 개요
- 발생 일시:
- 인지 일시:
- 복구 일시:
- 영향 범위:

## 장애 경위
(타임라인 형식으로)

## 원인 분석
- 직접 원인:
- 근본 원인:

## 조치 내용

## 재발 방지 대책

코드에서 관련 부분을 찾아 원인 분석에 포함해줘. 확인되지 않은 내용은 "[확인 필요]" 표시.
```

```
/incident-report 오전 10시경 결제 API 타임아웃 다발, 15분간 결제 불가
```

### 8. 변경 영향도 분석

특정 모듈이나 함수를 수정할 때 어디까지 영향이 가는지 사전에 파악한다.

```yaml
---
name: impact
description: 변경 영향도 분석. 특정 함수, 클래스, 모듈 수정 전 영향 범위 파악.
context: fork
agent: Explore
argument-hint: "<파일명 또는 함수명>"
---

$ARGUMENTS 를 수정할 때의 영향도를 분석해줘.

1. 이 코드를 직접 호출하는 곳 (Grep으로 탐색)
2. 간접적으로 의존하는 모듈
3. 영향받는 API 엔드포인트 또는 배치
4. 관련 테스트 코드 위치

결과를 다음 형식으로:
**직접 영향:** (파일명:줄번호 목록)
**간접 영향:** (모듈 단위)
**테스트 필요 범위:**
**수정 시 주의사항:**
```

```
/impact src/service/PaymentService.java
```

### 9. 운영 이슈 원인 분석 (배경 지식 자동 참조)

운영 중 반복되는 이슈 패턴을 skill로 만들어두면, 관련 질문이 나올 때마다 Claude가 자동으로 참고한다.

```yaml
---
name: known-issues
description: 이 시스템의 알려진 운영 이슈 패턴. 오류 분석, 이슈 해결 시 참고.
user-invocable: false
---

## 알려진 이슈 패턴

**타임아웃 다발 시**
- 원인 1순위: 배치 스케줄러와 API 요청 겹치는 시간대 (매일 02:00~03:00)
- 확인: `batch_log` 테이블의 실행 시간과 요청 로그 비교

**OOM 발생 시**
- `UserSessionCache`가 만료 처리 없이 누적됨 (알려진 버그, 미수정)
- 임시 조치: 해당 서버 재시작, `session_cache` 테이블 truncate

**결제 이중 승인 의심 시**
- `payment_history` 테이블의 `idempotency_key` 중복 확인
- 중복이면 PG사 취소 API 먼저 호출 후 DB 정리

각 패턴은 `docs/runbook/` 폴더에 상세 절차 있음.
```

"결제 타임아웃 왜 나는 거야?"라고 물어보면 Claude가 이 배경 지식을 참고해서 답한다. 매번 설명 안 해도 된다.

---

## Monorepo 지원

하위 디렉토리에서 작업할 때, Claude Code는 해당 경로의 `.claude/skills/`도 자동으로 탐색한다.

```
packages/
├── frontend/
│   └── .claude/skills/
│       └── component-review/   ← 프론트엔드 전용 skill
└── backend/
    └── .claude/skills/
        └── api-review/         ← 백엔드 전용 skill
```

`packages/frontend/` 파일 작업 중이면 `component-review` skill이 자동으로 잡힌다.

---

## 잘 쓰는 법

### description을 제대로 써라

description이 핵심이다. Claude가 언제 이 skill을 쓸지 판단하는 근거다.

```yaml
# 나쁜 예
description: 코드 분석

# 좋은 예
description: 레거시 결제 모듈 분석. 결제 관련 버그 수정, 기능 추가, 코드 리뷰 시 사용.
```

사용자가 자연스럽게 말할 법한 키워드를 포함한다.

### 부작용 있는 skill은 반드시 disable-model-invocation

배포, 커밋, 메시지 전송, DB 변경. Claude가 "알아서" 실행하면 안 되는 것들.

```yaml
disable-model-invocation: true
```

### SKILL.md는 500줄 이하

상세 내용은 별도 파일로 분리하고 참조한다. SKILL.md가 길수록 매번 컨텍스트를 더 먹는다.

### ultrathink로 확장 사고 활성화

skill 내용 어딘가에 `ultrathink` 단어를 포함하면 확장 사고 모드가 켜진다.

---

## 트러블슈팅

**Skill이 자동으로 안 켜진다**
- description에 사용자가 쓸 키워드가 있는지 확인
- `What skills are available?` 물어보면 목록 나옴
- 직접 `/skill-name` 으로 시도

**Skill이 너무 자주 켜진다**
- description 더 구체적으로
- 수동 호출만 원하면 `disable-model-invocation: true`

**Skills가 컨텍스트에 안 잡힌다**
- Skill이 많으면 컨텍스트 예산(컨텍스트 창의 2%, 최대 16,000자) 초과 가능
- `/context` 실행해서 제외된 skill 경고 확인
- 환경변수 `SLASH_COMMAND_TOOL_CHAR_BUDGET`으로 한도 조정 가능

---

## 정리

| 개념 | 내용 |
|------|------|
| 파일 위치 | `.claude/skills/<이름>/SKILL.md` |
| 개인 위치 | `~/.claude/skills/<이름>/SKILL.md` |
| 호출 | `/이름` 또는 Claude가 자동으로 |
| 인자 | `$ARGUMENTS`, `$ARGUMENTS[N]`, `$N` |
| 자동 호출 차단 | `disable-model-invocation: true` |
| 사용자 호출 차단 | `user-invocable: false` |
| Subagent 실행 | `context: fork` |
| 동적 컨텍스트 | `` !`명령어` `` |

가장 다른 점은 Claude가 스스로 skill을 판단해서 쓴다는 것이다. 배경 지식, 컨벤션, 도메인 컨텍스트를 skill로 만들어두면 매번 설명하지 않아도 된다. Claude가 관련 작업을 할 때 알아서 참고한다.

커맨드를 만드는 게 아니라 Claude의 전문 영역을 확장하는 것에 가깝다.
