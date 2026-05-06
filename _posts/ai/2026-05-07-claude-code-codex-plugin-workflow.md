---
layout: post
title: "Claude Code + Codex 플러그인 실무 워크플로우 — 두 에이전트를 한 터미널에서"
date: 2026-05-07
category: claude-code
---

3월 말에 `openai/codex-plugin-cc`가 공식 릴리스되고 나서 실무 세션에 붙여서 써왔다. 이제 슬 정리할 때가 됐다 싶어서 쓴다.

---

## 이게 뭔지 한 줄 요약

Claude Code 세션 안에서 슬래시 커맨드로 Codex를 호출하는 플러그인이다. 리뷰, 디버깅 위임, 배경 작업 등을 Codex에 던지고 Claude는 오케스트레이션에 집중한다.

---

## 설치

```bash
# Claude Code 세션 내에서
/plugin marketplace add openai/codex-plugin-cc
/plugin install codex@openai-codex
/reload-plugins
/codex:setup
```

OpenAI 계정(ChatGPT Free 포함)이나 API 키가 있으면 된다. Codex CLI가 없으면 `/codex:setup` 단계에서 자동으로 설치 여부를 물어본다.

---

## 명령어 정리

### `/codex:review`

현재 변경사항에 대한 표준 코드 리뷰. 커밋되지 않은 diff, 브랜치 diff, 특정 파일 범위를 대상으로 쓸 수 있다. 읽기 전용이라 코드에 손대지 않는다.

시간이 좀 걸리는 리뷰라면 백그라운드로 돌리는 게 낫다:

```bash
/codex:review --background
```

### `/codex:adversarial-review`

일반 리뷰가 아니다. "뭔가 문제가 있다고 가정하고 찾아내라"는 방식의 악마의 변호인 분석이다. 설계 결정에 의문을 던지고, 실패 케이스를 파고들고, 더 단순하거나 안전한 접근이 있었는지를 따진다.

기능 완성 직후 Self-QA 용도로 쓰기 좋다. 읽기 전용.

### `/codex:rescue`

커맨드 중 **유일하게 코드 변경이 가능한** 명령이다. 특정 태스크를 Codex에 위임하고 실제 작업을 시킨다.

```bash
/codex:rescue investigate why the tests started failing
/codex:rescue fix the failing test with the smallest safe patch
/codex:rescue --model gpt-5.4-mini --effort medium investigate the flaky integration test
/codex:rescue --background investigate the regression
/codex:resume  # 직전 rescue 스레드 이어받기
/codex:rescue --fresh  # 새 스레드로 시작
```

`--model` 옵션으로 빠른 작업에는 경량 모델을 쓸 수 있다. 단순 반복 수정, 테스트 수정, 린트 수정 같은 작업을 싸게 돌리는 용도다.

### `/codex:status` / `/codex:cancel`

백그라운드로 돌린 rescue나 review 작업 상태 확인 및 취소.

```bash
/codex:status   # 진행 중인 작업 확인
/codex:cancel   # 취소
```

### `/codex:result`

완료된 작업의 결과 확인. Codex 세션 ID도 함께 반환해서, 터미널에서 직접 `codex resume <session-id>`로 그 세션에 접속할 수도 있다.

### `/codex:setup`

설치 상태 확인, 리뷰 게이트 활성화/비활성화.

```bash
/codex:setup --enable-review-gate
/codex:setup --disable-review-gate
```

---

## 백그라운드 워크플로우

실무에서 가장 유용하게 쓰는 패턴이다.

1. Claude가 기능 구현 중
2. 구현 완료 후 `--background`로 review나 rescue 실행
3. Claude는 다음 태스크로 넘어감
4. 잠시 후 `/codex:status` → `/codex:result`로 결과 수령

무거운 리뷰를 기다리면서 멈추지 않아도 된다. 컨텍스트 낭비가 없다.

---

## Review Gate

```bash
/codex:setup --enable-review-gate
```

활성화하면 Claude가 응답을 끝낼 때마다 Stop Hook이 트리거되어 Codex가 해당 응답을 자동으로 리뷰한다. 문제가 발견되면 Claude가 멈추기 전에 다시 돌아가서 수정한다.

**주의**: Claude↔Codex 루프가 길게 이어질 수 있어서 사용량이 빠르게 소진된다. 세션을 모니터링할 수 있을 때만 켜는 게 맞다.

---

## 실무 워크플로우 예시

### 일반적인 기능 개발

```
[Claude] 요구사항 분석 → 구현 계획 수립 → 코드 작성
[실행] /codex:review --background
[Claude] 다음 태스크로 진행
[나중에] /codex:result → 리뷰 결과 반영
```

### 테스트 실패 디버깅

```
[CI에서 테스트 실패 확인]
/codex:rescue investigate why the tests started failing
/codex:status (기다리는 동안 다른 작업)
/codex:result → 원인 분석 결과 확인
/codex:rescue --resume apply the top fix from the last run
```

### PR 직전 최종 검증

```
/codex:adversarial-review
→ 결과 보고 위험 지점 수정
/codex:review
→ 최종 확인 후 PR
```

---

## Claude Code 단독 vs Codex 연동 — 팩트 기반 비교

| 항목 | Claude Code 단독 | Codex 연동 |
|------|-----------------|------------|
| 장문 컨텍스트 이해 | 강함 | 약함 |
| 코드 리뷰 편향 제거 | 본인 결과물 리뷰라 사각지대 있음 | 독립된 에이전트라 객관성 있음 |
| 모델 비용 | Opus/Sonnet 기준 | 경량 모델 선택 가능 (`gpt-5.4-mini`) |
| 코드 직접 수정 | 항상 가능 | rescue만 가능 |
| 백그라운드 실행 | 없음 | 있음 |
| 설정 복잡도 | 없음 | OpenAI 계정 필요 |
| 워크플로우 단절 | 없음 | 두 모델 결과 병합 필요 |

정리하면: **Claude가 오케스트레이터, Codex가 전문가 호출** 구조다. Codex를 붙인다고 Claude가 약해지는 게 아니라, 사각지대를 다른 모델이 채우는 방식이다.

리뷰 편향 제거가 핵심 이유다. 같은 모델이 짜고 리뷰하면 같은 실수를 반복해서 못 잡는다.

---

## 이커머스 / 웹 SI · 운영 업무 적용

### 이커머스 운영

- **장바구니/결제 로직 변경 시**: `/codex:adversarial-review`로 엣지케이스(중복 주문, 재고 경쟁, 쿠폰 조합) 집중 공략
- **프로모션 코드 긴급 배포**: `--background`로 리뷰 돌리고 다른 긴급 수정 병행
- **구버전 레거시 정산 코드**: `/codex:rescue` 위임으로 Claude 컨텍스트 낭비 없이 정리

### 웹 SI 프로젝트

- **마감 전 납품 점검**: PR 직전 adversarial-review로 클라이언트 피드백 전에 미리 걸러내기
- **외주 코드 인수인계**: 받은 코드베이스에 review 돌려서 품질 리포트 빠르게 뽑기
- **반복 수정 요청 대응**: 단순 레이아웃/스타일 수정은 `--model gpt-5.4-mini`로 비용 절감

### 공통

팀 작업이 아닌 1인 개발이거나 리뷰어가 없는 프로젝트에서 **셀프 리뷰의 한계**를 메우는 용도가 가장 실용적이다.

---

## 팁 모음

- **모델 기본값 설정**: 프로젝트 루트에 `.codex/config.toml` 두면 매번 `--model` 안 써도 된다
- **review gate는 집중 작업 시에만**: 세션 감시 안 되는 상태에서 켜면 사용량 폭탄
- **rescue는 작게 위임**: 범위가 넓으면 결과 병합이 복잡해진다. 태스크 단위를 작게 잘라서 던지는 게 낫다
- **result에서 session-id 챙기기**: `codex resume <id>`로 터미널에서 바로 이어받을 수 있어서 디버깅 심화 때 유용하다

---

Sources:
- [GitHub - openai/codex-plugin-cc](https://github.com/openai/codex-plugin-cc)
- [Introducing Codex Plugin for Claude Code - OpenAI Developer Community](https://community.openai.com/t/introducing-codex-plugin-for-claude-code/1378186)
