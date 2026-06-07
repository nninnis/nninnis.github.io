---
layout: post
title: "Claude Code vs Codex — 주력 에이전트를 뭘로 둘 것인가"
date: 2026-06-08
category: claude-code
---

결론부터: 나는 Claude Code(Opus 4.8)를 주력으로 두고 Codex(GPT-5.5)를 플러그인으로 붙여 보조로 쓴다. Codex를 주력으로 두는 것도 똑같이 합리적인 선택이다. 갈리는 지점은 "벤치마크 점수"가 아니라 **오케스트레이션 모델과 하네스 구조**다. 이 글은 그 갈림길을 팩트 기준으로 정리한다.

이전 글([Codex 플러그인 실무 워크플로우](/claude-code/2026/05/07/claude-code-codex-plugin-workflow/))에서 플러그인 *사용법*은 다뤘으니, 여기서는 "주력 도구로 뭘 고를까" 관점만 본다.

---

## 출발점 — "커서가 더 좋다"는 오해

내가 Claude Code를 그렇게 권해도, 내 주변 사람들은 한동안 "커서가 더 좋다"며 Cursor를 놓지 않았다. 이유를 들여다보면 대부분 같은 오해 위에 서 있다.

- **"커서에서 쓰는 Sonnet/Opus나 Claude Code에서 쓰는 거나 똑같은 모델 아니냐"** — 모델 가중치는 같다. 하지만 같은 모델이라도 어떤 하네스(컨텍스트 주입, 툴 정의, 메모리, 후크)에 얹히느냐에 따라 결과물이 갈린다. 하네스 개념이 없으면 이 차이 자체가 안 보인다.
- **"커서는 여러 모델을 고를 수 있으니 Claude 모델만 쓰는 것보다 우월하다"** — 모델 선택지 수가 곧 에이전트 성능은 아니다. 모델을 바꿔 끼우는 것과, 하네스를 그 모델에 맞게 깎는 것은 다른 레이어의 일이다.

근본 원인은 하나다. **모델 자체를 에이전트라고 생각하는 것.** 컨텍스트 엔지니어링이라는 레이어가 있다는 걸 모르면, 도구 비교가 "어느 모델이 더 똑똑한가"로 납작해진다. 실제로 결과를 가르는 건 그 위에 얹힌 하네스인데도.

그래서 하네스를 의식하기 시작한 사람들은 IDE 안의 어시스턴트에서 **CLI 기반 에이전트**로 넘어간다. 그리고 그 종착지에서 다시 Claude Code와 Codex로 갈린다. 질문이 "Cursor냐 아니냐"에서 "클코냐 코덱스냐"로 바뀌는 지점이다.

---

## 먼저 짚을 것 — 두 도구는 한쪽 방향으로만 공식 연동된다

이게 의사결정에 생각보다 크게 작용한다. 2026년 6월 현재:

- **Codex → Claude Code (공식 O):** OpenAI가 `openai/codex-plugin-cc`를 2026년 3월 30일에 공식 배포했다. Claude Code 세션 안에서 슬래시 커맨드로 Codex에 리뷰·위임을 던질 수 있다. MCP 서버 방식이고, 로컬 `codex` 바이너리와 `config.toml`, 기존 MCP·샌드박스 설정을 그대로 상속한다.
- **Claude Code → Codex (공식 X):** 반대로 Codex 세션 안에서 Claude Code를 공식 플러그인으로 붙이는 경로는 없다. 커뮤니티가 만든 비공식 "Claude plugin for Codex"가 있을 뿐이고, Codex가 Claude Code 마켓플레이스를 자동 미러링하다가 `${CLAUDE_PLUGIN_ROOT}` 치환을 못 해서 MCP 핸드셰이크가 깨지는 이슈도 보고돼 있다(openai/codex#19372).

즉 **Claude Code를 허브로 두면 Codex를 정식으로 흡수할 수 있지만, 반대는 매끄럽지 않다.** 내가 클코를 주력에 두는 첫 번째 실무적 이유가 이거다. 두 모델을 다 쓰고 싶다면 허브는 클코가 유리하다.

---

## 모델 성능 — 벤치마크는 워크로드에 따라 갈린다

수치만 보면 한쪽 압승이 아니다. 출시일과 코딩 벤치마크를 정리하면:

| 항목 | Claude Opus 4.8 | GPT-5.5 |
|------|-----------------|---------|
| 출시일 | 2026-05-28 | 2026-04-23 (API 4-24) |
| SWE-Bench Verified | 88.6% | — |
| SWE-Bench Pro | **69.2%** | 58.6% |
| Terminal-Bench 2.1 | 74.6% | **78.2%** |
| API 표준가 (in/out, /1M tok) | $5 / $25 | $5 / $30 |

해석:

- **레포 단위 이슈 해결**(모듈 경계를 넘는 멀티스텝 패치)은 Opus 4.8이 SWE-Bench Pro에서 10%p 이상 앞선다.
- **터미널 주도 에이전틱 코딩**은 GPT-5.5가 Terminal-Bench 2.1에서 앞선다.

한 가지 함정은 이 "터미널 강세"가 실제 사용 환경과 꼭 일치하지 않는다는 점이다. Terminal-Bench는 말 그대로 터미널 구동을 가정한 벤치마크지만, 정작 Codex를 쓰는 경우 상당수는 CLI가 아니라 **Codex 데스크톱(GUI)**으로 들어온다. CLI보다 GUI가 익숙한 사용자가 그만큼 많다는 뜻이고, 그러면 벤치마크가 측정한 강점이 실사용에선 그대로 안 살아날 수 있다.

벤치마크 수치는 모두 서드파티 측정치이고 측정 환경에 따라 흔들린다. 절대 점수보다 **"내 워크로드가 레포 전반 리팩터링이냐, 터미널 자동화냐"** 그리고 **"나는 CLI로 굴리나, GUI로 굴리나"**가 더 현실적인 판단 기준이다.

---

## 멀티 에이전트 / 서브에이전트 — 구조가 다르다

오케스트레이션을 어떻게 하느냐가 실제 사용감을 가른다.

### Claude Code

- **Subagents:** 커스텀 프롬프트·툴·격리를 가진 재사용 에이전트 설정. 메인 세션이 워커로 호출한다.
- **Agent Teams** (2026-02-05, Research Preview): 리드 에이전트가 전문 서브에이전트에게 병렬 위임. split-pane 모드를 켜면 각 팀원이 자기 pane을 갖고, 터미널에 따라 **tmux / iTerm2를 자동 감지**해 분할한다.
- **Agent View** (2026-05-11, Research Preview): tmux 바둑판을 직접 깔지 않고도 여러 세션을 단일 리스트 대시보드 한 화면에서 관리. 클코 프로세스 상태를 직접 읽어 테이블로 반영한다.

### Codex

- **Subagents:** explorer(읽기 전용 분석) / worker(읽기-쓰기 실행) / default(범용) 3가지 역할. 사용자가 명시적으로 요청할 때만 spawn하고, 최대 6개까지 동시 실행한다.
- 설정은 `config.toml`의 `[agents]` 섹션에서: `max_threads = 6`(동시 스레드), `max_depth = 1`(중첩 깊이), `job_max_runtime_seconds = 300`. 모든 결과가 모일 때까지 기다렸다가 한 번에 통합 응답을 준다.

차이를 한 줄로: **클코는 "팀/뷰"라는 UI 레이어까지 얹어 다중 세션 관찰성을 챙겼고, 코덱스는 config 기반으로 빡세게 통제되는 병렬 워커에 가깝다.** 여러 세션을 띄워놓고 상태를 눈으로 훑어야 하는 1인 멀티트랙 작업엔 클코의 Agent View가, 정해진 작업을 정확히 N개로 쪼개 돌리는 데는 코덱스의 명시적 서브에이전트가 손에 붙는다.

---

## tmux 바둑판 에이전트 뷰 — 직접 깔 것인가, 내장을 쓸 것인가

여러 에이전트를 동시에 띄워놓고 바둑판으로 보는 방식엔 두 갈래가 있다.

1. **직접 tmux 그리드:** 세션마다 pane을 나눠 한 탭에 깔아두는 고전적 방법. 완전한 제어권을 갖지만 상태 추적은 수동이다.
2. **클코 내장:** Agent Teams의 split-pane(tmux/iTerm2 자동 감지) 또는 Agent View의 단일 대시보드.

내 결론은 **둘은 대체재가 아니라 보완재**다. 자유도가 필요하고 비표준 프로세스까지 한 화면에 묶고 싶으면 직접 tmux가 낫고, "지금 어느 세션이 입력을 기다리는가"를 빠르게 보려면 Agent View가 낫다. 코덱스에는 이 관찰성 레이어가 클코만큼 정돈돼 있지 않아서, 코덱스로 다중 인스턴스를 CLI에서 굴리려면 결국 tmux를 직접 까는 쪽이 된다.

---

## 하네스 엔지니어링 관점

모델 점수보다 오래 가는 차이는 **하네스**(컨텍스트 주입, 툴 정의, 메모리, 후크, 플러그인)다.

- **Claude Code:** `CLAUDE.md` + 스킬 + 플러그인 + 후크로 하네스를 세밀하게 조립할 수 있다. Codex 플러그인의 review gate(Stop Hook으로 응답마다 자동 리뷰)처럼, 하네스에 다른 모델을 끼워 넣는 것도 가능하다.
- **Codex:** `config.toml` 중심으로 에이전트·샌드박스·스레드를 통제한다. 설정이 코드화돼 있어 재현성과 팀 공유가 깔끔하다.

방향성이 다르다. 클코는 **확장성과 조립**, 코덱스는 **선언적 통제와 재현성** 쪽이다. 하네스를 직접 깎아 쓰는 걸 즐기면 클코, 설정을 못 박아 안정적으로 돌리고 싶으면 코덱스가 손에 맞는다.

---

## 비용

| | Opus 4.8 표준 | GPT-5.5 표준 |
|---|---|---|
| Input (/1M) | $5 | $5 |
| Output (/1M) | $25 | $30 |
| 비고 | Fast Mode $10/$50 | Batch 50% 할인, Pro 티어 $30/$180 |

API 단가는 입력 동일, 출력은 Opus가 약간 싸다. 다만 나처럼 Claude Max + ChatGPT Plus 구독으로 쓰면 토큰 단가보다 **플랜 한도와 사용량 소진 속도**가 체감 비용을 좌우한다. 특히 클코에서 Codex review gate를 켜면 Claude↔Codex 루프가 길어져 양쪽 사용량이 동시에 빠진다(이전 글에서 경고한 그대로다).

---

## 정리 — 누가 뭘 주력으로 둬야 하나

- **Claude Code 주력이 맞는 사람:** 레포 전반을 넘나드는 리팩터링·마이그레이션이 잦고, 여러 세션 관찰성과 하네스 커스터마이징을 중시하고, 두 모델을 한 허브에서 섞고 싶은 경우. (= 내 케이스)
- **Codex 주력이 맞는 사람:** 터미널 주도 자동화 비중이 크거나 반대로 GUI 워크플로가 편하고, 선언적 config로 재현성 있게 묶고 싶고, GPT 계열 모델 성향이 손에 맞는 경우.

핵심은 **공식 연동이 단방향(Codex→클코)이라, 두 모델을 다 쓸 거면 허브는 클코가 유리하다**는 점이다. 한쪽만 깔끔하게 쓸 거라면 워크로드(레포 단위냐 터미널 단위냐)로 고르면 된다. 벤치마크 1~2점 차이로 고를 문제가 아니다.

---

Sources:
- [openai/codex-plugin-cc (GitHub)](https://github.com/openai/codex-plugin-cc)
- [Introducing Codex Plugin for Claude Code (OpenAI Developer Community)](https://community.openai.com/t/introducing-codex-plugin-for-claude-code/1378186)
- [Codex auto-mirrors Claude Code marketplaces — MCP handshake issue (openai/codex#19372)](https://github.com/openai/codex/issues/19372)
- [Subagents — Codex (OpenAI Developers)](https://developers.openai.com/codex/subagents)
- [Orchestrate teams of Claude Code sessions (Claude Code Docs)](https://code.claude.com/docs/en/agent-teams)
- [Claude Opus 4.8 vs GPT-5.5: Benchmarks & Pricing (DataCamp)](https://www.datacamp.com/blog/claude-opus-4-8-vs-gpt-5-5)
- [Claude Opus 4.8 Pricing (CloudZero)](https://www.cloudzero.com/blog/claude-opus-4-8-pricing/)
- [GPT-5.5 Pricing (apidog)](https://apidog.com/blog/gpt-5-5-pricing/)
