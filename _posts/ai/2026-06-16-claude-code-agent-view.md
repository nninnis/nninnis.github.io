---
layout: post
title: "Claude Code Agent View — tmux 그리드를 대체할까, 얹힐까"
date: 2026-06-16
category: claude-code
---

지난 [Agent Teams 글](/claude-code/2026/05/16/claude-code-agent-teams/)에서 psmux로 5개 pane을 띄워 PM/Architect/Dev/QA를 한 화면에 굴리는 얘기를 했다. 그 글을 쓰고 얼마 안 돼서 Anthropic이 공식 기능으로 [Agent View](https://code.claude.com/docs/en/agent-view)를 내놨다. 직접 써보니 내가 tmux로 손수 만들던 것과 **겹치는 듯 다른** 도구였다. 뭐가 같고 뭐가 다른지, tmux를 버려도 되는지 정리한다.

---

## Agent View가 뭔지 한 줄 요약

`claude agents` 한 줄로 여는, **내 머신에서 돌아가는 모든 Claude Code 세션을 한 화면 리스트로 관리하는 대시보드**다. 2026년 5월 12일 Claude Code v2.1.139에 들어왔고, 아직 research preview다. Pro/Max/Team/Enterprise/API 플랜에서 쓸 수 있다.

핵심은 **백그라운드 세션**이다. 각 행(row)이 터미널 없이도 계속 돌아가는 완전한 Claude Code 대화다. 창을 닫든 셸을 끄든 작업은 계속된다. 터미널과 분리된 per-user **supervisor 프로세스**가 세션을 호스팅하기 때문이다.

---

## 켜는 설정은 없다 — 진입과 재진입

먼저 헷갈리기 쉬운 것부터. **Agent View를 켜려고 `settings.json`에 넣을 설정은 없다.** opt-in이지만 그 opt-in은 설정을 켜는 게 아니라 그냥 명령을 실행하는 것이다. `claude --version`이 v2.1.139 이상이면 바로 된다. `settings.json`은 오히려 **끌 때**(`disableAgentView: true`) 또는 동작을 미세조정할 때(`worktree.bgIsolation`, `leftArrowOpensAgents`) 쓴다.

그리고 **`claude`만으론 안 열린다.** 그건 평소 채팅 세션이다. **자연어로도 트리거되지 않는다** — Agent View는 모델이 부르는 도구가 아니라 터미널 화면을 바꾸는 TUI라, 명령이나 키 입력으로만 들어간다.

| 여는 법 | 방법 | 상황 |
|---|---|---|
| 셸에서 직접 | `claude agents` | 처음부터 대시보드로 시작 |
| 채팅 중 키 | 빈 입력창에서 `←` | 보던 세션을 백그라운드로 보내며 대시보드로 빠짐 |
| 채팅 중 커맨드 | `/bg` (= `/background`) | 현재 대화를 백그라운드 세션으로 전환 |

문서는 아예 **`claude` 대신 `claude agents`를 주 진입점으로** 쓰는 걸 권한다. 대시보드로 시작 → 작업 던지고 → `→`로 attach해 대화 → `←`로 복귀.

닫았다 다시 들어갈 땐 두 갈래로 갈린다. **닫기 전에 백그라운드로 보냈느냐**가 기준이다.

| 닫기 전 상태 | 재진입 |
|---|---|
| 일반 세션 (터미널에 묶임) | `claude --resume` (`-r`) 또는 `claude --continue` (`-c`) |
| 백그라운드 세션 (`/bg`·`←`로 보냄) | `claude agents` → attach, 또는 `claude attach <id>` |

`claude agents`에는 `-r` 같은 resume 플래그가 **없다.** resume은 "터미널 세션 transcript 복원"이고 `claude agents`는 "supervisor가 들고 있는 살아있는 세션 대시보드"라 메커니즘이 다르다. 단, 백그라운드 세션을 삭제해도 transcript는 로컬에 남아서 `claude --resume`으로 살릴 수 있다 — 두 체계가 transcript를 공유한다.

---

## 화면 구조 — tmux 그리드가 아니다

여기서 오해가 갈린다. Agent View는 **화면을 타일로 쪼개 여러 세션을 나란히 띄우는 게 아니다.** 한 화면에 세션이 **목록**으로 쌓이고, 상태별로 그룹핑된다.

```text
Needs input
  ✻ power-up 설계        needs input: 더블점프 vs 벽타기?      1m

Working
  ✽ 충돌 판정            Edit src/physics/CollisionSystem.ts   2m
  ✢ 레벨3 플레이테스트    run 12 · 체크포인트 전부 통과         in 4m

Completed
  ✻ 타이틀 화면          result: 메뉴·옵션·크레딧 완료          9m
```

각 행 맨 앞 아이콘 색과 모양으로 상태를 읽는다.

| 상태 | 의미 |
|---|---|
| Working (애니메이션) | 도구 실행 중이거나 응답 생성 중 |
| Needs input (노랑) | 질문이나 권한 결정을 나한테 기다리는 중 |
| Idle (흐림) | 할 일 끝내고 다음 지시 대기 |
| Completed (초록) | 성공 종료 |
| Failed (빨강) | 에러로 종료 |

한 줄 요약은 **Haiku급 모델**이 자동 생성한다. transcript를 안 열어도 그 세션이 뭘 하는지, 뭘 기다리는지, 뭘 만들어냈는지 한 줄로 보여준다. 작업 중일 땐 최대 15초에 한 번 갱신된다.

---

## 핵심 동작 4가지

실제 루프는 단순하다.

```text
[Dispatch] 입력창에 프롬프트 치고 Enter → 새 백그라운드 세션이 행으로 생성
[Peek]     행 선택 후 Space → 최근 출력/대기 질문만 미리보기, 거기서 바로 답장
[Attach]   Enter 또는 → → 전체 대화로 진입(풀스크린)
[Detach]   빈 입력창에서 ← → 다시 리스트로 복귀 (세션은 계속 돎)
```

- **Dispatch는 매번 새 세션이다.** 프롬프트를 또 치면 기존 세션에 이어 보내는 게 아니라 두 번째 세션이 옆에 생긴다. 이렇게 병렬로 여러 개를 돌린다.
- **Peek가 핵심 절약 포인트다.** 대부분은 attach까지 안 가고 Space 미리보기 + 답장으로 끝난다. 객관식 질문이면 숫자키로 고르고, `!` 붙이면 Bash 명령을 보낸다.
- **셸에서 직접**도 된다. `claude --bg "flaky 테스트 조사"`로 바로 백그라운드 세션을 띄우고, `claude attach <id>` / `claude logs <id>` / `claude stop <id>`로 관리한다.

`?`를 누르면 전체 단축키가 뜬다. 자주 쓰는 것만:

| 키 | 동작 |
|---|---|
| `Space` | peek 패널 열기/닫기 |
| `Enter` / `→` | 선택 세션에 attach |
| `Shift+Enter` | dispatch 후 즉시 attach |
| `Ctrl+T` | 세션 고정(pin) — idle여도 프로세스 안 죽임 |
| `Ctrl+R` | 세션 이름 변경 |
| `Ctrl+X` | 세션 정지, 2초 내 한 번 더 누르면 삭제 |
| `Ctrl+S` | 상태별/디렉터리별 그룹핑 전환 |

---

## 파일 충돌은 worktree로 자동 격리

병렬 세션이 같은 파일을 건드리면 박살난다. Agent View는 이걸 자동으로 막는다. **세션이 파일을 수정하기 직전, `.claude/worktrees/` 아래 격리된 git worktree로 자기를 옮긴다.** 여러 세션이 같은 체크아웃을 읽되 쓰기는 각자 worktree에 한다.

주의: 세션을 Agent View에서 삭제(`Ctrl+X` 두 번)하면 Claude가 만든 worktree도 **커밋 안 된 변경까지 같이 날아간다.** 살릴 작업은 먼저 push/commit 해야 한다. git이 부담스러운 repo면 `worktree.bgIsolation`을 `"none"`으로 꺼서 working copy에 직접 쓰게 할 수도 있다(이땐 같은 파일 동시 편집을 피해야 한다).

---

## 실무 사용 예시

문서가 미는 정석 패턴이 내 업무와도 잘 맞는다. **서로 독립적인 작업 여러 개를 던져놓고 다른 일 하다가, 행이 "Needs input"이나 "Completed"로 바뀌면 그때 들어가는** 방식이다.

### 아침 출근 직후 — 독립 작업 일괄 발주

```text
claude agents 열기
→ "어제 들어온 버그 #2041 재현하고 최소 패치"      (세션 1)
→ "PR #2048 리뷰 코멘트 반영"                      (세션 2)
→ "flaky한 결제 통합테스트 원인 조사"               (세션 3)
→ Esc로 빠져서 내 IDE에서 다른 작업
→ 10분 뒤 Space로 하나씩 peek, 막힌 것만 attach
```

세 작업은 서로 관계가 없다. 그래서 팀(Agent Teams)을 띄울 이유가 없다. 각자 따로 돌리고 결과만 거두면 된다.

### PR 결과 수령은 색깔로

세션이 PR을 열면 행 오른쪽에 `PR #1234` 라벨이 뜨고 상태별로 색이 바뀐다.

| 색 | PR 상태 |
|---|---|
| 노랑 | 체크/리뷰 대기 또는 체크 실패 |
| 초록 | 체크 통과, 막는 리뷰 없음 |
| 보라 | 머지됨 |
| 회색 | draft 또는 closed |

대부분의 작업은 **이 칼럼이 초록으로 바뀌면 머지**하는 걸로 끝난다. transcript를 열 일이 거의 없다.

### 반복 작업은 skill로 박제

매번 같은 프롬프트를 치기 싫으면 [skill](https://code.claude.com/docs/en/skills)로 묶어두고 Agent View 입력창에서 `/내스킬`로 발주하면 된다.

---

## 내가 tmux(psmux)로 만들던 것과 비교

이게 오빠가 가장 궁금해할 부분이다. 결론부터: **둘은 경쟁 관계가 아니라 레이어가 다르다.**

| 항목 | psmux + Agent Teams (내 기존 방식) | Agent View |
|---|---|---|
| 화면 | split pane 타일, 5개가 동시에 깜박 | 세션 리스트 1화면, attach는 하나씩 |
| 세션 간 통신 | teammate끼리 직접 메시지, lead가 조율 | **통신 없음. 완전 독립 병렬** |
| 작업 성격 | 하나의 큰 작업을 역할 분담 | 서로 무관한 작업 여러 개 |
| 지속성 | 터미널/psmux 세션에 묶임 | supervisor가 터미널과 무관하게 유지 |
| 파일 충돌 방지 | 파일 소유권 매트릭스(수동 설계) | worktree 자동 격리 |
| 설정 | psmux 설치 + `EXPERIMENTAL_AGENT_TEAMS=1` | `claude agents` 한 줄 |
| 한눈 모니터링 | pane 5개가 다 보임(시각적) | 리스트 + Haiku 한 줄 요약 |

핵심 차이는 **"하나의 일을 나눠 하는가" vs "여러 일을 따로 하는가"** 다.

- Agent Teams는 **회사 조직 모방**이다. PM이 스펙 짜고 Architect가 파일 소유권 박고 BE/FE가 동시에 짜고 QA가 검수한다. 서로 메시지를 주고받고 lead가 통솔한다. 하나의 결과물을 향해 분업한다.
- Agent View는 **1인 다중 위임**이다. 버그 픽스, PR 리뷰, 테스트 조사 — 세 가지 무관한 일을 각자 던져놓고 결과만 거둔다. 세션끼리 대화하지 않는다.

공식 문서가 이걸 못 박는다. **Agent View 리스트에는 세션이 spawn한 subagent나 teammate가 별도 행으로 안 보인다.** 즉 "회사처럼 돌아가는 협업"은 Agent View의 설계 목표가 아니다. 그건 Agent Teams 안에서 일어나고, Agent View는 그 위를 덮는 모니터링 레이어일 뿐이다.

---

## 그럼 멀티 타일·팀메이트 구성은 Agent View로 안 되나

오빠가 원했던 "하나의 회사가 돌아가듯" 구성은 **Agent View 단독으로는 안 된다.** 정리하면:

- **여러 패널을 타일로 동시에 보고 싶다** → 그건 tmux/psmux split pane이 하는 일이다. Agent View는 리스트뷰지 타일뷰가 아니다.
- **에이전트들이 서로 통신하며 한 프로젝트를 협업** → 그건 Agent Teams(`TeamCreate`)다. Agent View가 아니다.
- **무관한 작업 여러 개를 백그라운드로 돌리고 한 곳에서 상태 추적** → 이게 Agent View가 가장 잘하는 일이다.

내가 기존 글에서 만든 "5인 팀 한 화면" 구성을 그대로 재현하려면 **여전히 psmux + Agent Teams가 필요**하다. Agent View는 거기에 "그 팀 세션 + 다른 독립 작업들"을 한 대시보드로 묶어 보는 상위 레이어로 얹는 게 맞다.

---

## tmux는 아직 유용한가 — 그렇다

검색해보니 업계 컨센서스가 깔끔하다. *"Agent View가 tmux를 죽인 게 아니라, tmux의 일부를 죽였다."* 표준 권장은 **하이브리드**다.

- **tmux/psmux는 base layer로 남는다.** SSH 세션 지속, 에디터/REPL/로그 레이아웃, 그리고 **Agent Teams 굴릴 때 per-agent pane 가시성** — 이건 Agent View가 대체 못 한다. 팀 세션 5명이 동시에 뭘 하는지 눈으로 보려면 여전히 split pane이다.
- **Agent View는 그 위 대시보드 레이어다.** 예전엔 tmux pane + 탭 + 스크립트로 수동 오케스트레이션하던 걸(3개는 할 만하고 10개는 문제, 20개는 한계) 한 화면으로 정리한다.

tmux가 죽인 것: **"세션 여러 개를 단순 병렬로 돌리려고 pane을 손수 까는 노동."** 그건 이제 Agent View가 한다. tmux가 살아남은 것: **레이아웃 통제와 팀 협업의 동시 가시성.**

내 환경 기준 결론 — psmux는 base, Agent View는 그 위 모니터링, Agent Teams는 작업이 진짜 분업을 요구할 때. 셋 다 쓴다.

---

## 비용과 한계 — research preview

좋은 점만 적으면 광고다.

- **병렬은 곧 사용량 배수다.** 별도 에이전트 요금은 없고, 모든 세션이 기존 플랜 토큰을 인터랙티브와 똑같은 단가로 먹는다. 10개 동시 = 쿼터 10배 속도. Agent Teams의 ~7배와는 또 다른 축의 비용이다. 세는 줄 모르고 발주하면 청구서가 터진다.
- **세션은 로컬이다.** 내 머신에서 돈다. 슬립은 견디지만 셧다운하면 멈춘다(이후 attach/peek하면 멈춘 지점부터 재시작, `claude respawn --all`로 일괄 복구).
- **worktree 삭제 주의.** 위에 적은 대로 세션 삭제 시 커밋 안 된 변경이 날아간다.
- **research preview다.** UI와 단축키가 바뀔 수 있다. `claude --version`으로 v2.1.139+ 확인. Bedrock/Vertex/Foundry 환경에선 안 열릴 수 있으니 `claude update`.

---

## 내 업무에 어떻게 쓸까

회사에서 여러 사이트를 동시 운영하는 입장에서 매핑하면 이렇다.

- **독립 작업 일괄 발주** — 사이트 A 버그픽스, 사이트 B PR 리뷰, 사이트 C 테스트 조사를 아침에 한 번에 던지고 IDE에서 본 작업. Agent View가 정확히 이 용도다.
- **`--cwd`로 프로젝트별 분리** — `claude agents --cwd ~/projects/siteA`로 그 디렉터리 세션만 본다(v2.1.141+). 여러 repo를 오가며 일할 때 잡음이 준다.
- **PR 색깔로 결과 수령** — 단순 수정은 transcript 안 열고 PR 칼럼 초록 확인 후 머지.
- **진짜 분업은 Agent Teams로** — 신규 모듈처럼 PM·Architect·BE·FE·QA가 필요한 일은 여전히 psmux + 팀으로. 그 팀 세션도 Agent View 리스트에 한 행으로 잡힌다.

요약하면 **무관한 일은 Agent View로 흩뿌리고, 한 일을 쪼개는 건 Agent Teams로 묶고, 둘 다 psmux 위에 얹는다.**

---

## 마무리

Agent View는 "새로운 협업 모델"이 아니라 **"이미 있던 병렬 작업을 한 화면으로 보는 관제탑"**이다. 내가 tmux로 손수 깔던 단순 병렬 노동은 이게 대신해준다. 하지만 회사 조직처럼 에이전트들이 통신하며 협업하는 구성은 여전히 Agent Teams의 일이고, 그걸 눈으로 보려면 여전히 psmux split pane이 필요하다.

그래서 답은 "갈아탄다"가 아니라 "**얹는다**"다. 세 레이어 — psmux(환경), Agent View(관제), Agent Teams(협업) — 가 각자 자리를 지킨다.

---

## 출처

- [Manage multiple agents with agent view — Claude Code 공식 문서](https://code.claude.com/docs/en/agent-view)
- [Agent view in Claude Code — Anthropic 블로그](https://claude.com/blog/agent-view-in-claude-code)
- [Run agents in parallel — agent view·subagents·teams·worktrees 비교](https://code.claude.com/docs/en/agents)
- [Claude Code Agent View vs. tmux: When to Switch (and When Not To) — FindSkill.ai](https://findskill.ai/blog/claude-code-agent-view-vs-tmux/)
- [Claude Code Agents In 2026: 병렬 세션 비용 분석 — CloudZero](https://www.cloudzero.com/blog/claude-code-agents/)
- [Claude Code Agent View — Cobus Greyling (Medium)](https://cobusgreyling.medium.com/claude-code-agent-view-703491634ea7)
