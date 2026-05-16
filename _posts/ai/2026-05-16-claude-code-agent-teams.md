---
layout: post
title: "Claude Code 에이전트 협력사와 일하기"
date: 2026-05-16
category: claude-code
---

AI 에이전트 팀을 외주사처럼 굴려봤다. 대표 한 명한테 일 발주만 하면 나머지가 알아서 분업한다. Claude Code의 agent teams 기능이다.

---

## 이게 뭔지

`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` 한 줄 켜면 활성화되는 실험적 기능이다. lead 세션 하나가 PM/Architect/Dev/QA 같은 teammate들을 spawn해서 분업시킨다. 각 teammate는 독립된 Claude Code 세션이고 자기 컨텍스트 윈도우를 따로 가진다.

업무용 노트북에선 보안 정책상 WSL2를 못 쓴다. 대안으로 [psmux](https://github.com/psmux/psmux)를 쓴다. Rust로 짠 Windows 네이티브 tmux로, ConPTY를 직접 다루고 `.tmux.conf`를 그대로 읽는다. Claude Code agent teams를 공식 지원해서 psmux 세션 안에서 lead를 띄우면 teammate가 알아서 별도 pane에 spawn된다. 결과적으로 macOS·WSL2·psmux 세 환경에서 운영 경험 차이가 거의 없다.

---

## 회사 팀 인력 모델이랑 묘하게 닮았다

회사에서 여러 사이트를 동시에 운영하면서 PM·아키텍트·BE/FE 개발자·DBA·인프라·QA·보안 같은 역할을 나눠 굴리는데, agent teams 구조가 우리 팀 인력 모델이랑 묘하게 비슷하다. Lead가 PM처럼 작업을 쪼개고, 각 teammate가 자기 도메인만 본다. 처음 굴려봤을 때 "이거 우리 회사 워크플로 그대로네"라는 생각이 먼저 들었다.

그래서 검증해봤다. **Anthropic이 공식 문서에서 "회사 조직처럼 만들었다"고 직접 명시한 적은 없다.** 그 표현은 안 나온다. 하지만 채택한 메커니즘 자체가 인간 팀에서 차용한 것들이다.

- **Lateral peer communication**: teammate끼리 직접 메시지 (lead 거치지 않음)
- **Role specialization**: subagent definition으로 역할별 특화
- **Shared workspace**: 파일 시스템 + shared task list
- **Task claiming with file locking**: sprint 티켓 잡듯 race condition 방지
- **Orchestrator-led coordination**: lead가 작업 분배, teammate는 자가 클레임

Anthropic이 자체적으로 진행한 실험도 같은 방향이다. 16개 에이전트로 Rust 기반 C 컴파일러를 처음부터 작성해서 Linux 6.9 커널까지 컴파일하는 데 성공했다. 단일 에이전트 워크플로로는 안 되는 규모다.

내가 회사 팀 굴리는 방식과 비슷한 모양으로 동작하는 게 단순 우연은 아니다.

<a href="/assets/images/agent-teams/team-working.png" target="_blank"><img src="/assets/images/agent-teams/team-working.png" alt="Claude Code Agent Teams - SpaceCat 게임 프로젝트 5인 팀이 동시에 킥오프 분석 중인 tmux split pane" style="width: 100%; max-width: 100%; display: block;"></a>

<p style="text-align: center; font-size: 0.8rem; color: #888; margin-top: -0.8rem;"><em>왼쪽 메인 세션이 lead. 오른쪽 5개 pane이 architect / backend / frontend / pm / qa. 개인 게임 프로젝트(SpaceCat) M2 Week 1 킥오프 — 각자 자기 도메인 의견을 동시에 분석하는 중이다.</em></p>

---

## 일반 subagent 호출이랑 뭐가 다른가

| 항목 | 일반 Subagent (`Agent` 도구) | Agent Teams (`TeamCreate`) |
|---|---|---|
| 인스턴스 | 같은 세션에서 잠깐 띄웠다 닫힘 | 별도 Claude Code 세션, 살아있음 |
| 통신 | 결과를 lead에 요약 반환 | teammate끼리 직접 메시지 가능 |
| 화면 | lead 터미널 한 곳에서 모두 처리 | tmux/iTerm2 split pane으로 각자 분리 |
| 작업 분배 | lead가 매번 호출 | shared task list + 자가 클레임 |
| 회의록 | 없음 | `TaskCompleted`/`TeammateIdle` 훅으로 자동 누적 |
| 토큰 비용 | 낮음 (결과만 lead에 통합) | 높음 (각자 컨텍스트 윈도우) |

가장 큰 차이는 **컨텍스트가 따로 흐른다**는 거다. 5명이 동시에 작업해도 lead의 메인 컨텍스트는 깔끔하게 유지된다.

---

## 직접 굴려본 장점

개인 게임 프로젝트(SpaceCat — Phaser 기반 HTML5 게임)의 M2 Week 1 킥오프를 5인 팀으로 굴려봤다. Architect는 씬 골격·ServiceLocator·EventBus 설계, Backend는 Firebase 서비스 레이어, Frontend는 CatRenderer 14종 visual switch, PM은 characters.json·일정 cut line, QA는 DoD·회귀 테스트 전략. Lead가 5명을 동시 spawn하고 각자 자기 도메인 관점에서 의견을 분석하게 했다.

장점은 네 가지였다.

**컨텍스트 격리.** PM은 스코프와 일정만, Architect는 설계 패턴만, BE는 데이터/서비스 레이어만, FE는 렌더링·전환 로직만 본다. 각자 자기 도메인 외 잡음이 없다.

**파일 소유권 분리.** Architect가 첫 단계에서 파일 소유권 매트릭스를 박는다. 씬 골격은 Architect, Firebase 어댑터는 BE, CatRenderer는 FE 식으로 명확히 갈리니까 동시 작업해도 충돌이 안 났다.

**한 화면 모니터링.** tmux split으로 5개 pane이 동시에 깜박이는 게 보인다. 어디가 막혔는지, 누가 끝났는지 즉시 파악 가능하다. Architect가 "Phaser Registry vs 별도 GameStateService" 같은 결정 분기를 띄우면 lead가 바로 받아서 판단한다.

**메인 컨텍스트 클린.** lead는 "Architect 분석 완료", "BE 서비스 레이어 초안", "FE 렌더러 14종 매핑", "PM 일정 cut line", "QA DoD 초안" 정도만 본다. 각 teammate의 토큰짜리 작업 로그가 lead 컨텍스트로 흘러들지 않는다.

회사 업무 코드베이스에서도 같은 패턴으로 굴려봤다. 솔직히 아직 매끄럽지 않다. Task 완료 마킹이 가끔 누락되고, lead가 teammate 진행을 못 따라잡아서 다시 물어봐야 할 때가 있다. 최적화도 덜 됐다 — 같은 작업을 일반 subagent로 했을 때보다 토큰을 좀 더 쓴다. 그래도 컨텍스트 격리와 책임 분리에서 오는 이점이 단점을 충분히 누른다. 실험 단계라는 점만 감안하면 회사 실무에 붙여도 굴러간다.

---

## 함정과 단점

장점만 적으면 광고다. 실제로 겪은 단점도 똑같이 적는다.

| 단점 | 영향 |
|---|---|
| 토큰 비용 증가 | 5명 동시 = 5개 컨텍스트. 단, 잘 쓰면 최소화 가능 (아래 절약 패턴 참고) |
| Lead가 `TeamCreate`를 안 부른다 | 자연어 "팀 구성해라"로는 부족. 도구 이름 명시해야 확실히 호출됨 |
| `/resume` 미지원 | 세션 재개하면 teammate 사라짐. 다시 spawn해야 함 |
| Task 완료 마킹 누락 | teammate가 일은 끝냈는데 task 상태가 안 바뀌어서 다음 작업이 블록되는 경우 |
| 모델 의존성 큼 | Sonnet 4.6과 Opus 4.7이 도구 선택 패턴이 다름 |
| 한 번에 한 팀만 | 두 팀 병렬 운용 불가. nested team도 불가 |
| 최적화 덜 됨 (experimental) | 같은 작업을 일반 subagent로 했을 때보다 토큰 소모 더 큼 |

특히 두 번째 함정 — 자연어로 "팀 만들어"라고 하면 lead가 의도는 받아들이지만 실제로 `TeamCreate` 도구를 안 부르고 그냥 일반 subagent 4번 순차 호출로 처리하는 경우가 있다. 도구 이름을 명시적으로 박아야 한다.

---

## 토큰을 적게 쓰면서 굴리는 패턴

5배 컨텍스트는 무조건 정해진 값이 아니다. 다음만 지키면 단일 세션 대비 1.5~2배 수준으로 끝낼 수 있다. 결과 품질 향상까지 고려하면 비용 손해는 아니다.

- **작업에 필요한 인원만 띄운다.** 풀세트 13명을 매번 부르면 의미 없다. 작업 성격에 맞춰 3~5명으로 끊는다.
- **Teammate 모델을 작업 난이도에 맞춘다.** Architect만 Opus, 나머지는 Sonnet 또는 Haiku. `/config`의 default teammate model 설정 또는 spawn 프롬프트에서 직접 지정한다.
- **Read-only 에이전트는 도구를 제한한다.** PM/Architect는 `Write`/`Edit` 없이 `Read`/`Grep`만 줘도 충분하다. 불필요한 도구 호출이 줄어든다.
- **Architect 단계에서 파일 소유권을 분명히 나눈다.** 재작업이 없으면 컨텍스트도 부풀지 않는다.
- **작업 크기를 작게 자른다.** 한 teammate가 5~6개 task로 끝나는 정도면 컨텍스트 윈도우가 안 터진다.
- **단순 작업엔 일반 subagent로 끊는다.** 팀 모드는 진짜 분업 가치가 있을 때만.

요약하면 **사람 적게, 모델 가볍게, 도구 좁게, 작업 잘게**. 이 네 가지가 토큰 청구서를 결정한다.

---

## "잘 써보인다"는 메타 효과 — 인정한다

5개 pane에서 PM/Architect/Dev/QA가 각자 다른 작업으로 깜박이고 있는 화면은 솔직히 멋있어 보인다. 카페에서 옆자리 사람이 흘끔거리는 정도의 비주얼이다.

근데 그게 다였으면 안 쓴다. 실제로 결과 품질이 올라가니까 쓰는 거다. 책임 영역이 분리되고 컨텍스트가 격리되니까 한 명한테 다 시키는 것보다 누락이 적다. Architect가 만든 파일 소유권 매트릭스는 한 사람짜리 세션에서는 잘 안 만들어지는 산출물이다.

시각 효과 자체가 목표는 아니다. 결과 품질을 위해 분업하다 보니 부수적으로 화면이 보기 좋아진 거다.

---

## 5명은 워밍업, 진짜는 13인 조직도

블로그 같은 작은 프로젝트는 5명 MVP 팀(PM/Architect/BE/FE/QA)으로 충분하다. 하지만 회사 실무 코드베이스는 도메인이 더 잘게 쪼개진다. 영역별 특화 에이전트를 추가하면 각자가 자기 도메인 전문 지식으로 답한다.

내가 회사 실무에서 쓰는 풀세트 조직도다.

| 역할 | 책임 영역 | 언제 투입 |
|---|---|---|
| **PM** | 요구사항 명확화, 스펙 작성, 우선순위 | 모든 작업 시작점 |
| **PL** | 일정/진척 관리, 의존성 트래킹 | 다중 워크스트림일 때 |
| **Architect** | 시스템 설계, 모듈 경계, 파일 소유권 | 신규 모듈/큰 변경 시 |
| **기획자** | 사용자 시나리오, 플로우 차트 | 신규 기능 정의 단계 |
| **Designer** | UI/UX 결정, 디자인 시스템 일관성 | 시각적 산출물 작업 |
| **퍼블리셔** | 디자인 → 마크업/CSS 코드화 | 디자이너 산출물 받은 직후 |
| **BE Dev** | 서버 로직, API 구현, 도메인 모델 | 백엔드 작업 |
| **FE Dev** | 클라이언트 로직, 상태 관리, 인터랙션 | 프론트엔드 작업 |
| **DBA** | 스키마 설계, 쿼리 튜닝, 인덱스 전략 | DB 변경 시 |
| **인프라** | 배포 파이프라인, CI/CD, 모니터링 | 환경/배포 작업 |
| **보안** | 취약점 점검, 키 관리, 감사 로그 | 인증/결제/민감 로직 작업 |
| **QA** | 테스트 시나리오, 빌드/시각 회귀, 사인오프 | 모든 구현 완료 후 |
| **VoC** | 사용자 피드백 수집·정리, 이슈 우선순위 제안 | 사용자 제보 처리 단계 |
| **(게임 시) 작가** | 시나리오, 내러티브, 카피라이팅 | 게임 콘텐츠 작업 |

각 에이전트는 `~/.claude/agents/{role}.md` 하나로 정의된다. YAML frontmatter에 `name`, `description`, `tools`, `model` 박고 시스템 프롬프트에 책임/금지사항 적으면 끝이다. 한번 만들면 모든 프로젝트에서 재사용된다.

특화의 의미는 **그 도메인 외 잡음이 안 들어온다**는 거다. 보안 에이전트는 OWASP 체크리스트 기준으로만 본다. DBA 에이전트는 N+1, 인덱스 누락, 트랜잭션 격리 수준만 본다. 풀스택 단일 에이전트는 이 모든 걸 동시에 봐야 해서 정작 중요한 사각지대를 놓친다.

---

## 어떤 작업에 어떤 구성?

작업 성격에 따라 lead한테 구성을 지시한다. 사람 늘리는 게 능사는 아니다.

| 작업 유형 | 구성 | 이유 |
|---|---|---|
| 블로그 글/페이지 추가 | 일반 subagent | 팀 띄울 정도가 아님 |
| 단순 기능 추가 (필터/검색 등) | 5명 MVP | 풀스택이지만 범위 명확 |
| 신규 풀스택 모듈 | 8명 (+Designer/퍼블리셔/DBA) | 디자인부터 DB까지 전 레이어 |
| 보안 감사 / 취약점 점검 | 3명 (보안+Architect+QA) | 코드 변경 없이 조사만 |
| 결제/인증 로직 | 6명 (5명+보안) | 보안 게이트 필수 |
| 인프라/배포 작업 | 3명 (인프라+Architect+QA) | 코드 영향보다 환경 영향 검증 중심 |
| 게임 신규 콘텐츠 | 4명 (작가+기획+Designer+Dev) | 스토리부터 구현까지 |

작업 시작 전에 "이번 작업에 누구 누구 붙여" 라고 lead한테 명시한다. 그러지 않으면 lead가 임의로 풀세트를 띄울 수 있다.

---

## 단순 작업엔 쓰지 마라

오해 방지. 모든 작업을 팀으로 굴리면 안 된다.

- **타이포 수정** — 일반 Claude Code 한 명으로 충분
- **라이브러리 1줄 업그레이드** — 팀 띄우는 오버헤드가 작업 자체보다 큼
- **테스트 1개 추가** — subagent 한 명 호출이 빠름
- **README 업데이트** — 팀 모드 자체가 낭비

기준은 단순하다. **풀스택 분업이 자연스럽게 떠오르는 작업**일 때만 팀을 띄운다. 한 사람이 머릿속에서 다 처리할 수 있는 크기면 단일 세션이 정답이다.

토큰 5배는 진짜 5배다. 가볍게 보면 안 된다.

---

## 마무리

협력업체 메타포는 잘 맞는다. 대표한테만 발주하고 나머지는 알아서 분업하는 구조가 실제로 그렇게 돌아간다. 다만 외주사 고를 때처럼 작업 크기와 구성을 가려서 발주해야 한다. 풀세트 팀을 매번 띄우는 게 능사가 아니라는 점만 명심하면, 단일 세션으로 만드는 결과보다 누락이 적다.

---

## 출처

- [Claude Code Agent Teams 공식 문서](https://code.claude.com/docs/en/agent-teams)
- [Claude Code Subagents](https://code.claude.com/docs/en/sub-agents)
- [Run agents in parallel — 비교 가이드](https://code.claude.com/docs/en/agents)
- [How Anthropic teams use Claude Code](https://claude.com/blog/how-anthropic-teams-use-claude-code)
- [Building a C compiler with a team of parallel Claudes — Anthropic Engineering](https://www.anthropic.com/engineering/building-c-compiler)
- [psmux — Windows native tmux (GitHub)](https://github.com/psmux/psmux)
